# Admin Toggler

![icon](icon-default.png)

A browser extension for quickly toggling between the production view and admin interface of your web app. 

Click the extension icon to jump between the two interfaces instantly. You can configure it to work with any domain and any admin path prefix. It also supports regex-based URL transformation rules for handling complex routes that don't map 1:1 between production and admin.

## What it does

Click the extension icon on any page and it'll transform the URL to take you to the corresponding admin page. Click again to go back. The extension remembers where you came from when you use a regex rule. That means if you toggle from a deeply nested production URL to a simplified admin URL, clicking again takes you back to exactly where you started. You can also right-click any link and choose "Open as admin" from the context menu.

## Keyboard Shortcuts

**Toggle current page:** Press `Alt+A` (Chrome) or `Ctrl+Alt+A` (Firefox) to toggle between the normal view and admin view of the current page. This does the same thing as clicking the extension icon.

**Open admin links in new tab:** Hold `Ctrl+Alt` and click any link to open it in admin mode in a new tab. This works the same as right-clicking and choosing "Open as admin" from the context menu.

You can customize the main toggle shortcut in your browser settings:
- **Chrome:** Go to `chrome://extensions/shortcuts`
- **Firefox:** Go to `about:addons`, click the gear icon, then "Manage Extension Shortcuts"

Note: Currently, the `Ctrl+Alt+click` modifier cannot be customized from the options menu. To modify this key combination, you will have to edit `contents.js`.

## Installing

This extension isn't published to the browser extension stores. You'll need to [download the latest release](https://github.com/marioferrari/admin-toggler/releases) for your browser and install it manually.

### Chrome

1. Download the latest admin-toggler-vX-chrome.zip and extract it
2. In Chrome, navigate to `chrome://extensions`
3. Turn on "Developer mode" (toggle in the top right)
4. Click "Load unpacked"
5. Navigate to and select the directory where you extracted the .zip file
6. The options page will then open, allowing you to configure the extension

### Firefox

1. Download the latest admin-toggler-vX-firefox.zip
2. In Firefox, navigate to `about:debugging`
3. Click "This Firefox" in the lefthand sidebar
4. Click "Load Temporary Add-on..."
5. Navigate to and select admin-toggler-vX-firefox.zip
6. The options page will then open, allowing you to configure the extension

Note: Firefox requires reloading the extension each time you restart the browser when using temporary add-ons.

## Configuration

The extension won't do anything until you configure it. After installing, click the extension icon. It should open the settings page automatically. If it doesn't, right-click the icon and go to Options.

Fill in these fields:
- Domain (e.g., `mycompany.com`)
- Admin path prefix (e.g., `admin`)
- URL transform rules (optional, for complex cases)

The rules text area lets you write regex patterns for URLs that don't follow the simple "add /admin/ to the path" pattern. Each line should be in the format:

```
regex => replacement
```

For example:

```
^/[^/]+/\d+/(pages/\d+)(?:/edit)?/?$ => /admin/$1/
```

This transforms URLs like `/directories/1234/pages/5678/edit` into `/admin/pages/5678/` by capturing the 'pages' part and dropping everything else.

## AI Disclosure & License

This extension was developed with assistance from AI tools. AI outputs were audited, modified, and tested by a human. This extension is licensed under the MIT License.