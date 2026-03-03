const apiKeyInput = document.getElementById("apiKey");
const saveBtn = document.getElementById("save");
const statusEl = document.getElementById("status");

// Load saved settings
chrome.storage.sync.get(["apiKey"], (data) => {
  if (data.apiKey) apiKeyInput.value = data.apiKey;
});

saveBtn.addEventListener("click", () => {
  const apiKey = apiKeyInput.value.trim();

  if (!apiKey) {
    statusEl.textContent = "API key is required.";
    statusEl.style.color = "#f87171";
    return;
  }

  chrome.storage.sync.set({ apiKey }, () => {
    statusEl.textContent = "Settings saved!";
    statusEl.style.color = "#4ade80";
    setTimeout(() => { statusEl.textContent = ""; }, 2000);
  });
});
