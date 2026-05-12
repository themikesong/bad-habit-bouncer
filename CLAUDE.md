# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A lightweight Chrome extension (Manifest V3) that intercepts navigation to Reddit and — with a configurable probability — redirects the user to a more productive destination. The full spec lives in `reddit-redirect-extension-spec.md`.

## No Build System

This is a plain Chrome extension with no bundler, transpiler, or package manager. Load it directly in Chrome:

1. Open `chrome://extensions`
2. Enable **Developer Mode**
3. Click **Load unpacked** → select this folder

After editing any file, click the reload icon on the extension card in `chrome://extensions`.

## File Structure

```
manifest.json   — MV3 config, permissions, service worker declaration
background.js   — Navigation listener + redirect logic (service worker)
popup.html      — Extension popup markup
popup.js        — Reads/writes chrome.storage.sync, wires UI
popup.css       — Popup styles (~300px wide)
```

## Core Architecture

**background.js** is a MV3 service worker that listens to `chrome.webNavigation.onBeforeNavigate` (or `chrome.tabs.onUpdated`) for `*://*.reddit.com/*` URLs. On each match it:
1. Reads settings from `chrome.storage.sync`
2. Bails if `enabled === false`
3. Passes through if URL matches a search pattern (`/search*` or `?q=*`)
4. Rolls `Math.random()` and redirects if below `redirectProbability`

**popup.js** reads from and writes to `chrome.storage.sync` on every control change (no save button). When `enabled` is false, controls should appear dimmed and a "Paused" label should show.

## Storage Schema

```json
{
  "enabled": true,
  "redirectProbability": 0.1,
  "destinationUrl": "https://www.substack.com"
}
```

## Key Constraints

- Manifest V3 only — no Manifest V2 APIs
- No content scripts, no backend, no npm dependencies
- Pass-through patterns (never redirect): `reddit.com/search*`, `reddit.com/*?q=*`
- Default redirect destination: `https://www.substack.com` (single constant in background.js)
- Popup width: ~300px
