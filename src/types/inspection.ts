export type VehicleBodyType = 'sedan' | 'pickup' | 'suv' | 'van'

export type DamageType =
  | 'scratch'
  | 'dent'
  | 'paint'
  | 'crack'
  | 'broken'
  | 'missing'
  | 'rust'
  | 'other'

export type DamageSeverity = 'light' | 'moderate' | 'severe'

export type DiagramView = 'top' | 'front' | 'left' | 'right'

export interface DamageMarker {
  id: string
  view: DiagramView
  x: number // 0-100 normalized percentage
  y: number // 0-100 normalized percentage
  damage_type: DamageType
  severity: DamageSeverity
  description: string
  photo_urls: string[]
}

export interface InventoryCheckItem {
  id: string
  label: string
  checked: boolean
  notes?: string
}

export interface VehicleInspection {
  vehicle_type: VehicleBodyType
  markers: DamageMarker[]
  checklist: InventoryCheckItem[]
}

// Default checklist items for V1
export const DEFAULT_CHECKLIST_ITEMS: Omit<InventoryCheckItem, 'id'>[] = [
  { label: 'Radio / Estéreo', checked: false },
  { label: 'Llanta de Repuesto', checked: false },
  { label: 'Extintor', checked: false },
  { label: 'Mica (espejos)', checked: false },
  { label: 'Conos / Triángulos', checked: false },
  { label: 'Alfombras', checked: false },
  { label: 'Emblemas', checked: false },
  { label: 'Gato Hidráulico', checked: false },
  { label: 'Llave de Ruedas', checked: false },
  { label: 'Plumillas (limpiabrisas)', checked: false },
  { label: 'Tapones de Rueda', checked: false },
  { label: 'Antena', checked: false },
]

export const DAMAGE_TYPE_LABELS: Record<DamageType, string> = {
  scratch: 'Rayón',
  dent: 'Abolladura',
  paint: 'Pintura dañada',
  crack: 'Grieta',
  broken: 'Roto',
  missing: 'Faltante',
  rust: 'Óxido',
  other: 'Otro',
}

export const DAMAGE_SEVERITY_LABELS: Record<DamageSeverity, string> = {
  light: 'Leve',
  moderate: 'Moderado',
  severe: 'Severo',
}

export const DAMAGE_TYPE_COLORS: Record<DamageType, string> = {
  scratch: '#F59E0B',
  dent: '#EF4444',
  paint: '#8B5CF6',
  crack: '#DC2626',
  broken: '#991B1B',
  missing: '#6B7280',
  rust: '#B45309',
  other: '#3B82F6',
}

export const DAMAGE_SEVERITY_COLORS: Record<DamageSeverity, string> = {
  light: '#FCD34D',
  moderate: '#F97316',
  severe: '#EF4444',
}

export const VEHICLE_BODY_TYPE_LABELS: Record<VehicleBodyType, string> = {
  sedan: 'Sedán',
  pickup: 'Pickup',
  suv: 'SUV',
  van: 'Van',
}

export const DIAGRAM_VIEW_LABELS: Record<DiagramView, string> = {
  top: 'Superior',
  front: 'Frontal',
  left: 'Lateral Izq.',
  right: 'Lateral Der.',
}
