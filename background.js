const browser = globalThis.browser || globalThis.chrome;

const defaultIconPath = "icon-default.png";
const activeIconPath  = "icon-active.png";

// In-memory config (loaded from storage)
let config = { domain: '', prefix: '', rules: [] };

function toggleSegment() {
  return `/${config.prefix}`;
}

// Load config from storage, then initialise
function loadConfig(callback) {
  browser.storage.sync.get(['domain', 'prefix', 'rules'], (data) => {
    config.domain = data.domain || '';
    config.prefix = data.prefix || '';
    config.rules  = Array.isArray(data.rules) ? data.rules : [];
    if (callback) callback();
  });
}

// React to config changes from the options page
browser.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync') {
    loadConfig(() => {
      rebuildContextMenu();
    });
  }
});

// Original-URL tracking (for reversible regex toggles)
// Map of tabId -> { transformedUrl, originalUrl }
const originMap = {};

function storeOrigin(tabId, originalUrl, transformedUrl) {
  originMap[tabId] = { originalUrl, transformedUrl };
}

function consumeOrigin(tabId, currentUrl) {
  const entry = originMap[tabId];
  if (entry && entry.transformedUrl === currentUrl) {
    delete originMap[tabId];
    return entry.originalUrl;
  }
  delete originMap[tabId];
  return null;
}

// Clean up when tabs close
browser.tabs.onRemoved.addListener((tabId) => {
  delete originMap[tabId];
});


// URL transformation engine
// Returns { href, ruleUsed } where ruleUsed is true if a regex rule fired.
function transformUrl(urlObj) {
  const path = urlObj.pathname;
  const seg  = toggleSegment();

  for (const rule of config.rules) {
    const re = new RegExp(rule.match);
    if (re.test(path)) {
      const newUrl = new URL(urlObj.href);
      newUrl.pathname = path.replace(re, rule.replace);
      return { href: newUrl.href, ruleUsed: true };
    }
  }

  // Default: prepend the prefix
  const newUrl = new URL(urlObj.href);
  newUrl.pathname = seg + path;
  return { href: newUrl.href, ruleUsed: false };
}

function isAdminPath(pathname) {
  const seg = toggleSegment();
  return pathname.startsWith(seg + '/') || pathname === seg;
}

// Shared router function to handle both keyboard shortcuts and icon clicks
function toggleAdminState(tab) {
  if (!tab || !tab.url || !config.domain || !tab.url.includes(config.domain)) {
    return;
  }

  const url  = new URL(tab.url);
  const path = url.pathname;

  if (isAdminPath(path)) {
    // Reverse toggle: try stored original URL first
    const storedOriginal = consumeOrigin(tab.id, tab.url);
    if (storedOriginal) {
      browser.tabs.update(tab.id, { url: storedOriginal });
    } else {
      // Fall back to stripping the prefix
      let newPath = path.substring(toggleSegment().length);
      url.pathname = newPath === '' ? '/' : newPath;
      browser.tabs.update(tab.id, { url: url.href });
    }
  } else {
    // Forward toggle
    const result = transformUrl(url);
    if (result.ruleUsed) {
      storeOrigin(tab.id, tab.url, result.href);
    }
    browser.tabs.update(tab.id, { url: result.href });
  }
}

// Context menu
function rebuildContextMenu() {
  browser.contextMenus.removeAll(() => {
    if (!config.domain) return;
    browser.contextMenus.create({
      id: "open-in-admin-mode",
      title: "Open as admin",
      contexts: ["link"],
      targetUrlPatterns: [`*://*.${config.domain}/*`, `*://${config.domain}/*`]
    });
  });
}

browser.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== "open-in-admin-mode") return;
  if (!config.domain) return;

  const linkUrl = new URL(info.linkUrl);

  // Already an admin link — do nothing
  if (isAdminPath(linkUrl.pathname)) return;

  const result = transformUrl(linkUrl);
  browser.tabs.create({ url: result.href });
});


// Main icon-click action
browser.action.onClicked.addListener((tab) => {
  toggleAdminState(tab);
});


// Keyboard shortcut command listener
browser.commands.onCommand.addListener(async (command) => {
  if (command !== 'toggle-admin') return;

  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  toggleAdminState(tab);
});


// Message listener for content script (Ctrl+Alt+click on links)
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action !== 'open-in-admin') return;
  if (!config.domain || !message.url) return;

  try {
    const linkUrl = new URL(message.url);
    
    // Only process links to the configured domain
    if (!linkUrl.hostname.includes(config.domain)) return;
    
    // Already an admin link; do nothing
    if (isAdminPath(linkUrl.pathname)) return;

    const result = transformUrl(linkUrl);
    browser.tabs.create({ url: result.href });
  } catch (error) {
    // Ignore invalid URLs
    console.error('Error processing link:', error);
  }
});


// Icon update logic
async function updateIcon(tab) {
  if (!tab || !tab.url || (!tab.url.startsWith('http://') && !tab.url.startsWith('https://'))) {
    browser.action.setIcon({ path: defaultIconPath, tabId: tab?.id });
    return;
  }

  let iconPath = defaultIconPath;
  
  if (config.domain && tab.url.includes(config.domain)) {
    const url = new URL(tab.url);
    if (isAdminPath(url.pathname)) {
      iconPath = activeIconPath;
    }
  }
  
  try {
    await browser.action.setIcon({ path: iconPath, tabId: tab.id });
  } catch (err) {
    console.warn(`Failed to set icon for tab ${tab.id}:`, err.message);
  }
}

browser.tabs.onActivated.addListener((activeInfo) => {
  browser.tabs.get(activeInfo.tabId)
    .then((tab) => {
      if (tab) updateIcon(tab);
    })
    .catch((err) => {
      console.debug(`Tab ${activeInfo.tabId} was closed or unavailable before icon update.`, err.message);
    });
});

browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' || changeInfo.url) {
    updateIcon(tab);
  }
});


// First-run detection
function checkFirstRun() {
  if (!config.domain) {
    browser.runtime.openOptionsPage();
  }
}

// Startup
loadConfig(() => {
  rebuildContextMenu();
  checkFirstRun();
});