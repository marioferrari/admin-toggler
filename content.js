const browser = globalThis.browser || globalThis.chrome;

// Listen for clicks with Ctrl+Alt modifier to open links in admin mode
document.addEventListener('click', (event) => {
  if (event.button !== 0) {
    return;
  }

  if (!event.ctrlKey || !event.altKey) {
    return;
  }

  const path = event.composedPath();
  let anchor = null;

  for (const element of path) {
    if (element.tagName === 'A' && element.href) {
      anchor = element;
      break;
    }
  }

  if (!anchor) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  browser.runtime.sendMessage({
    action: 'open-in-admin',
    url: anchor.href
  });
}, true);