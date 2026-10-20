// Keep the first phone task visible; complete navigation and diagrams remain native disclosures.
const sections=document.querySelectorAll('.manual-contents,.screen-map');
const desktop=matchMedia('(min-width:801px)');
const sync=()=>sections.forEach(section=>{section.open=desktop.matches;});
sync();desktop.addEventListener('change',sync);
