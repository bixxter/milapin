const BACKEND_URL = "https://board.bixxter.com";
const dot = document.getElementById("dot");
const statusText = document.getElementById("statusText");
const optionsLink = document.getElementById("optionsLink");

optionsLink.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

chrome.storage.sync.get(["apiKey"], async (data) => {
  if (!data.apiKey) {
    dot.className = "dot err";
    statusText.textContent = "Not configured";
    return;
  }

  try {
    const res = await fetch(`${BACKEND_URL}/health`, { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      dot.className = "dot ok";
      statusText.textContent = "Connected";
    } else {
      dot.className = "dot err";
      statusText.textContent = "Server error";
    }
  } catch {
    dot.className = "dot err";
    statusText.textContent = "Cannot reach server";
  }
});
