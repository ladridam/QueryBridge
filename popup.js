document.addEventListener("DOMContentLoaded", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const url = tabs[0]?.url || "";
    const query = extractQuery(url);
    const status = document.getElementById("status");

    if (!query) {
      status.textContent = "No search query detected on this page.";
      return;
    }

    status.textContent = "Detected: " + query + " — calling Gemini...";
    sendWithRetry({ type: "REFINE_QUERY", query }, 3, status);
  });
});

function sendWithRetry(message, retriesLeft, status) {
  chrome.runtime.sendMessage(message, (response) => {
    if (chrome.runtime.lastError) {
      if (retriesLeft > 0) {
        setTimeout(() => sendWithRetry(message, retriesLeft - 1, status), 300);
      } else {
        status.textContent = "Error: Could not reach background worker. Try reloading the extension.";
      }
      return;
    }
    if (!response || response.error) {
      status.textContent = "Error: " + (response?.error || "Empty response.");
      return;
    }
    console.log("Suggestions received:", response.suggestions);
    status.textContent = "Success. Open DevTools console to see suggestions.";
  });
}

function extractQuery(url) {
  try {
    const params = new URL(url).searchParams;
    return params.get("q") || params.get("p") || "";
  } catch {
    return "";
  }
}
