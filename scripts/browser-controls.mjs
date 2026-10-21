// Follow the same disclosures and responsive navigation available to a person.
export async function revealControl(page,selector){
 const target=page.locator(selector);if(await target.isVisible())return;
 if(await target.evaluate(e=>!!e.closest('#about'))){await clickControl(page,'#aboutTab');}
 const menu=await target.evaluate(e=>e.closest('.reference-menu')?'.reference-menu':e.closest('.map-tools')?'.map-tools':e.closest('.more-nav')?'.more-nav':null);
 if(menu&&(await page.locator(menu).getAttribute('open'))===null)await page.locator(menu+'>summary').click();
}
export async function clickControl(page,selector){
 if(selector==='.advanced-tools>summary'&&!(await page.locator(selector).isVisible()))return;
 if(selector.startsWith('.lenses ')&&!(await page.locator(selector).isVisible())){const tab=selector.match(/data-tab=["']?([a-z]+)/)?.[1];if(!tab)throw Error('Unknown workflow route');await clickControl(page,`.bottom-nav [data-tab=${tab}]`);return;}
 await revealControl(page,selector);await page.locator(selector).click();
}
// A compact native selector and desktop buttons expose the same regional views.
export async function selectSeaView(surface,view){
 const select=surface.locator('#seaView');
 if(await select.isVisible())await select.selectOption(view);
 else await surface.locator(`button[data-sea-view=${view}]`).click();
}
