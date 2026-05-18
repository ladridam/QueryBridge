function extractQuery(url) {
    try {
        const parsed = new URL(url);
        const host = parsed.hostname;
        const params = parsed.searchParams;

        if (host.includes("google.com")) return params.get("q") || "";
        if (host.includes("bing.com")) return params.get("q") || "";
        if (host.includes("duckduckgo.com")) return params.get("q") || "";
        if (host.includes("yahoo.com")) return params.get("p") || "";
        if (host.includes("baidu.com")) return params.get("wd") || "";
        if (host.includes("yandex.com")) return params.get("text") || "";
        return "";
    } catch {
        return "";
    }
}

function cleanQuery(raw){
    if (!raw) return "";
    return decodeURIComponent(raw.replace(/\+/g, ' ')).trim();
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "GET_QUERY") {
        const raw = extractQuery(window.location.href);
        const query = cleanQuery(raw);
        sendResponse({ query });
    }
});