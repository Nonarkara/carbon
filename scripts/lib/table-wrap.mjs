// Wraps every bare <table> in a single scroll container.
//
// Why this exists: a table wider than its reading column has to scroll, and it
// has to scroll in ONE place. When the table scrolls inside itself, the extra
// columns disappear behind an undiscoverable gesture and the text is simply
// lost on a phone. The wrapper is that one place, so the overflow is legible
// and the content stays reachable.
//
// Tables are never nested in this project, so a non-greedy block match is safe.

const TABLE = /<table\b[\s\S]*?<\/table>/g;
const WRAPPER_OPEN = '<div class="table-scroll">';

/** @param {string} html @returns {string} */
export function wrapTables(html) {
  if (!html || !html.includes('<table')) return html;
  return html.replace(TABLE, (block, offset, whole) => {
    // Already wrapped? The builder emits its own wrappers for audit tables.
    const before = whole.slice(0, offset);
    if (before.endsWith(WRAPPER_OPEN)) return block;
    return `${WRAPPER_OPEN}${block}</div>`;
  });
}
