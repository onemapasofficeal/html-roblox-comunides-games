const BASE = "https://onemapasofficeal.github.io/html-roblox-comunides-games/";

const ICO_USES   = "icons/roblox-rolox.png";
const ICO_BANNED = "icons/ROLOX-x.png";
const ICO_NONE   = "icons/rolox-n.png";

// ── Carrega info do usuário logado ────────────────────
chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
  const tab = tabs[0];
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => ({
        username:    localStorage.getItem("rolox_username") || "",
        displayname: localStorage.getItem("rolox_displayname") || "",
        id:          localStorage.getItem("rolox_id") || ""
      })
    });
    const data = results?.[0]?.result;
    if (data?.username) {
      document.getElementById("userName").textContent = data.displayname || data.username;
      document.getElementById("userId").textContent   = "@" + data.username;
      if (data.id && parseInt(data.id) > 0) {
        fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${data.id}&size=150x150&format=Png`)
          .then(r => r.json())
          .then(j => {
            const url = j.data?.[0]?.imageUrl;
            if (url) document.getElementById("avatarImg").src = url;
          }).catch(() => {});
      }
    } else {
      document.getElementById("userName").textContent = "Não logado";
    }
  } catch {
    document.getElementById("userName").textContent = "—";
  }
});

// ── Botão Home ────────────────────────────────────────
document.getElementById("btnHome").href = BASE + "home.html";

// ── Substituir ícones manualmente ────────────────────
document.getElementById("btnReplace").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["content.js"] });
  setStatus("✅ Ícones substituídos!");
});

// ── Toggle extensão ───────────────────────────────────
let enabled = true;
document.getElementById("btnToggle").addEventListener("click", () => {
  enabled = !enabled;
  document.getElementById("btnToggle").textContent = enabled ? "✅ Extensão ativa" : "⏸ Extensão pausada";
  chrome.storage.local.set({ rolox_enabled: enabled });
});
chrome.storage.local.get("rolox_enabled", (data) => {
  enabled = data.rolox_enabled !== false;
  document.getElementById("btnToggle").textContent = enabled ? "✅ Extensão ativa" : "⏸ Extensão pausada";
});

// ── Marcar usuário manualmente ────────────────────────
document.getElementById("btnMarkUser").addEventListener("click", () => {
  document.getElementById("markPanel").style.display =
    document.getElementById("markPanel").style.display === "none" ? "block" : "none";
});

document.getElementById("btnMarkUses").addEventListener("click",   () => markUser("uses"));
document.getElementById("btnMarkBanned").addEventListener("click", () => markUser("banned"));
document.getElementById("btnMarkNone").addEventListener("click",   () => markUser("none"));

async function markUser(status) {
  const u = document.getElementById("txtMarkUser").value.trim().toLowerCase();
  if (!u) { setStatus("Digite um username."); return; }
  chrome.storage.local.get("rolox_users", data => {
    const users = data.rolox_users || {};
    users[u] = status;
    chrome.storage.local.set({ rolox_users: users }, () => {
      const labels = { uses: "usa Rolox ✅", banned: "banido ❌", none: "não usa Rolox" };
      setStatus(`@${u} marcado como: ${labels[status]}`);
      document.getElementById("txtMarkUser").value = "";
    });
  });
}

function setStatus(msg) {
  document.getElementById("status").textContent = msg;
  setTimeout(() => document.getElementById("status").textContent = "Rolox Extension v1.0.0", 3000);
}
