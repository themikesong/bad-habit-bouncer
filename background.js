const DEFAULTS = {
  enabled: true,
  redirectProbability: 0.1,
  monitoredSites: ["reddit.com"],
  destinationUrls: ["https://www.substack.com"]
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

chrome.webNavigation.onBeforeNavigate.addListener(
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

    const isMonitored = settings.monitoredSites.some(site => matchesSite(hostname, site));
    if (!isMonitored) return;

    if (Math.random() < settings.redirectProbability) {
      const urls = settings.destinationUrls;
      const destination = urls[Math.floor(Math.random() * urls.length)];
      chrome.tabs.update(details.tabId, { url: destination });
    }
  },
  { url: [{ schemes: ["http", "https"] }] }
);
