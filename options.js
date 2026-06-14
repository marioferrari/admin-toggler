const browser = globalThis.browser || globalThis.chrome;

const $domain = document.getElementById('domain');
const $prefix = document.getElementById('prefix');
const $rules  = document.getElementById('rules');
const $save   = document.getElementById('save');
const $status = document.getElementById('status');

let statusTimeoutId = null;

// Load saved config into the form
browser.storage.sync.get(['domain', 'prefix', 'rules'], (data) => {
  if (data.domain) $domain.value = data.domain;
  if (data.prefix) $prefix.value = data.prefix;
  if (data.rules && Array.isArray(data.rules)) {
    $rules.value = data.rules
      .map(r => `${r.match} => ${r.replace}`)
      .join('\n');
  }
});

// Helper: Show status notifications with auto-clear timing
function updateStatus(msg, statusClass, autoClear = false) {
  // Clear any active running timeouts to prevent overlapping UI flickering
  if (statusTimeoutId) clearTimeout(statusTimeoutId);

  $status.textContent = msg;
  $status.className = statusClass;

  if (autoClear) {
    statusTimeoutId = setTimeout(() => {
      $status.textContent = '';
      $status.className = '';
    }, 3000); // UI notice cleanly disappears after 3 seconds
  }
}

// Save Action Listener
$save.addEventListener('click', () => {
  // Clear status state immediately on click click
  updateStatus('', '');

  const domain = $domain.value.trim();
  const prefix = $prefix.value.trim();

  if (!domain) {
    updateStatus('Domain is required.', 'err');
    return;
  }

  if (!prefix) {
    updateStatus('Admin path prefix is required.', 'err');
    return;
  }

  const rulesText = $rules.value.trim();
  const rules = [];

  if (rulesText) {
    const lines = rulesText.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue; // Skip explicit blank lines safely

      const sepIdx = line.indexOf('=>');
      if (sepIdx === -1) {
        updateStatus(`Line ${i + 1}: missing "=>" separator.`, 'err');
        return;
      }

      const match   = line.substring(0, sepIdx).trim();
      const replace = line.substring(sepIdx + 2).trim();

      if (!match) {
        updateStatus(`Line ${i + 1}: regex pattern is empty.`, 'err');
        return;
      }

      try {
        new RegExp(match);
      } catch (e) {
        updateStatus(`Line ${i + 1}: invalid regex — ${e.message}`, 'err');
        return;
      }

      rules.push({ match, replace });
    }
  }

  // Save parsed items directly to browser synchronization storage
  browser.storage.sync.set({ domain, prefix, rules }, () => {
    if (browser.runtime.lastError) {
      updateStatus(browser.runtime.lastError.message, 'err');
    } else {
      updateStatus('Settings saved successfully.', 'ok', true);
    }
  });
});