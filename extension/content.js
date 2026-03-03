// ─────────────────────────────────────────────
// Load settings from chrome.storage.sync
// ─────────────────────────────────────────────
let backendUrl = "";
let apiKey = "";

chrome.storage.sync.get(["backendUrl", "apiKey"], (data) => {
  backendUrl = data.backendUrl || "";
  apiKey = data.apiKey || "";
  // Inject buttons now that settings are loaded
  injectButtonsIntoPins();
});

// Listen for settings changes
chrome.storage.onChanged.addListener((changes) => {
  if (changes.backendUrl) backendUrl = changes.backendUrl.newValue || "";
  if (changes.apiKey) apiKey = changes.apiKey.newValue || "";
});

// ─────────────────────────────────────────────
// Button injection
// ─────────────────────────────────────────────

function createGrabButton(pinUrl) {
  const btn = document.createElement("button");
  btn.className = "pg-grab-btn";

  if (!backendUrl || !apiKey) {
    btn.innerText = "Setup needed";
    btn.title = "Open extension options to configure";
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      chrome.runtime.sendMessage({ action: "openOptions" });
    });
    return btn;
  }

  btn.innerText = "\u2B07 Grab";
  btn.title = "Send to your board";

  btn.addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();

    btn.innerText = "\u23F3";
    btn.disabled = true;

    try {
      const response = await fetch(`${backendUrl}/grab`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey,
        },
        body: JSON.stringify({ pin_url: pinUrl }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Server error");
      }

      const data = await response.json();
      btn.innerText = "\u2705";
      console.log("Grabbed:", data);
    } catch (err) {
      btn.innerText = "\u274C";
      console.error("Grab failed:", err);
    }

    setTimeout(() => {
      btn.innerText = "\u2B07 Grab";
      btn.disabled = false;
    }, 2000);
  });

  return btn;
}

function injectButtonsIntoPins() {
  const pinLinks = document.querySelectorAll('a[href*="/pin/"]');

  pinLinks.forEach((link) => {
    const href = link.getAttribute("href");

    if (!href || !href.match(/\/pin\/\d+/)) return;
    if (link.querySelector(".pg-grab-btn")) return;

    const pinUrl = `https://www.pinterest.com${href}`;
    const btn = createGrabButton(pinUrl);

    link.style.position = "relative";
    link.appendChild(btn);
  });
}

// ─────────────────────────────────────────────
// MutationObserver — watch for dynamically loaded pins
// ─────────────────────────────────────────────
const observer = new MutationObserver(() => {
  injectButtonsIntoPins();
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});

injectButtonsIntoPins();
