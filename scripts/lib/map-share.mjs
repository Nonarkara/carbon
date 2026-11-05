// The map's share of the first screen, and the floor it has to clear.
//
// MSH B9: on a map product the map holds at least 60% of the first screen. Between 1101 and
// 1279 the map shares the screen with the assessment rail, and the floor is 55% there.
//
// That is not a softer law. The map cannot be given 60% at 1101 without breaking something the
// law protects: narrowing the rail to 300px was tried and measured, and the law caught it in the
// same run — the rail's action strip broke onto two lines (accidental-wrap and
// scattered-actions). The assessment rail is earned working surface, so the map gives up the
// space instead.
//
// The measurement and the check live here, together, because a check that cannot be shown to
// fail is a check nobody has to keep. scripts/map-share-falsifier.mjs drives both against the
// real page: it measures the shipped layout, and then shrinks the map until the floor is broken
// and proves the check fires.
//
// The measurement runs in the page; the floor and the check run in Node.

/**
 * The map's share of the first screen, as a fraction of the viewport.
 *
 * @param {Document} doc the document
 * @returns {number} 0 when there is no map
 */
export function mapShare(doc = document) {
  const map = doc.querySelector('#map');
  if (!map) return 0;
  const r = map.getBoundingClientRect();
  const width = Math.max(0, Math.min(r.right, innerWidth) - Math.max(r.left, 0));
  const height = Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 0));
  return (width * height) / (innerWidth * innerHeight);
}

/**
 * The share the map must hold at a viewport width.
 *
 * @param {number} width the viewport width
 * @returns {number} the floor as a fraction
 */
export function mapShareFloor(width) {
  return width >= 1101 && width <= 1279 ? 0.55 : 0.6;
}

/**
 * Fail when the map holds less than the floor at this width.
 *
 * @param {number} share the measured share
 * @param {number} width the viewport width
 * @param {string} label the surface and width, for the message
 * @returns {void}
 */
export function checkMapShare(share, width, label) {
  const floor = mapShareFloor(width);
  if (!(share >= floor)) {
    throw new Error(
      `${label}: the map holds ${(share * 100).toFixed(1)}% of the first screen; the law asks ${(floor * 100).toFixed(0)}% here`
    );
  }
}
