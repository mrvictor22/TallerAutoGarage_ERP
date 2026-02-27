'use client';

/**
 * BodyTypeSelector
 *
 * Displays 4 visual cards for selecting a vehicle body type during inspection.
 *
 * Usage:
 * ```tsx
 * import { BodyTypeSelector } from '@/components/inspection/body-type-selector';
 * import type { VehicleBodyType } from '@/types/inspection';
 *
 * const [bodyType, setBodyType] = useState<VehicleBodyType | null>(null);
 *
 * <BodyTypeSelector value={bodyType} onChange={setBodyType} />
 * <BodyTypeSelector value={bodyType} onChange={setBodyType} readOnly />
 * ```
 */

import { Car, Truck, CarFront, Bus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VEHICLE_BODY_TYPE_LABELS, type VehicleBodyType } from '@/types/inspection';
import type { LucideIcon } from 'lucide-react';

interface BodyTypeSelectorProps {
  value: VehicleBodyType | null;
  onChange: (type: VehicleBodyType) => void;
  readOnly?: boolean;
}

interface BodyTypeOption {
  type: VehicleBodyType;
  icon: LucideIcon;
  label: string;
}

const BODY_TYPE_OPTIONS: BodyTypeOption[] = [
  { type: 'sedan',  icon: Car,      label: VEHICLE_BODY_TYPE_LABELS.sedan },
  { type: 'pickup', icon: Truck,    label: VEHICLE_BODY_TYPE_LABELS.pickup },
  { type: 'suv',    icon: CarFront, label: VEHICLE_BODY_TYPE_LABELS.suv },
  { type: 'van',    icon: Bus,      label: VEHICLE_BODY_TYPE_LABELS.van },
];

export function BodyTypeSelector({
  value,
  onChange,
  readOnly = false,
}: BodyTypeSelectorProps) {
  return (
    <fieldset
      className="border-0 p-0 m-0"
      aria-label="Tipo de carrocería del vehículo"
      disabled={readOnly}
    >
      <div
        role="radiogroup"
        aria-label="Tipo de carrocería"
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        {BODY_TYPE_OPTIONS.map(({ type, icon: Icon, label }) => {
          const isSelected = value === type;

          return (
            <button
              key={type}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={label}
              onClick={() => {
                if (!readOnly) onChange(type);
              }}
              className={cn(
                // Base layout and sizing — min-h satisfies 44px touch target
                'flex min-h-[4.5rem] flex-col items-center justify-center gap-2 rounded-lg border px-3 py-3 transition-colors',
                // Focus ring for keyboard navigation
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                // Selected state
                isSelected && !readOnly && [
                  'border-primary bg-primary/10 text-primary',
                ],
                // Selected + readOnly: muted highlight instead of primary
                isSelected && readOnly && [
                  'border-muted-foreground/40 bg-muted text-muted-foreground',
                ],
                // Unselected interactive
                !isSelected && !readOnly && [
                  'border-border bg-transparent text-muted-foreground',
                  'hover:border-primary/50 hover:bg-primary/5 hover:text-foreground',
                  'cursor-pointer',
                ],
                // Unselected readOnly
                !isSelected && readOnly && [
                  'border-border bg-transparent text-muted-foreground/50',
                ],
                // Pointer events when readOnly
                readOnly && 'pointer-events-none',
              )}
            >
              <Icon
                className={cn(
                  'size-6 shrink-0',
                  isSelected && !readOnly && 'text-primary',
                  isSelected && readOnly && 'text-muted-foreground',
                  !isSelected && 'text-current',
                )}
                aria-hidden
              />
              <span className="text-xs font-medium leading-none">{label}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
