/**
 * Deterministic lightweight label collision-avoidance for the Pareto scatter.
 *
 * Strategy (no heavy library, no runtime measurement):
 * - Estimate label width from character count (monospace approximation).
 * - Sort points by x (cost). A label collides with the previous placed label
 *   if its estimated pixel span overlaps on the same lane and its y gap is
 *   small relative to font size.
 * - Assign colliding labels round-robin across vertical lanes (above/below
 *   with stacked dy offsets), preserving point association via index.
 * - Pure function; identical inputs always produce identical lane assignments.
 */

export interface LabelLayoutInput {
  index: number;
  label: string;
  /** Normalised x pixel position (0..1 across plot width). */
  x01: number;
  /** Normalised y pixel position (0..1, top=0). */
  y01: number;
}

export interface LabelPlacement {
  index: number;
  lane: number; // 0 = above, 1 = below, 2 = above+2, 3 = below+2 ...
  dy: number; // pixel offset from the point
  anchorX01: number;
}

const CHAR_WIDTH_PX = 6; // ~10px sans-serif average
const LABEL_GAP_PX = 8;
const LANE_STEP_PX = 14;
const MIN_Y_GAP_PX = 0.04; // fraction of plot height

export function computeLabelPlacements(
  points: LabelLayoutInput[],
  plotWidthPx: number
): LabelPlacement[] {
  const placements = new Array<LabelPlacement>(points.length);
  const byX = [...points].sort((a, b) => a.x01 - b.x01);
  // laneNextX[lane]: right edge of last placed label in that lane (in x01)
  const laneNextX: number[] = [];
  const laneLastY: number[] = [];

  for (const p of byX) {
    const halfLabel = ((p.label.length * CHAR_WIDTH_PX) / 2) / Math.max(plotWidthPx, 1);
    const left = p.x01 - halfLabel;
    const right = p.x01 + halfLabel;

    // Find the first lane where this label fits without overlap.
    let lane = 0;
    while (lane < laneNextX.length) {
      const overlapX = left < laneNextX[lane] + (LABEL_GAP_PX / Math.max(plotWidthPx, 1));
      const closeY = Math.abs(p.y01 - (laneLastY[lane] ?? 1)) < MIN_Y_GAP_PX;
      if (overlapX && closeY) {
        lane += 1;
        continue;
      }
      break;
    }
    if (lane === laneNextX.length) {
      laneNextX.push(0);
      laneLastY.push(p.y01);
    }
    laneNextX[lane] = right;
    laneLastY[lane] = p.y01;

    const direction = lane % 2 === 0 ? -1 : 1; // even lanes above, odd below
    const stack = Math.floor(lane / 2) + 1;
    placements[p.index] = {
      index: p.index,
      lane,
      dy: direction * stack * LANE_STEP_PX,
      anchorX01: p.x01,
    };
  }
  return placements;
}
