'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import {
  type DamageMarker,
  type DamageType,
  type DamageSeverity,
  DAMAGE_TYPE_LABELS,
  DAMAGE_SEVERITY_LABELS,
  DAMAGE_SEVERITY_COLORS,
} from '@/types/inspection'
import { DamagePhotoSection, type PhotoItem } from './damage-photo-section'

// Usage:
// <DamageMarkerPopup
//   open={isOpen}
//   onClose={() => setIsOpen(false)}
//   onSave={(marker) => addMarker({ ...marker, id: uuid(), view: 'top', x: 42, y: 30 })}
//   initialData={{ damage_type: 'dent', severity: 'moderate' }} // optional, for editing
// />

interface DamageMarkerPopupProps {
  open: boolean
  onClose: () => void
  onSave: (marker: Omit<DamageMarker, 'id' | 'view' | 'x' | 'y'>) => void
  initialData?: Partial<DamageMarker>
}

const DAMAGE_TYPE_OPTIONS: DamageType[] = [
  'scratch',
  'dent',
  'paint',
  'crack',
  'broken',
  'missing',
  'rust',
  'other',
]

const DAMAGE_SEVERITY_OPTIONS: DamageSeverity[] = ['light', 'moderate', 'severe']

const DEFAULT_DAMAGE_TYPE: DamageType = 'scratch'
const DEFAULT_SEVERITY: DamageSeverity = 'light'

export function DamageMarkerPopup({
  open,
  onClose,
  onSave,
  initialData,
}: DamageMarkerPopupProps) {
  const [damageType, setDamageType] = useState<DamageType>(DEFAULT_DAMAGE_TYPE)
  const [severity, setSeverity] = useState<DamageSeverity>(DEFAULT_SEVERITY)
  const [description, setDescription] = useState('')
  const [photos, setPhotos] = useState<PhotoItem[]>([])

  // ID temporal para organizar fotos en Storage.
  // Si es edición usa el ID real del marker, si es nuevo genera uno temporal.
  const effectiveMarkerId = useMemo(
    () => initialData?.id ?? crypto.randomUUID(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [open],
  )

  // Sync form state whenever the popup opens or initialData changes
  useEffect(() => {
    if (open) {
      setDamageType(initialData?.damage_type ?? DEFAULT_DAMAGE_TYPE)
      setSeverity(initialData?.severity ?? DEFAULT_SEVERITY)
      setDescription(initialData?.description ?? '')
      setPhotos(
        (initialData?.photo_urls ?? []).map((url) => ({ url, path: '' })),
      )
    }
  }, [open, initialData])

  function handleSave() {
    onSave({
      damage_type: damageType,
      severity,
      description,
      photo_urls: photos.map((p) => p.url),
    })
    onClose()
  }

  const isEditing = Boolean(initialData?.damage_type || initialData?.severity)

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl px-4 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-5 max-h-[90dvh] overflow-y-auto"
      >
        <SheetHeader className="mb-5 text-left">
          <SheetTitle className="text-base font-semibold">
            {isEditing ? 'Editar daño' : 'Registrar daño'}
          </SheetTitle>
          <SheetDescription className="text-xs">
            Selecciona el tipo y severidad del daño encontrado.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-6">
          {/* Damage type grid */}
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium">Tipo de daño</Label>
            <div className="grid grid-cols-2 gap-2" role="group" aria-label="Tipo de daño">
              {DAMAGE_TYPE_OPTIONS.map((type) => {
                const isSelected = damageType === type
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setDamageType(type)}
                    aria-pressed={isSelected}
                    className={cn(
                      'rounded-lg border px-3 py-3 text-sm font-medium transition-colors text-left',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                      isSelected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    {DAMAGE_TYPE_LABELS[type]}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Severity selector */}
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium">Severidad</Label>
            <div
              className="grid grid-cols-3 gap-2"
              role="group"
              aria-label="Severidad del daño"
            >
              {DAMAGE_SEVERITY_OPTIONS.map((level) => {
                const isSelected = severity === level
                const color = DAMAGE_SEVERITY_COLORS[level]
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setSeverity(level)}
                    aria-pressed={isSelected}
                    className={cn(
                      'flex flex-col items-center gap-1.5 rounded-lg border px-2 py-2.5 text-xs font-medium transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    {/* Color swatch */}
                    <span
                      className="size-4 rounded-full border border-black/10"
                      style={{ backgroundColor: color }}
                      aria-hidden="true"
                    />
                    {DAMAGE_SEVERITY_LABELS[level]}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Optional description */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="damage-description" className="text-sm font-medium">
              Notas{' '}
              <span className="font-normal text-muted-foreground">(opcional)</span>
            </Label>
            <Textarea
              id="damage-description"
              placeholder="Ej: Rayón profundo en la puerta delantera izquierda..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Photos */}
          <DamagePhotoSection
            photos={photos}
            onChange={setPhotos}
            markerId={effectiveMarkerId}
          />

          {/* Save button */}
          <Button
            type="button"
            className="w-full mt-1"
            onClick={handleSave}
          >
            Guardar
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
