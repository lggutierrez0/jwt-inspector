export default defineBackground(() => {
  // Chromium: clicking the toolbar icon opens the side panel.
  // Firefox uses `sidebar_action`, which WXT generates from the same `sidepanel` entrypoint.
  if (import.meta.env.CHROME || import.meta.env.EDGE || import.meta.env.OPERA) {
    browser.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((error: unknown) => {
      console.error('Failed to enable side panel on action click', error);
    });
  }
});
