// ── Rolox Background Service Worker ──────────────────
// Atualiza o ícone da extensão e gerencia comunicação

const ROLOX_ICON = "icons/roblox-rolox.png";

// Quando uma aba do Roblox é atualizada, injeta o content script
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url?.includes("roblox.com")) {
    // Atualiza ícone da extensão para a aba ativa
    chrome.action.setIcon({
      tabId,
      path: {
        "16":  ROLOX_ICON,
        "48":  ROLOX_ICON,
        "128": ROLOX_ICON
      }
    });
  }
});

// Mensagens do content script ou popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "GET_VERSION") {
    sendResponse({ version: "1.0.0", name: "Rolox" });
  }
  if (msg.type === "OPEN_ROLOX") {
    chrome.tabs.create({ url: msg.url });
  }
});
