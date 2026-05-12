# Bad Habit Bouncer

Redirect your autopilot browsing to better choices. A lightweight Chrome extension that adds friction to mindless site visits.

## Features

- **Configurable redirect probability** — Choose how often redirects happen (0–100%)
- **Multiple destination URLs** — Set up a list; each redirect picks one at random
- **Search pass-through** — Intentional searches (`/search`, `?q=*`) always go through
- **Sync across devices** — Settings persist via Chrome's `storage.sync`
- **Toggle on/off** — Pause the extension anytime
- **Popup & options page** — Quick access from the toolbar or full settings page

## Installation

### Option 1: From GitHub Release (Manual)

1. Download the `.zip` file from the latest release
2. Unzip it to a folder on your machine
3. Open Chrome → `chrome://extensions`
4. Enable **Developer Mode** (top right toggle)
5. Click **Load unpacked** → select the unzipped folder
6. The extension is live; reload any open tabs to apply it

### Option 2: From Source (Development)

1. Clone or download this repository
2. Follow the same steps as above (Developer Mode → Load unpacked)

## Usage

### Quick Access (Popup)
Click the extension icon in your Chrome toolbar to adjust settings on the fly.

### Full Settings (Options Page)
Right-click the extension icon → **Options**, or go to `chrome://extensions` → **Details** → **Extension options**.

### Settings

| Setting | Default | What it does |
|---------|---------|--------------|
| **Enabled** | On | Toggle the extension on/off |
| **Redirect probability** | 10% | Chance (per visit) that a redirect happens |
| **Destination URLs** | `https://www.substack.com` | URLs to redirect to; one is chosen at random on each redirect |

## How It Works

1. You navigate to Reddit
2. The extension checks: is this a search? Is it enabled?
3. If yes to both, it rolls a dice based on your probability setting
4. If the dice lands, you're sent to a random destination from your list instead
5. Otherwise, you go to Reddit normally

**Searches always pass through** — typing in Reddit's search bar or searching via Google won't trigger a redirect.

## Privacy

This extension:
- Does **not** collect, send, or log any data
- Does **not** track your activity
- Stores all settings locally in Chrome via `chrome.storage.sync`
- Works entirely offline

## License

MIT
