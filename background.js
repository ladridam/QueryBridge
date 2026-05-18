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

  const prompt = `You are a search query refinement assistant. A user has typed a vague or broad search query. Your job is to rewrite it into 4 improved alternatives that are more specific, precise, and domain-aware.

Original query: "${query}"

Rules:
- Preserve the user's original intent exactly — do not change what they are looking for
- Infer the most likely domain (academic, medical, technical, legal, general) from the query and phrase suggestions accordingly
- Each suggestion should reflect how an expert or experienced researcher in that domain would phrase the search
- Suggestions should be diverse — approach the intent from different angles, not minor variations of each other
- Use search-optimised phrasing: specific terms, relevant qualifiers, named concepts where appropriate
- Do not add explanations, numbering, bullet points, or any extra text
- Return exactly 4 suggestions, one per line, nothing else

Refined queries:`;

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
