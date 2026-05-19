const input = document.getElementById("api-key");
const saveBtn = document.getElementById("save-btn");
const savedMsg = document.getElementById("saved-msg");
const engineSelect = document.getElementById("engine-select");
const saveEngineBtn = document.getElementById("save-engine-btn");
const engineStatusMsg = document.getElementById("engine-status-msg");

// Load existing key on open
chrome.storage.local.get("geminiApiKey", (data) => {
  if (data.geminiApiKey) {
    input.value = data.geminiApiKey;
  }
});

// Save key on button click
saveBtn.addEventListener("click", () => {
  const key = input.value.trim();
  if (!key) return;
  chrome.storage.local.set({ geminiApiKey: key }, () => {
    savedMsg.style.display = "block";
    setTimeout(() => (savedMsg.style.display = "none"), 2000);
  });
});


function showEngineStatus(text, cls) {
  engineStatusMsg.textContent = text;
  engineStatusMsg.className = cls;
  setTimeout(() => { engineStatusMsg.textContent = ""; }, 3000);
}

// Load saved engine preference
chrome.storage.local.get("preferredEngine", (data) => {
  if (data.preferredEngine) {
    engineSelect.value = data.preferredEngine;
  }
});

saveEngineBtn.addEventListener("click", () => {
  const engine = engineSelect.value;
  chrome.storage.local.set({ preferredEngine: engine }, () => {
    showEngineStatus("Saved.", "msg-saved");
  });
});