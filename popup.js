document.addEventListener("DOMContentLoaded", () => {
  const status = document.getElementById("status");

  chrome.tabs.query({ active: true, currentWindow: true}, (tabs) => {
    const tabId = tabs[0]?.id;

    if (!tabId) { 
      status.textContent = "Error: No active tab found.";
      return;
    }
    chrome.tabs.sendMessage(tabId, { type: "GET_QUERY"}, (response) => {
      if (chrome.runtime.lastError || !response) {
        status.textContent = "No search query detected on this page.";
        return;
      }
      const query = response.query;
      if (!query || query.length < 3){
        status.textContent = "No search query detected on this page.";
        return;
      }
      status.textContent = "Detected: " + query + " - calling Gemini...";
      sendWithRetry({ type: "REFINE_QUERY", query }, 3, status);
    })
  })
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
