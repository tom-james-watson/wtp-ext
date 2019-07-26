/**
 * Show the page
 */
export async function showPageAction() {
  const tab = (await browser.tabs.query({currentWindow: true, active: true}))[0]
  await browser.pageAction.show(tab.id)
}
