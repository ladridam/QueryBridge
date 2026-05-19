// background.js

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "REFINE_QUERY") {
    handleRefine(message.query).then(sendResponse);
    return true; // keeps the message channel open for async response
  }
});

function detectDomain(query){
  const q = query.toLowerCase();

  const domains = [
    {
      name : "medical",
      keywords: ["disease", "symptom", "treatment", "diagnosis", "medicine", "drug", "pain", "infection", "surgery", "therapy", "disorder", "cancer", "virus", "bacteria", "health", "clinical", "patient"]
    },
    {
      name: "academic",
      keywords: ["research", "study", "paper", "journal", "theory", "literature", "hypothesis", "experiment", "citation", "thesis", "peer review", "methodology", "findings", "analysis", "survey"]
    },
    {
      name: "technical",
      keywords: ["code", "programming", "software", "algorithm", "database", "api", "framework", "debug", "function", "library", "server", "network", "linux", "python", "javascript", "css", "html", "react", "git", "docker", "deploy", "error", "bug"]
    },
    {
      name: "financial",
      keywords: ["stock", "investment", "market", "finance", "tax", "budget", "loan", "interest", "inflation", "economy", "crypto", "fund", "portfolio", "dividend", "equity", "revenue", "profit"]
    }
  ];
  for (const domain of domains) {
    if (domain.keywords.some(kw => q.includes(kw))) {
      return domain.name;
    }
  }
  return "general";
}

async function handleRefine(query) {
  const stored = await chrome.storage.local.get("geminiApiKey");
  const apiKey = stored.geminiApiKey;

  if (!apiKey) {
    return { error: "No API key found. Please set it in the extension options." };
  }

  const domain = detectDomain(query);

  //prompt for Gemini-2.5-flash
  const prompt = `You are a search query refinement assistant. A user has typed a vague or broad search query. Your job is to rewrite it into 4 improved alternatives that are more specific, precise, and domain-aware.

  Original query: "${query}"
  Detected domain: ${domain}

  Rules:
  - Preserve the user's original intent exactly — do not change what they are looking for
  - Infer the most likely domain (academic, medical, technical, legal, general) from the query and phrase suggestions accordingly
  - Each suggestion should reflect how an expert or experienced researcher in that domain would phrase the search
  - Suggestions should be diverse — approach the intent from different angles, not minor variations of each other
  - Use search-optimised phrasing: specific terms, relevant qualifiers, named concepts where appropriate
  - For each suggestion, provide a single short reason (max 10 words) explaining why it is more effective
  - Return exactly 4 suggestions in this exact format, nothing else:

  QUERY: <refined query>
  REASON: <short reason>

  QUERY: <refined query>
  REASON: <short reason>

  QUERY: <refined query>
  REASON: <short reason>

  QUERY: <refined query>
  REASON: <short reason>`;

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
    const suggestions = [];
    const blocks = raw.trim().split(/\n\s*\n/);
    for (const block of blocks) {
      const queryMatch = block.match(/QUERY:\s*(.+)/i);
      const reasonMatch = block.match(/REASON:\s*(.+)/i);

      if (queryMatch && reasonMatch) {
        suggestions.push({
          query: queryMatch[1].trim(),
          reason: reasonMatch[1].trim()
        });
      }
    }
    return { suggestions, domain };

  } catch (err) {
    return { error: "Network error: " + err.message };
  }
}
