const backendUrlInput = document.getElementById("backendUrl");
const apiKeyInput = document.getElementById("apiKey");
const saveBtn = document.getElementById("save");
const statusEl = document.getElementById("status");

// Load saved settings
chrome.storage.sync.get(["backendUrl", "apiKey"], (data) => {
  if (data.backendUrl) backendUrlInput.value = data.backendUrl;
  if (data.apiKey) apiKeyInput.value = data.apiKey;
});

saveBtn.addEventListener("click", () => {
  const backendUrl = backendUrlInput.value.trim().replace(/\/+$/, "");
  const apiKey = apiKeyInput.value.trim();

  if (!backendUrl || !apiKey) {
    statusEl.textContent = "Both fields are required.";
    statusEl.style.color = "#f87171";
    return;
  }

  chrome.storage.sync.set({ backendUrl, apiKey }, () => {
    statusEl.textContent = "Settings saved!";
    statusEl.style.color = "#4ade80";
    setTimeout(() => { statusEl.textContent = ""; }, 2000);
  });
});
