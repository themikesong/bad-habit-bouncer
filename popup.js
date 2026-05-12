const DEFAULTS = {
  enabled: true,
  redirectProbability: 0.1,
  monitoredSites: ["reddit.com"],
  destinationUrls: ["https://www.substack.com"]
};

const enabledEl = document.getElementById("enabled");
const probabilityEl = document.getElementById("probability");
const probabilityValueEl = document.getElementById("probability-value");
const siteListEl = document.getElementById("site-list");
const newSiteEl = document.getElementById("new-site");
const addSiteBtn = document.getElementById("add-site");
const urlListEl = document.getElementById("url-list");
const newUrlEl = document.getElementById("new-url");
const addUrlBtn = document.getElementById("add-url");
const statusLabel = document.getElementById("status-label");
const container = document.getElementById("container");

function normalizeHostname(input) {
  input = input.trim().toLowerCase();
  input = input.replace(/^https?:\/\//, "");
  input = input.replace(/^www\./, "");
  input = input.split("/")[0].split("?")[0];
  return input;
}

function renderList(listEl, items, onRemove) {
  listEl.innerHTML = "";
  items.forEach((item, i) => {
    const li = document.createElement("li");

    const span = document.createElement("span");
    span.textContent = item;
    span.title = item;

    const btn = document.createElement("button");
    btn.textContent = "×";
    btn.className = "remove-btn";
    btn.addEventListener("click", () => onRemove(i));

    li.appendChild(span);
    li.appendChild(btn);
    listEl.appendChild(li);
  });
}

function updateUI(settings) {
  enabledEl.checked = settings.enabled;
  probabilityEl.value = Math.round(settings.redirectProbability * 100);
  probabilityValueEl.textContent = Math.round(settings.redirectProbability * 100) + "%";

  renderList(siteListEl, settings.monitoredSites, (i) => {
    const updated = settings.monitoredSites.filter((_, j) => j !== i);
    chrome.storage.sync.set({ monitoredSites: updated });
    updateUI({ ...settings, monitoredSites: updated });
  });

  renderList(urlListEl, settings.destinationUrls, (i) => {
    const updated = settings.destinationUrls.filter((_, j) => j !== i);
    chrome.storage.sync.set({ destinationUrls: updated });
    updateUI({ ...settings, destinationUrls: updated });
  });

  if (settings.enabled) {
    container.classList.remove("disabled");
    statusLabel.textContent = "";
  } else {
    container.classList.add("disabled");
    statusLabel.textContent = "Paused";
  }
}

chrome.storage.sync.get(DEFAULTS).then(updateUI);

enabledEl.addEventListener("change", () => {
  const enabled = enabledEl.checked;
  chrome.storage.sync.set({ enabled });
  if (enabled) {
    container.classList.remove("disabled");
    statusLabel.textContent = "";
  } else {
    container.classList.add("disabled");
    statusLabel.textContent = "Paused";
  }
});

probabilityEl.addEventListener("input", () => {
  probabilityValueEl.textContent = probabilityEl.value + "%";
  chrome.storage.sync.set({ redirectProbability: probabilityEl.value / 100 });
});

function addSite() {
  const site = normalizeHostname(newSiteEl.value);
  if (!site) return;
  chrome.storage.sync.get(DEFAULTS).then(settings => {
    if (settings.monitoredSites.includes(site)) return;
    const updated = [...settings.monitoredSites, site];
    chrome.storage.sync.set({ monitoredSites: updated });
    updateUI({ ...settings, monitoredSites: updated });
    newSiteEl.value = "";
  });
}

function addUrl() {
  const url = newUrlEl.value.trim();
  if (!url) return;
  chrome.storage.sync.get(DEFAULTS).then(settings => {
    const updated = [...settings.destinationUrls, url];
    chrome.storage.sync.set({ destinationUrls: updated });
    updateUI({ ...settings, destinationUrls: updated });
    newUrlEl.value = "";
  });
}

addSiteBtn.addEventListener("click", addSite);
newSiteEl.addEventListener("keydown", e => { if (e.key === "Enter") addSite(); });

addUrlBtn.addEventListener("click", addUrl);
newUrlEl.addEventListener("keydown", e => { if (e.key === "Enter") addUrl(); });
