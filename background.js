const DEFAULTS = {
  enabled: true,
  redirectProbability: 0.1,
  monitoredSites: ["reddit.com"],
  destinationUrls: ["https://www.substack.com"],
  allowInSessionNavigation: true
};

function isSearchUrl(url) {
  return /[?&]q=/.test(url);
}

function normalizeHostname(input) {
  input = input.trim().toLowerCase();
  // Strip protocol if present
  input = input.replace(/^https?:\/\//, "");
  // Strip www.
  input = input.replace(/^www\./, "");
  // Strip path/query/trailing slash
  input = input.split("/")[0].split("?")[0];
  return input;
}

function matchesSite(hostname, site) {
  // hostname ends with the stored site (covers subdomains)
  return hostname === site || hostname.endsWith("." + site);
}

chrome.webNavigation.onCommitted.addListener(
  async (details) => {
    // Only act on top-level navigation
    if (details.frameId !== 0) return;

    const url = details.url;

    if (isSearchUrl(url)) return;

    const settings = await chrome.storage.sync.get(DEFAULTS);

    if (!settings.enabled) return;

    let hostname;
    try {
      hostname = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
    } catch {
      return;
    }

    const matchedSite = settings.monitoredSites.find(site => matchesSite(hostname, site));
    if (!matchedSite) return;

    // Check if this is in-session navigation (link click or form submit from same site)
    if (settings.allowInSessionNavigation) {
      try {
        const tab = await chrome.tabs.get(details.tabId);
        if (tab.url) {
          const currentHostname = new URL(tab.url).hostname.toLowerCase().replace(/^www\./, "");
          // Only allow in-session navigation for link clicks and form submissions
          // Address bar (typed), bookmarks, reloads, etc. should still bounce
          const allowedTransitions = ["link", "form_submit"];
          if (matchesSite(currentHostname, matchedSite) && 
              allowedTransitions.includes(details.transitionType)) {
            return;
          }
        }
      } catch (e) {
        // Tab may not exist or URL may be invalid; proceed with bounce logic
      }
    }

    if (Math.random() < settings.redirectProbability) {
      const urls = settings.destinationUrls;
      const destination = urls[Math.floor(Math.random() * urls.length)];
      chrome.tabs.update(details.tabId, { url: destination });
    }
  },
  { url: [{ schemes: ["http", "https"] }] }
);
