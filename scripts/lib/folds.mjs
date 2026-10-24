// Content that folds away must still be measured.
//
// The research notebook's contents and thesis map fold into one line on a phone. A folded
// element has no size, and the collector skips what it cannot see — so a reader who opens
// the fold would be looking at content the law never measured, and a page with a broken
// fold would read exactly like a page with a good one.
//
// So the instruments open the folds before they measure, and then check the folded state
// on its own terms: one line, and the content is really behind it.
//
// This lives here because the gate and the audit must not disagree about it.
import {collectSpatial} from './spatial-collector.mjs';

/** Open every fold on the page, so the law measures what the reader can reach. */
export async function openCollapsibles(page) {
  await page.evaluate(() => {
    for (const element of document.querySelectorAll('details[data-collapsible]')) element.open = true;
  });
}

/**
 * The folded state, measured as the reader sees it.
 *
 * A fold that is one line has done its job. A fold that is three lines has put the
 * navigation back where it started, and the page is no better off than before the fold.
 *
 * @param {import('playwright').Page} page
 * @returns {Promise<{id:string, foldedHeight:number, openHeight:number, lines:number}[]>}
 */
export async function measureFolds(page) {
  return page.evaluate(() => {
    const out = [];
    for (const element of document.querySelectorAll('details[data-collapsible]')) {
      const wasOpen = element.open;
      element.open = false;
      const folded = element.getBoundingClientRect().height;
      element.open = true;
      const open = element.getBoundingClientRect().height;
      const line = parseFloat(getComputedStyle(element.querySelector('summary') || element).fontSize) * 1.6;
      element.open = wasOpen;
      out.push({
        id: element.className || element.tagName.toLowerCase(),
        foldedHeight: Math.round(folded),
        openHeight: Math.round(open),
        lines: Math.round((folded / line) * 10) / 10,
      });
    }
    return out;
  });
}

export {collectSpatial};
