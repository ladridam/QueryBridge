# QueryBridge

A Chrome extension that sits between what you mean and what you type.

Given a vague or broad search query, QueryBridge returns domain-aware, precise alternatives — refined phrasings that reflect the actual intent behind the original words. Each suggestion is designed to surface more relevant, specific results than the original query would have.

<img width="737" height="520" alt="QB query list" src="https://github.com/user-attachments/assets/bac11179-644a-449b-aef3-4bc1d19bbf70" />

---

## The problem

Search engines are built to retrieve. They are exceptionally good at finding content that matches what you type. But they make one silent assumption: that you already know how to describe what you are looking for.

That assumption fails more often than we acknowledge. A student researching an unfamiliar topic types broad, uncertain words and gets broad, uncertain results. A non-native English speaker knows what they mean but not how to phrase it in a way a search engine rewards. A professional stepping outside their domain lacks the vocabulary to surface precise results.

The problem is rarely the search engine. It is the query.

---

## What it does

- Detects the active search query on Google, Bing, DuckDuckGo, Yahoo, Yandex, and Baidu
- Infers the domain of the query — medical, technical, academic, financial, or legal
- Returns 4 refined, domain-aware alternatives using the Gemini API
- Explains why each rephrasing is more effective (the "Why?" tooltip)
- Opens suggestions in your preferred search engine with one click
- Supports copy-to-clipboard per suggestion

---

## Installation

QueryBridge is not published to the Chrome Web Store. Install it manually in developer mode.

**Requirements:** A free Gemini API key from [aistudio.google.com](https://aistudio.google.com)

**Steps:**

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions`
3. Enable **Developer mode** (toggle, top right)
4. Click **Load unpacked** and select the `QueryBridge` folder
5. The extension appears in your toolbar
6. Right-click the icon → **Options**
7. Paste your Gemini API key and click Save

---

## Usage

1. Go to any supported search engine and run a search
2. Click the QueryBridge icon in the toolbar
3. Four refined query suggestions appear within a few seconds
4. Click any suggestion to open it as a new search
5. Click **Why?** on any card to see why that phrasing is more effective
6. Click **Copy** to copy a suggestion to your clipboard

---

## Configuration

Open the Options page (right-click the extension icon → Options) to:

- Set or update your Gemini API key
- Choose your preferred search engine for opening suggestions

---

## Supported search engines

Query detection works on: Google, Bing, DuckDuckGo, Yahoo, Yandex, Baidu

Suggestions can open in: Google, Bing, DuckDuckGo, Yahoo, Yandex

---

## Tech stack

- Vanilla JavaScript — no frameworks, no build tools
- Chrome Extensions Manifest V3
- Gemini API (`gemini-2.5-flash`)

---

## Privacy

QueryBridge does not collect, transmit, or store any user data. Your search queries are sent directly from your browser to the Gemini API using your own API key. Nothing passes through any intermediate server.

Your API key is stored locally in your browser using `chrome.storage.local` and never leaves your machine.

---

## Project structure

```
QueryBridge/
├── manifest.json       # Extension configuration (MV3)
├── background.js       # Service worker — handles Gemini API calls
├── content.js          # Detects search query from the active page
├── popup.html          # Extension popup UI
├── popup.js            # Popup logic — rendering, state, interactions
├── options.html        # Settings page UI
├── options.js          # Settings logic — API key and engine preference
└── icons/              # Extension icons
```

---

## Limitations

- Requires a personal Gemini API key — the extension does not work without one
- Free tier allows up to 15 requests per minute and 1 million tokens per day, which is sufficient for personal use
- Domain detection is keyword-based and may misclassify ambiguous queries

---

## License

MIT
