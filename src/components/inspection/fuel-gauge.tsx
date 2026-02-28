/**
 * FuelGauge - SVG semicircular fuel gauge for vehicle inspection forms.
 *
 * Usage:
 *   <FuelGauge value={50} onChange={(v) => setFuel(v)} />
 *   <FuelGauge value={75} onChange={() => {}} readOnly />
 */

"use client"

import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SEGMENTS = 8
const SEGMENT_VALUES = [0, 13, 25, 38, 50, 63, 75, 88, 100] as const

/**
 * The gauge sweeps 180° starting at the left (180°) and ending at the right
 * (0°/360°), drawn as a top half-circle.  We work in SVG-angle space where
 * 0° is the positive-x axis and angles increase clockwise.
 *
 * Arc goes from startAngle (180°) → endAngle (0°) counter-clockwise in math
 * terms but in SVG we use the large-arc-flag to get the top semicircle.
 */
const CX = 100        // center x
const CY = 100        // center y (baseline at bottom of SVG)
const R_OUTER = 88    // outer radius of segments
const R_INNER = 60    // inner radius of segments (donut thickness = 28)
const GAP_DEG = 2.5   // visual gap between segments in degrees

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function degToRad(deg: number): number {
  return (deg * Math.PI) / 180
}

/**
 * Returns an SVG point on a circle of radius r centered at (CX, CY)
 * for a given angle in degrees (standard math convention: 0 = right, CCW positive).
 * In SVG the y-axis is flipped, so we negate sin.
 */
function polarToCartesian(angleDeg: number, r: number): { x: number; y: number } {
  const rad = degToRad(angleDeg)
  return {
    x: CX + r * Math.cos(rad),
    y: CY - r * Math.sin(rad),
  }
}

/**
 * Builds the SVG `d` attribute for a single donut arc segment.
 *
 * @param startDeg  - start angle in degrees (math convention, CCW from right)
 * @param endDeg    - end angle in degrees
 */
function arcPath(startDeg: number, endDeg: number): string {
  const innerStart = polarToCartesian(startDeg, R_INNER)
  const innerEnd   = polarToCartesian(endDeg,   R_INNER)
  const outerStart = polarToCartesian(startDeg, R_OUTER)
  const outerEnd   = polarToCartesian(endDeg,   R_OUTER)

  // large-arc-flag = 0 because each segment is < 180°
  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${R_OUTER} ${R_OUTER} 0 0 0 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${R_INNER} ${R_INNER} 0 0 1 ${innerStart.x} ${innerStart.y}`,
    "Z",
  ].join(" ")
}

/**
 * Maps a segment index (0-7) to a fill color using a red → yellow → green
 * gradient across the 8 positions.
 */
function segmentColor(index: number, filled: boolean, readOnly: boolean): string {
  if (!filled) {
    // Unfilled track — use a muted border-like color
    return "var(--border)"
  }

  // 8 colors interpolated: red (0) → amber (3) → yellow-green (5) → green (7)
  const palette = [
    "#ef4444", // 0  — red-500
    "#f97316", // 1  — orange-500
    "#f59e0b", // 2  — amber-500
    "#eab308", // 3  — yellow-500
    "#84cc16", // 4  — lime-500
    "#22c55e", // 5  — green-500
    "#16a34a", // 6  — green-600
    "#15803d", // 7  — green-700
  ]

  if (readOnly) {
    // Slightly desaturated in readOnly mode
    return palette[index]
  }

  return palette[index]
}

/**
 * Given a value (0-100), returns the index of the highest filled segment.
 * A segment n is filled when value >= SEGMENT_VALUES[n + 1] — except segment
 * 0 (E) which is filled when value > 0.
 *
 * The 8 segments map to the ranges:
 *   0 → [0, 12.5)
 *   1 → [12.5, 25)
 *   ...
 *   7 → [87.5, 100]
 */
function filledSegmentCount(value: number): number {
  // How many of the 8 segments should be lit
  if (value <= 0) return 0
  if (value >= 100) return 8
  // Find the highest segment whose threshold the value meets
  for (let i = SEGMENTS; i >= 1; i--) {
    if (value >= SEGMENT_VALUES[i]) return i
  }
  return value > 0 ? 1 : 0
}

// ---------------------------------------------------------------------------
// The gauge spans 180° across the top (from 180° left → 0° right in math angles)
// Divided into 8 equal segments of 22.5° each, with a small gap between them.
// ---------------------------------------------------------------------------
const TOTAL_ARC = 180 // degrees
const SEGMENT_ARC = TOTAL_ARC / SEGMENTS // 22.5° each

interface SegmentDef {
  index: number
  value: number   // the value this segment represents when clicked
  path: string
  /** Center angle for touch-target rectangle positioning */
  midAngleDeg: number
}

function buildSegments(): SegmentDef[] {
  const defs: SegmentDef[] = []

  for (let i = 0; i < SEGMENTS; i++) {
    // Segments go left to right: segment 0 starts at 180° (left), ends at 157.5°
    const startDeg = 180 - i * SEGMENT_ARC + GAP_DEG / 2
    const endDeg   = 180 - (i + 1) * SEGMENT_ARC - GAP_DEG / 2

    defs.push({
      index: i,
      value: SEGMENT_VALUES[i + 1], // clicking fills up to this value
      path: arcPath(startDeg, endDeg),
      midAngleDeg: (startDeg + endDeg) / 2,
    })
  }

  return defs
}

const SEGMENT_DEFS = buildSegments()

// ---------------------------------------------------------------------------
// Needle
// ---------------------------------------------------------------------------

function needleTransform(value: number): string {
  // value 0 → 180° (pointing left), value 100 → 0° (pointing right)
  const angleDeg = 180 - (value / 100) * 180
  return `rotate(${-angleDeg} ${CX} ${CY})`
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export interface FuelGaugeProps {
  /** Current fuel level, 0–100 */
  value: number
  /** Called with the new value when a segment is clicked */
  onChange: (value: number) => void
  /** When true, segments are not interactive */
  readOnly?: boolean
  /** Additional class names for the outer wrapper */
  className?: string
}

export function FuelGauge({
  value,
  onChange,
  readOnly = false,
  className,
}: FuelGaugeProps) {
  const clampedValue = Math.min(100, Math.max(0, value))
  const litCount = filledSegmentCount(clampedValue)

  // Display string: show percentage for clarity
  const displayLabel: string = (() => {
    if (clampedValue === 0) return "E"
    if (clampedValue >= 100) return "F"
    return `${clampedValue}%`
  })()

  return (
    <div
      className={cn("flex flex-col items-center select-none", className)}
      role="group"
      aria-label="Nivel de combustible"
    >
      {/* SVG gauge — viewBox is 200 wide × 110 tall (only the top half-circle) */}
      <svg
        viewBox="0 0 200 110"
        className={cn(
          "w-full max-w-[260px]",
          readOnly ? "pointer-events-none opacity-80" : "cursor-pointer"
        )}
        aria-hidden="true"
      >
        {/* ----------------------------------------------------------------- */}
        {/* Background track segments                                          */}
        {/* ----------------------------------------------------------------- */}
        {SEGMENT_DEFS.map((seg) => (
          <path
            key={`track-${seg.index}`}
            d={seg.path}
            fill="var(--muted)"
            stroke="var(--background)"
            strokeWidth="1"
          />
        ))}

        {/* ----------------------------------------------------------------- */}
        {/* Filled / colored segments                                          */}
        {/* ----------------------------------------------------------------- */}
        {SEGMENT_DEFS.map((seg) => {
          const filled = seg.index < litCount
          return (
            <path
              key={`fill-${seg.index}`}
              d={seg.path}
              fill={segmentColor(seg.index, filled, readOnly)}
              stroke="var(--background)"
              strokeWidth="1"
              style={{
                transition: "fill 0.2s ease",
                opacity: filled ? 1 : 0,
              }}
            />
          )
        })}

        {/* ----------------------------------------------------------------- */}
        {/* Invisible click / touch targets (wider than the visible arc)       */}
        {/* We use <path> with an expanded radius so touch area is generous.   */}
        {/* ----------------------------------------------------------------- */}
        {!readOnly &&
          SEGMENT_DEFS.map((seg) => {
            // Build an expanded hit-target path that is ~8px wider each side
            const HIT_R_OUTER = R_OUTER + 8
            const HIT_R_INNER = R_INNER - 8
            const startDeg = 180 - seg.index * SEGMENT_ARC
            const endDeg   = 180 - (seg.index + 1) * SEGMENT_ARC

            const hitInnerStart = polarToCartesian(startDeg, HIT_R_INNER)
            const hitInnerEnd   = polarToCartesian(endDeg,   HIT_R_INNER)
            const hitOuterStart = polarToCartesian(startDeg, HIT_R_OUTER)
            const hitOuterEnd   = polarToCartesian(endDeg,   HIT_R_OUTER)

            const hitPath = [
              `M ${hitOuterStart.x} ${hitOuterStart.y}`,
              `A ${HIT_R_OUTER} ${HIT_R_OUTER} 0 0 0 ${hitOuterEnd.x} ${hitOuterEnd.y}`,
              `L ${hitInnerEnd.x} ${hitInnerEnd.y}`,
              `A ${HIT_R_INNER} ${HIT_R_INNER} 0 0 1 ${hitInnerStart.x} ${hitInnerStart.y}`,
              "Z",
            ].join(" ")

            return (
              <path
                key={`hit-${seg.index}`}
                d={hitPath}
                fill="transparent"
                className="hover:opacity-30 hover:fill-white active:fill-white active:opacity-40 transition-opacity"
                role="button"
                tabIndex={0}
                aria-label={`Combustible al ${seg.value}%`}
                onClick={() => onChange(seg.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    onChange(seg.value)
                  }
                }}
                style={{ cursor: "pointer", touchAction: "manipulation" }}
              />
            )
          })}

        {/* ----------------------------------------------------------------- */}
        {/* Needle                                                              */}
        {/* ----------------------------------------------------------------- */}
        <g transform={needleTransform(clampedValue)} style={{ transition: "transform 0.3s ease" }}>
          {/* Needle shaft */}
          <line
            x1={CX}
            y1={CY}
            x2={CX + R_OUTER - 8}
            y2={CY}
            stroke="var(--foreground)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Needle base cap */}
          <circle cx={CX} cy={CY} r="5" fill="var(--foreground)" />
          <circle cx={CX} cy={CY} r="3" fill="var(--background)" />
        </g>

        {/* ----------------------------------------------------------------- */}
        {/* "E" and "F" labels                                                 */}
        {/* ----------------------------------------------------------------- */}
        <text
          x="8"
          y="106"
          fontSize="13"
          fontWeight="700"
          fill="var(--muted-foreground)"
          textAnchor="middle"
          fontFamily="var(--font-sans, sans-serif)"
        >
          E
        </text>
        <text
          x="192"
          y="106"
          fontSize="13"
          fontWeight="700"
          fill="var(--muted-foreground)"
          textAnchor="middle"
          fontFamily="var(--font-sans, sans-serif)"
        >
          F
        </text>

      </svg>

      {/* ------------------------------------------------------------------- */}
      {/* Percentage label — outside SVG for clarity                          */}
      {/* ------------------------------------------------------------------- */}
      <p
        className="-mt-2 text-lg font-bold tabular-nums text-foreground"
        aria-label={`Nivel de combustible: ${displayLabel}`}
      >
        {displayLabel}
      </p>

      {/* ------------------------------------------------------------------- */}
      {/* Quick-select buttons row (mobile-friendly, 44px min tap targets)     */}
      {/* ------------------------------------------------------------------- */}
      {!readOnly && (
        <div
          className="flex items-center gap-1 mt-2 w-full max-w-[260px]"
          role="radiogroup"
          aria-label="Seleccionar nivel de combustible"
        >
          {SEGMENT_DEFS.map((seg) => {
            const filled  = seg.index < litCount
            const isActive = seg.value === clampedValue ||
              (seg.index === litCount - 1 && clampedValue > 0 && clampedValue <= seg.value)

            return (
              <button
                key={`btn-${seg.index}`}
                type="button"
                role="radio"
                aria-checked={filled}
                aria-label={`${seg.value}%`}
                onClick={() => onChange(seg.value)}
                className={cn(
                  // min 44px height for touch targets, flex-1 to fill row
                  "flex-1 h-11 rounded-sm border text-[10px] font-semibold transition-all",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                  filled
                    ? "border-transparent text-white shadow-sm"
                    : "border-border bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  isActive && "ring-2 ring-ring ring-offset-1"
                )}
                style={
                  filled
                    ? { backgroundColor: segmentColor(seg.index, true, false) }
                    : undefined
                }
              >
                {/* Show fraction labels at key points, dots otherwise */}
                {seg.index === 0
                  ? "E"
                  : seg.index === 3
                  ? "½"
                  : seg.index === 7
                  ? "F"
                  : "·"}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
