'use client'

/**
 * VehicleInspection
 *
 * Top-level orchestrator for the vehicle intake inspection form.
 * Combines body type selection, damage diagram, inventory checklist,
 * and fuel/mileage entry into a single tabbed interface.
 *
 * Usage:
 * ```tsx
 * import { VehicleInspection } from '@/components/inspection/vehicle-inspection'
 * import type { VehicleInspection as VehicleInspectionData, VehicleBodyType } from '@/types/inspection'
 *
 * // Editable (new order form)
 * <VehicleInspection
 *   value={inspection}
 *   onChange={setInspection}
 *   fuelLevel={fuelLevel}
 *   onFuelLevelChange={setFuelLevel}
 *   entryMileage={mileage}
 *   onEntryMileageChange={setMileage}
 *   bodyType={bodyType}
 *   onBodyTypeChange={setBodyType}
 * />
 *
 * // Read-only (order detail view)
 * <VehicleInspection
 *   value={inspection}
 *   onChange={() => {}}
 *   fuelLevel={fuelLevel}
 *   onFuelLevelChange={() => {}}
 *   entryMileage={mileage}
 *   onEntryMileageChange={() => {}}
 *   bodyType={bodyType}
 *   onBodyTypeChange={() => {}}
 *   readOnly
 * />
 * ```
 */

import { useState, useCallback, useMemo, useEffect } from 'react'

import {
  type VehicleBodyType,
  type DiagramView,
  type DamageMarker,
  type InventoryCheckItem,
  type VehicleInspection as VehicleInspectionData,
  DEFAULT_CHECKLIST_ITEMS,
} from '@/types/inspection'

import { BodyTypeSelector } from './body-type-selector'
import { VehicleDiagram } from './vehicle-diagram'
import { DamageMarkerPopup } from './damage-marker-popup'
import { DamageMarkerList } from './damage-marker-list'
import { InspectionChecklist } from './inspection-checklist'
import { FuelGauge } from './fuel-gauge'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// ─── Props ────────────────────────────────────────────────────────────────────

interface VehicleInspectionProps {
  value: VehicleInspectionData | null
  onChange: (inspection: VehicleInspectionData) => void
  fuelLevel: number
  onFuelLevelChange: (level: number) => void
  entryMileage: string
  onEntryMileageChange: (mileage: string) => void
  bodyType: VehicleBodyType | null
  onBodyTypeChange: (type: VehicleBodyType) => void
  readOnly?: boolean
}

// ─── Pending marker position ──────────────────────────────────────────────────

interface PendingMarkerPosition {
  view: DiagramView
  x: number
  y: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build a fresh checklist from the static defaults, assigning a unique UUID
 * to every item. Called once when no prior inspection value exists.
 */
function buildDefaultChecklist(): InventoryCheckItem[] {
  return DEFAULT_CHECKLIST_ITEMS.map((item) => ({
    ...item,
    id: crypto.randomUUID(),
  }))
}

/**
 * Return the current inspection value or a blank one initialised from the
 * given body type and default checklist.
 */
function resolveInspection(
  value: VehicleInspectionData | null,
  bodyType: VehicleBodyType,
): VehicleInspectionData {
  if (value) return value
  return {
    vehicle_type: bodyType,
    markers: [],
    checklist: buildDefaultChecklist(),
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function VehicleInspection({
  value,
  onChange,
  fuelLevel,
  onFuelLevelChange,
  entryMileage,
  onEntryMileageChange,
  bodyType,
  onBodyTypeChange,
  readOnly = false,
}: VehicleInspectionProps) {
  // ── Internal state ──────────────────────────────────────────────────────────

  /** Which of the four diagram views is currently active */
  const [activeView, setActiveView] = useState<DiagramView>('top')

  /** Position on the diagram where the user tapped — stored until popup is saved/cancelled */
  const [pendingPosition, setPendingPosition] = useState<PendingMarkerPosition | null>(null)

  /** Marker being edited via the popup (null = adding a new one) */
  const [editingMarker, setEditingMarker] = useState<DamageMarker | null>(null)

  /** Whether the DamageMarkerPopup sheet is open */
  const [isPopupOpen, setIsPopupOpen] = useState(false)

  // ── Derived values ──────────────────────────────────────────────────────────

  const markers = useMemo(() => value?.markers ?? [], [value?.markers])
  const checklist = useMemo(() => value?.checklist ?? [], [value?.checklist])

  // In readOnly mode, auto-select the first view that has markers
  useEffect(() => {
    if (readOnly && markers.length > 0) {
      const viewsWithMarkers: DiagramView[] = ['top', 'front', 'left', 'right']
      const firstWithDamage = viewsWithMarkers.find(v =>
        markers.some(m => m.view === v)
      )
      if (firstWithDamage) setActiveView(firstWithDamage)
    }
  }, [readOnly, markers])

  // ── Helpers: emit updated inspection ───────────────────────────────────────

  const emitChange = useCallback(
    (patch: Partial<VehicleInspectionData>, currentBodyType: VehicleBodyType) => {
      const base = resolveInspection(value, currentBodyType)
      onChange({ ...base, ...patch })
    },
    [value, onChange],
  )

  // ── Body type selection ─────────────────────────────────────────────────────

  const handleBodyTypeChange = useCallback(
    (type: VehicleBodyType) => {
      onBodyTypeChange(type)
      // Keep existing data but update vehicle_type
      const existing = value
        ? { ...value, vehicle_type: type }
        : {
            vehicle_type: type,
            markers: [],
            checklist: buildDefaultChecklist(),
          }
      onChange(existing)
    },
    [onBodyTypeChange, value, onChange],
  )

  // ── Diagram: add marker ─────────────────────────────────────────────────────

  const handleDiagramClick = useCallback(
    (view: DiagramView, x: number, y: number) => {
      if (readOnly || !bodyType) return
      setPendingPosition({ view, x, y })
      setEditingMarker(null)
      setIsPopupOpen(true)
    },
    [readOnly, bodyType],
  )

  // ── Popup: save ─────────────────────────────────────────────────────────────

  const handlePopupSave = useCallback(
    (partial: Omit<DamageMarker, 'id' | 'view' | 'x' | 'y'>) => {
      if (!bodyType) return

      if (editingMarker) {
        // Update existing marker
        const updated = markers.map((m) =>
          m.id === editingMarker.id ? { ...m, ...partial } : m,
        )
        emitChange({ markers: updated }, bodyType)
      } else if (pendingPosition) {
        // Add new marker
        const newMarker: DamageMarker = {
          id: crypto.randomUUID(),
          view: pendingPosition.view,
          x: pendingPosition.x,
          y: pendingPosition.y,
          ...partial,
        }
        emitChange({ markers: [...markers, newMarker] }, bodyType)
      }

      // Reset popup state
      setPendingPosition(null)
      setEditingMarker(null)
    },
    [bodyType, editingMarker, markers, pendingPosition, emitChange],
  )

  // ── Popup: close without saving ─────────────────────────────────────────────

  const handlePopupClose = useCallback(() => {
    setIsPopupOpen(false)
    setPendingPosition(null)
    setEditingMarker(null)
  }, [])

  // ── Marker list: edit ───────────────────────────────────────────────────────

  const handleEditMarker = useCallback((marker: DamageMarker) => {
    setEditingMarker(marker)
    setPendingPosition(null)
    setIsPopupOpen(true)
  }, [])

  // ── Marker list: delete ─────────────────────────────────────────────────────

  const handleDeleteMarker = useCallback(
    (markerId: string) => {
      if (!bodyType) return
      emitChange({ markers: markers.filter((m) => m.id !== markerId) }, bodyType)
    },
    [bodyType, markers, emitChange],
  )

  // ── Diagram: pin click → open edit popup ────────────────────────────────────

  const handleSelectMarker = useCallback(
    (marker: DamageMarker) => {
      if (!readOnly) {
        handleEditMarker(marker)
      }
    },
    [readOnly, handleEditMarker],
  )

  // ── Checklist ───────────────────────────────────────────────────────────────

  const handleChecklistChange = useCallback(
    (items: InventoryCheckItem[]) => {
      if (!bodyType) return
      emitChange({ checklist: items }, bodyType)
    },
    [bodyType, emitChange],
  )

  // Ensure checklist is always initialized when the tab is first accessed
  const resolvedChecklist: InventoryCheckItem[] =
    checklist.length > 0 ? checklist : buildDefaultChecklist()

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-5">
      {/* ── Body type selector ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Tipo de vehículo</CardTitle>
        </CardHeader>
        <CardContent>
          <BodyTypeSelector
            value={bodyType}
            onChange={handleBodyTypeChange}
            readOnly={readOnly}
          />
        </CardContent>
      </Card>

      {/* ── Main tabs (only rendered once a body type is selected) ─────────── */}
      {bodyType && (
        <Tabs defaultValue="diagrama" className="w-full">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="diagrama">Diagrama</TabsTrigger>
            <TabsTrigger value="inventario">Inventario</TabsTrigger>
            <TabsTrigger value="combustible">Combustible</TabsTrigger>
          </TabsList>

          {/* ── Diagrama tab ──────────────────────────────────────────────── */}
          <TabsContent value="diagrama" className="mt-4 flex flex-col gap-4">
            <VehicleDiagram
              bodyType={bodyType}
              markers={markers}
              activeView={activeView}
              onViewChange={setActiveView}
              onAddMarker={handleDiagramClick}
              onSelectMarker={handleSelectMarker}
              readOnly={readOnly}
            />

            <DamageMarkerList
              markers={markers}
              onEdit={readOnly ? undefined : handleEditMarker}
              onDelete={readOnly ? undefined : handleDeleteMarker}
              readOnly={readOnly}
            />
          </TabsContent>

          {/* ── Inventario tab ────────────────────────────────────────────── */}
          <TabsContent value="inventario" className="mt-4">
            <InspectionChecklist
              items={resolvedChecklist}
              onChange={handleChecklistChange}
              readOnly={readOnly}
            />
          </TabsContent>

          {/* ── Combustible tab ───────────────────────────────────────────── */}
          <TabsContent value="combustible" className="mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Combustible y kilometraje</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-6">
                {/* Fuel gauge */}
                <div className="flex flex-col items-center gap-2">
                  <Label className="self-start text-sm font-medium">Nivel de combustible</Label>
                  <FuelGauge
                    value={fuelLevel}
                    onChange={onFuelLevelChange}
                    readOnly={readOnly}
                    className="w-full max-w-xs"
                  />
                </div>

                {/* Entry mileage */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="entry-mileage" className="text-sm font-medium">
                    Kilometraje de entrada
                  </Label>
                  <div className="relative">
                    <Input
                      id="entry-mileage"
                      type="number"
                      inputMode="numeric"
                      min={0}
                      placeholder="Ej: 45000"
                      value={entryMileage}
                      onChange={(e) => onEntryMileageChange(e.target.value)}
                      disabled={readOnly}
                      aria-label="Kilometraje de entrada del vehículo"
                      className="pr-10"
                    />
                    <span
                      className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground"
                      aria-hidden="true"
                    >
                      km
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* ── Damage marker popup (bottom sheet) ─────────────────────────────── */}
      <DamageMarkerPopup
        open={isPopupOpen}
        onClose={handlePopupClose}
        onSave={handlePopupSave}
        initialData={editingMarker ?? undefined}
      />
    </div>
  )
}
