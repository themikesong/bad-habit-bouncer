const DEFAULTS = {
  enabled: true,
  redirectProbability: 0.1,
  monitoredSites: ["reddit.com"],
  destinationUrls: ["https://www.substack.com"],
  allowInSessionNavigation: true
};

// Track the last committed hostname for each tab to detect in-session navigation
const tabLastHostname = new Map();

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

// Clean up tab state when tabs are closed
chrome.tabs.onRemoved.addListener((tabId) => {
  tabLastHostname.delete(tabId);
});

chrome.webNavigation.onCommitted.addListener(
  async (details) => {
    // Only act on top-level navigation
    if (details.frameId !== 0) return;

    const url = details.url;

    if (isSearchUrl(url)) {
      // Update tab state even for search URLs (they're allowed through)
      try {
        const hostname = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
        tabLastHostname.set(details.tabId, hostname);
      } catch (e) {
        // Invalid URL, ignore
      }
      return;
    }

    const settings = await chrome.storage.sync.get(DEFAULTS);

    if (!settings.enabled) {
      // Update tab state even when disabled
      try {
        const hostname = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
        tabLastHostname.set(details.tabId, hostname);
      } catch (e) {
        // Invalid URL, ignore
      }
      return;
    }

    let hostname;
    try {
      hostname = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
    } catch {
      return;
    }

    const matchedSite = settings.monitoredSites.find(site => matchesSite(hostname, site));
    if (!matchedSite) {
      // Not a monitored site, update state and allow
      tabLastHostname.set(details.tabId, hostname);
      return;
    }

    // Check if this is in-session navigation (link click or form submit from same distraction site)
    let shouldBounce = true;
    if (settings.allowInSessionNavigation) {
      const previousHostname = tabLastHostname.get(details.tabId);
      // Only allow in-session navigation for link clicks and form submissions
      // when the PREVIOUS page was also on the same distraction site
      const allowedTransitions = ["link", "form_submit"];
      if (previousHostname && 
          matchesSite(previousHostname, matchedSite) && 
          allowedTransitions.includes(details.transitionType)) {
        shouldBounce = false;
      }
    }

    if (shouldBounce && Math.random() < settings.redirectProbability) {
      const urls = settings.destinationUrls;
      const destination = urls[Math.floor(Math.random() * urls.length)];
      chrome.tabs.update(details.tabId, { url: destination });
      // Update tab state to reflect the redirect destination
      try {
        const redirectHostname = new URL(destination).hostname.toLowerCase().replace(/^www\./, "");
        tabLastHostname.set(details.tabId, redirectHostname);
      } catch (e) {
        // Invalid redirect URL, just clear the state
        tabLastHostname.delete(details.tabId);
      }
    } else {
      // Either not bouncing or dice roll failed - update state to current page
      tabLastHostname.set(details.tabId, hostname);
    }
  },
  { url: [{ schemes: ["http", "https"] }] }
);
