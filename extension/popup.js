const dot = document.getElementById("dot");
const statusText = document.getElementById("statusText");
const optionsLink = document.getElementById("optionsLink");

optionsLink.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

chrome.storage.sync.get(["backendUrl", "apiKey"], async (data) => {
  if (!data.backendUrl || !data.apiKey) {
    dot.className = "dot err";
    statusText.textContent = "Not configured";
    return;
  }

  try {
    const res = await fetch(`${data.backendUrl}/health`, { signal: AbortSignal.timeout(5000) });
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
