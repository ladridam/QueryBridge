document.addEventListener("DOMContentLoaded", () => {
  const status = document.getElementById("status");
  const suggestionsEl = document.getElementById("suggestions");
  const originalQueryEl = document.getElementById("original-query");
  const domainTag = document.getElementById("domain-tag");
  const errorBox = document.getElementById("error-box");
  const errorMsg = document.getElementById("error-msg");
  const retryBtn = document.getElementById("retry-btn");
  const noKeyBox = document.getElementById("no-key-box");
  const countEl = document.getElementById("result-count");

  document.getElementById("options-link").addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });

  document.getElementById("go-to-options-btn").addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });

  let currentQuery = null;

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

      currentQuery = query;
      originalQueryEl.textContent = "\"" + query + "\"";
      showSkeleton();
      refine(query);
    });
  });

  retryBtn.addEventListener("click", () => {
    if (currentQuery) {
      hideError();
      showSkeleton();
      refine(currentQuery);
    }
  });

  function refine(query) {
    chrome.storage.local.get("geminiApiKey", (data) => {
      if (!data.geminiApiKey) {
        hideSkeleton();
        noKeyBox.style.display = "block";
        return;
      }
      sendWithRetry({ type: "REFINE_QUERY", query }, 3);
    });
  }

  function sendWithRetry(message, retriesLeft) {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        if (retriesLeft > 0) {
          setTimeout(() => sendWithRetry(message, retriesLeft - 1), 300);
        } else {
          showError("Could not reach the background worker. Try reloading the extension.");
        }
        return;
      }
      if (!response || response.error) {
        showError(response?.error || "Empty response from Gemini.");
        return;
      }
      renderSuggestions(response.suggestions, response.domain);
    });
  }

  function showStatus(text) {
    status.textContent = text;
    suggestionsEl.innerHTML = "";
    hideError();
    noKeyBox.style.display = "none";
  }

  function showSkeleton() {
    status.textContent = "";
    hideError();
    noKeyBox.style.display = "none";
    suggestionsEl.innerHTML = `
      <div class="skeleton"></div>
      <div class="skeleton"></div>
      <div class="skeleton"></div>
      <div class="skeleton"></div>
    `;
  }

  function hideSkeleton() {
    suggestionsEl.innerHTML = "";
  }

  function showError(text) {
    hideSkeleton();
    status.textContent = "";
    errorMsg.textContent = text;
    errorBox.style.display = "block";
    if (countEl) countEl.textContent = "";
  }

  function hideError() {
    errorBox.style.display = "none";
    errorMsg.textContent = "";
  }

  function renderSuggestions(suggestions) {
    status.textContent = "";
    suggestionsEl.innerHTML = "";
    hideError();
    noKeyBox.style.display = "none";

    if (domainTag) {
      if (domain && domain !== "general"){
        domainTag.textContent = domain;
        domainTag.style.display = "inline-block";
      } else {
        domainTag.style.display = "none";
      }
    }

    if (!suggestions || suggestions.length === 0) {
      showStatus("No suggestions returned. Try a different query.");
      if (countEl) countEl.textContent = "";
      return;
    }

    if (countEl) countEl.textContent = suggestions.length + " suggestions";

    suggestions.forEach(({ query: text, reason }) => {
      const card = document.createElement("div");
      card.className = "suggestion-card";

      const label = document.createElement("span");
      label.className = "suggestion-text";
      label.textContent = text;

      const btnGroup = document.createElement("div");
      btnGroup.style.display = "flex";
      btnGroup.style.gap = "4px";
      btnGroup.style.flexShrink = "0";

      const tooltip = document.createElement("div");
      tooltip.className = "tooltip";
      tooltip.textContent = reason || "More specific phrasing for better results.";

      const whyBtn = document.createElement("button");
      whyBtn.className = "why-btn";
      whyBtn.textContent = "Why?";
      whyBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const isVisible = tooltip.classList.contains("visible");
        document.querySelectorAll(".tooltip.visible").forEach(t => t.classList.remove("visible"));
        if (!isVisible) tooltip.classList.add("visible");
      });

      const copyBtn = document.createElement("button");
      copyBtn.className = "copy-btn";
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
        document.querySelectorAll(".tooltip.visible").forEach(t => t.classList.remove("visible"));
        const searchUrl = "https://www.google.com/search?q=" + encodeURIComponent(text);
        chrome.tabs.create({ url: searchUrl });
      });

      btnGroup.appendChild(whyBtn);
      btnGroup.appendChild(copyBtn);
      card.appendChild(tooltip);
      card.appendChild(label);
      card.appendChild(btnGroup);
      suggestionsEl.appendChild(card);
    });

    document.addEventListener("click", () => {
      document.querySelectorAll(".tooltip.visible").forEach(t => t.classList.remove("visible"));
    }, { once: false });
  }
  
});