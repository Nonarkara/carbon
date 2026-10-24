// The research notebook's front matter is a stack on a phone.
//
// On a wide screen the contents is a rail beside the text and the thesis map is a table in
// the column — both belong exactly where they are, and the reader sees them at the same
// time as the thing they point at. On a phone the same two aids stack above the first
// chapter: twenty-three links and a thirteen-row table, more than three screens of
// navigation before a single sentence of the study.
//
// So on a narrow screen they fold into one line each, and the reader opens the one they
// want. Nothing is removed: the contents and the map are still there, still a tap away,
// and the law still measures them — the audit opens them before it measures.
//
// Without this script the page behaves as it always has: open on every screen. The folding
// is an enhancement for the narrow layout, never a requirement for the content to be seen.
const narrow = window.matchMedia('(max-width:700px)');

const apply = () => {
  for (const element of document.querySelectorAll('details[data-collapsible]')) {
    element.open = !narrow.matches;
  }
};

apply();
if (typeof narrow.addEventListener === 'function') narrow.addEventListener('change', apply);
else if (typeof narrow.addListener === 'function') narrow.addListener(apply);
