import type { RoofSegment } from '@/types'

export interface PanelSpec {
  wattage: number  // Wp per panel
  widthM: number
  heightM: number
}

// Typical modern residential module (~440 Wp, ~1.13m x 2.28m)
export const DEFAULT_PANEL: PanelSpec = { wattage: 440, widthM: 1.13, heightM: 2.28 }

/**
 * Estimates installed peak capacity (kWp) for a roof area given a panel
 * spec. This is an area-based approximation (usable area / panel area),
 * not a rectangle-packing layout — usableFraction accounts for gaps,
 * mounting clearance and obstructions like chimneys or vents.
 */
export function estimateCapacityKw(
  roofWidthM: number,
  roofHeightM: number,
  panel: PanelSpec = DEFAULT_PANEL,
  usableFraction = 0.85,
): number {
  const usableAreaM2 = roofWidthM * roofHeightM * usableFraction
  const panelAreaM2 = panel.widthM * panel.heightM
  const panelCount = Math.floor(usableAreaM2 / panelAreaM2)
  return (panelCount * panel.wattage) / 1000
}

/** Number of panels implied by estimateCapacityKw's area calculation. */
export function estimatePanelCount(
  roofWidthM: number,
  roofHeightM: number,
  panel: PanelSpec = DEFAULT_PANEL,
  usableFraction = 0.85,
): number {
  const usableAreaM2 = roofWidthM * roofHeightM * usableFraction
  const panelAreaM2 = panel.widthM * panel.heightM
  return Math.floor(usableAreaM2 / panelAreaM2)
}

/**
 * Resolves a segment's effective peak capacity. In 'capacity' mode this is
 * simply the stored peakKw; in 'dimensions' mode it's derived live from
 * roof size + panel spec so there's no stale cached value to keep in sync.
 */
export function getSegmentPeakKw(segment: RoofSegment): number {
  if (segment.inputMode === 'dimensions' && segment.roofWidthM && segment.roofHeightM) {
    const panel: PanelSpec = {
      wattage: segment.panelWattage ?? DEFAULT_PANEL.wattage,
      widthM: segment.panelWidthM ?? DEFAULT_PANEL.widthM,
      heightM: segment.panelHeightM ?? DEFAULT_PANEL.heightM,
    }
    return estimateCapacityKw(segment.roofWidthM, segment.roofHeightM, panel)
  }
  return segment.peakKw
}
