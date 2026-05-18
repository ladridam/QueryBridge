const input = document.getElementById("api-key");
const saveBtn = document.getElementById("save-btn");
const savedMsg = document.getElementById("saved-msg");

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
