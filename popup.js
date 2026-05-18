document.addEventListener("DOMContentLoaded", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const url = tabs[0]?.url || "";
    const raw = extractQuery(url);
    const query = cleanQuery(raw);
    const status = document.getElementById("status");

    if (!query || query.length < 3) {
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
    const parsed = new URL(url);
    const host = parsed.hostname;
    const params = parsed.searchParams;

    if (host.includes("google.com")) {
      return params.get("q") || "";
    }
    if (host.includes("bing.com")) {
      return params.get("q") || "";
    }
    if (host.includes("duckduckgo.com")) {
      return params.get("q") || "";
    }
    if (host.includes("yahoo.com")) {
      return params.get("p") || "";
    }
    if (host.includes("baidu.com")) {
      return params.get("wd") || "";
    }
    if (host.includes("yandex.com")) {
      return params.get("text") || "";
    }
    return "";

  } catch {
    return "";
  }
}

function cleanQuery(raw){
  if (!raw) return "";
  return decodeURIComponent(raw.replace(/\+/g, ' ')).trim();
}
