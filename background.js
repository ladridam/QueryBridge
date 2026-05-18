// background.js

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "REFINE_QUERY") {
    handleRefine(message.query).then(sendResponse);
    return true; // keeps the message channel open for async response
  }
});

async function handleRefine(query) {
  const stored = await chrome.storage.local.get("geminiApiKey");
  const apiKey = stored.geminiApiKey;

  if (!apiKey) {
    return { error: "No API key found. Please set it in the extension options." };
  }

  const prompt = `A user typed this search query: "${query}"
  
Return exactly 4 improved search queries that are more specific and domain-aware.
Format: one query per line, no numbering, no extra text.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return { error: data.error?.message || "API request failed." };
    }

    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const suggestions = raw
      .split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 0);

    return { suggestions };

  } catch (err) {
    return { error: "Network error: " + err.message };
  }
}
