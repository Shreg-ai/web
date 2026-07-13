// Mirrors CircleNodeLabel's actual label styling (max-w-[9rem], mt-1) so the
// collision radius below matches what's really rendered.
const LABEL_MAX_WIDTH = 144;
const LABEL_MARGIN_TOP = 4;
const LINE_HEIGHT_RATIO = 1.25;
// Rough estimate for a proportional sans-serif font -- doesn't need to be
// exact, just close enough that the physics simulation's collision force
// keeps labels (not just circles) from overlapping their neighbors.
const AVG_CHAR_WIDTH_RATIO = 0.58;
// CJK (and other fullwidth) characters render close to as wide as they are
// tall, well past the Latin-text ratio above -- titles here are frequently
// bilingual (this app's graphs are often Chinese-language), and using the
// Latin ratio for those characters was underestimating label width enough
// to leave a sliver of visible overlap between adjacent nodes.
const WIDE_CHAR_WIDTH_RATIO = 1.0;
const WIDE_CHAR_PATTERN = /[　-ヿ㐀-鿿가-힯豈-﫿＀-￯]/;
// However good the estimate above is, it's still an estimate (and the
// physics simulation only asymptotically approaches the target separation
// over finite ticks) -- a small flat margin turns "should very rarely
// overlap" into "essentially never does".
const SAFETY_MARGIN = 6;

function estimateLabelWidth(label: string, fontSize: number): number {
  let width = 0;
  for (const ch of label) {
    width += fontSize * (WIDE_CHAR_PATTERN.test(ch) ? WIDE_CHAR_WIDTH_RATIO : AVG_CHAR_WIDTH_RATIO);
  }
  return width;
}

/**
 * How far a node's full visual footprint -- its circle plus the label
 * rendered below it -- extends from its center. Used as the physics
 * simulation's collision radius so dense graphs don't end up with readable
 * labels overlapping each other, only relying on the (much smaller) circle
 * radius the way a plain force-directed layout normally would.
 */
export function nodeCollisionRadius(circleSize: number, label: string, labelFontSize: number): number {
  const circleRadius = circleSize / 2;
  const rawWidth = estimateLabelWidth(label, labelFontSize);
  const labelWidth = Math.min(LABEL_MAX_WIDTH, Math.max(rawWidth, labelFontSize * 2));
  const lineCount = Math.max(1, Math.ceil(rawWidth / LABEL_MAX_WIDTH));
  const labelBottom = circleRadius + LABEL_MARGIN_TOP + lineCount * labelFontSize * LINE_HEIGHT_RATIO;

  // The farthest point of the label's bounding box from the node's center
  // is one of its two bottom corners.
  const cornerDistance = Math.hypot(labelWidth / 2, labelBottom);
  return Math.max(circleRadius + 4, cornerDistance) + SAFETY_MARGIN;
}
