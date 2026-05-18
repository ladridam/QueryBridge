document.addEventListener("DOMContentLoaded", () => {
  const status = document.getElementById("status");
  const suggestionsEl = document.getElementById("suggestions");
  const originalQueryEl = document.getElementById("original-query");

  document.getElementById("options-link").addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tabId = tabs[0]?.id;

    if (!tabId) {
      showStatus("Could not access the current tab.");
      return;
    }

    chrome.tabs.sendMessage(tabId, { type: "GET_QUERY" }, (response) => {
      if (chrome.runtime.lastError || !response) {
        showStatus("Open a search page and try again.");
        return;
      }

      const query = response.query;

      if (!query || query.length < 3) {
        showStatus("No search query detected on this page.");
        return;
      }

      originalQueryEl.textContent = "\"" + query + "\"";
      showSkeleton();

      sendWithRetry({ type: "REFINE_QUERY", query }, 3);
    });
  });

  function sendWithRetry(message, retriesLeft) {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        if (retriesLeft > 0) {
          setTimeout(() => sendWithRetry(message, retriesLeft - 1), 300);
        } else {
          showStatus("Could not reach background worker. Try reloading the extension.");
        }
        return;
      }
      if (!response || response.error) {
        showStatus("Error: " + (response?.error || "Empty response."));
        return;
      }
      renderSuggestions(response.suggestions);
    });
  }

  function showStatus(text) {
    status.textContent = text;
    suggestionsEl.innerHTML = "";
  }

  function showSkeleton() {
    status.textContent = "";
    suggestionsEl.innerHTML = `
      <div class="skeleton"></div>
      <div class="skeleton"></div>
      <div class="skeleton"></div>
      <div class="skeleton"></div>
    `;
  }

  function renderSuggestions(suggestions) {
    status.textContent = "";
    suggestionsEl.innerHTML = "";

    if (!suggestions || suggestions.length === 0) {
      showStatus("No suggestions returned. Try a different query.");
      return;
    }

    suggestions.forEach((text) => {
      const card = document.createElement("div");
      card.className = "suggestion-card";

      const label = document.createElement("span");
      label.className = "suggestion-text";
      label.textContent = text;

      const copyBtn = document.createElement("button");
      copyBtn.className = "copy-btn";
      copyBtn.title = "Copy";
      copyBtn.textContent = "Copy";

      copyBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text).then(() => {
          copyBtn.textContent = "Copied";
          copyBtn.classList.add("copied");
          setTimeout(() => {
            copyBtn.textContent = "Copy";
            copyBtn.classList.remove("copied");
          }, 1500);
        });
      });

      card.addEventListener("click", () => {
        const searchUrl = "https://www.google.com/search?q=" + encodeURIComponent(text);
        chrome.tabs.create({ url: searchUrl });
      });

      card.appendChild(label);
      card.appendChild(copyBtn);
      suggestionsEl.appendChild(card);
    });
  }
});