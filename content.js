// ── Rolox Content Script ──────────────────────────────
const ROLOX_BASE = "https://onemapasofficeal.github.io/html-roblox-comunides-games/";
const EXT        = chrome.runtime.getURL;

// Ícones
const ICO_USES_ROLOX  = EXT("icons/roblox-rolox.png");   // usa Rolox
const ICO_BANNED      = EXT("icons/ROLOX-x.png");         // banido do Rolox
const ICO_NO_ROLOX    = EXT("icons/rolox-n.png");         // não usa Rolox
const ICO_OWNER       = EXT("icons/ROBLOX-ROLOX_dono.png"); // dono do Rolox

// Overlays (explicações)
const OVL_USES_ROLOX  = EXT("icons/roblox-rolox@2.png"); // overlay "usa Rolox"
const OVL_BANNED      = EXT("icons/roblox-rolox@3.png"); // overlay "banido"
const OVL_NO_ROLOX    = EXT("icons/roblox-rolox@4.png"); // overlay "não usa"
const OVL_OWNER       = EXT("icons/ROBLOX-ROLOX_dono@2.png"); // overlay "dono"

// Username do dono do Rolox
const ROLOX_OWNER    = "0p_409";
const ROLOX_OWNER_ID = "8444264251"; // ID do perfil do dono

// ── Storage: usuários Rolox conhecidos ───────────────
// Formato: { username: "uses"|"banned"|"none" }
async function getRoloxStatus(username) {
  return new Promise(resolve => {
    chrome.storage.local.get("rolox_users", data => {
      const users = data.rolox_users || {};
      resolve(users[username.toLowerCase()] || "none");
    });
  });
}

async function setRoloxStatus(username, status) {
  return new Promise(resolve => {
    chrome.storage.local.get("rolox_users", data => {
      const users = data.rolox_users || {};
      users[username.toLowerCase()] = status;
      chrome.storage.local.set({ rolox_users: users }, resolve);
    });
  });
}

// ── Cria o badge de status ────────────────────────────
function createBadge(status, username) {
  const badge = document.createElement("div");
  badge.className = "rolox-badge";
  badge.dataset.username = username;
  badge.dataset.status   = status;

  let icon, tooltip, overlayImg;

  // Dono do Rolox tem prioridade sobre qualquer outro status
  if (username.toLowerCase() === ROLOX_OWNER.toLowerCase() || status === "owner") {
    icon       = ICO_OWNER;
    tooltip    = "Este é o dono do Rolox!";
    overlayImg = OVL_OWNER;
  } else if (status === "uses") {
    icon       = ICO_USES_ROLOX;
    tooltip    = "Este usuário também usa Rolox";
    overlayImg = OVL_USES_ROLOX;
  } else if (status === "banned") {
    icon       = ICO_BANNED;
    tooltip    = "Este usuário foi banido do Rolox";
    overlayImg = OVL_BANNED;
  } else {
    icon       = ICO_NO_ROLOX;
    tooltip    = "Este usuário não usa Rolox";
    overlayImg = OVL_NO_ROLOX;
  }

  badge.innerHTML = `<img src="${icon}" title="${tooltip}" style="
    width:20px; height:20px; cursor:pointer;
    border-radius:4px; vertical-align:middle;
    margin-left:6px; display:inline-block;
  "/>`;

  // Overlay ao clicar
  badge.querySelector("img").addEventListener("click", (e) => {
    e.stopPropagation();
    showOverlay(overlayImg, username, status, e.clientX, e.clientY);
  });

  return badge;
}

// ── Mostra overlay com a imagem explicativa ───────────
function showOverlay(imgSrc, username, status, x, y) {
  // Remove overlay anterior
  document.querySelectorAll(".rolox-overlay").forEach(el => el.remove());

  const overlay = document.createElement("div");
  overlay.className = "rolox-overlay";
  overlay.style.cssText = `
    position: fixed;
    left: ${Math.min(x, window.innerWidth - 320)}px;
    top:  ${Math.min(y + 10, window.innerHeight - 200)}px;
    z-index: 999999;
    background: #fff;
    border: 2px solid #ddd;
    border-radius: 8px;
    padding: 8px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.2);
    max-width: 300px;
  `;

  const img = document.createElement("img");
  img.src   = imgSrc;
  img.style.cssText = "width:100%; border-radius:4px; display:block;";

  // Botão fechar
  const close = document.createElement("button");
  close.textContent = "×";
  close.style.cssText = `
    position:absolute; top:4px; right:8px;
    background:none; border:none; font-size:18px;
    cursor:pointer; color:#999; line-height:1;
  `;
  close.onclick = () => overlay.remove();

  // Ações extras dependendo do status
  if (status === "uses") {
    const btnOpen = document.createElement("a");
    btnOpen.textContent = "▶ Abrir no Rolox";
    btnOpen.href = ROLOX_BASE + "home.html";
    btnOpen.target = "_blank";
    btnOpen.style.cssText = "display:block;margin-top:6px;text-align:center;background:#00a2ff;color:#fff;padding:6px;border-radius:4px;text-decoration:none;font-weight:bold;font-size:13px;";
    overlay.appendChild(img);
    overlay.appendChild(btnOpen);
  } else {
    overlay.appendChild(img);
  }

  overlay.appendChild(close);
  document.body.appendChild(overlay);

  // Fecha ao clicar fora
  setTimeout(() => {
    document.addEventListener("click", () => overlay.remove(), { once: true });
  }, 100);
}

// ── Injeta badges nos perfis de usuário ──────────────
async function injectBadges() {
  const profileMatch = window.location.pathname.match(/\/users\/(\d+)\/profile/);
  if (!profileMatch) return;

  const pageUserId = profileMatch[1];

  // ── Perfil do dono do Rolox ───────────────────────
  if (pageUserId === ROLOX_OWNER_ID) {
    if (document.getElementById("rolox-owner-badge")) return;

    // Encontra o elemento com @0p_409 ou qualquer @ na página
    const allEls = document.querySelectorAll("p, span, h2, h3, div");
    let target = null;
    for (const el of allEls) {
      const txt = el.textContent.trim();
      if (txt.startsWith("@") && txt.length < 40 && el.children.length === 0) {
        target = el;
        break;
      }
    }

    const badge = document.createElement("span");
    badge.id = "rolox-owner-badge";
    badge.style.cssText = "display:inline-block;margin-left:6px;vertical-align:middle;cursor:pointer;";
    badge.innerHTML = `<img src="${ICO_OWNER}" title="Dono do Rolox" style="width:20px;height:20px;border-radius:4px;"/>`;
    badge.onclick = (e) => {
      e.stopPropagation();
      showOverlay(OVL_OWNER, ROLOX_OWNER, "owner", e.clientX, e.clientY);
    };

    if (target) {
      target.appendChild(badge);
    } else {
      // Fallback: coloca logo abaixo do avatar
      const header = document.querySelector("h1, [class*='display-name'], [class*='DisplayName']");
      if (header) header.appendChild(badge);
    }
    return;
  }

  // ── Outros perfis ─────────────────────────────────
  const allEls = document.querySelectorAll("p, span, h2, h3");
  for (const el of allEls) {
    const txt = el.textContent.trim();
    if (txt.startsWith("@") && txt.length < 40 && el.children.length === 0 && !el.querySelector(".rolox-badge")) {
      const username = txt.replace("@", "").trim();
      if (!username) continue;
      const status = await getRoloxStatus(username);
      const badge  = createBadge(status, username);
      el.appendChild(badge);
      break;
    }
  }
}

// ── Substitui favicon ─────────────────────────────────
function replaceFavicon() {
  document.querySelectorAll("link[rel*='icon']").forEach(l => {
    l.href = ICO_USES_ROLOX;
  });
  if (!document.querySelector("link[rel='icon']")) {
    const link = document.createElement("link");
    link.rel  = "icon";
    link.href = ICO_USES_ROLOX;
    document.head.appendChild(link);
  }
}

// ── Adiciona botão "Abrir no Rolox" nas páginas de jogo
function addRoloxButton() {
  const match = window.location.pathname.match(/\/games\/(\d+)/);
  if (!match || document.getElementById("rolox-btn")) return;

  const placeId  = match[1];
  const gameName = document.title.replace(" - Roblox", "").trim();
  const playBtn  = document.querySelector(
    "[data-testid='game-detail-play-btn'], .btn-primary-md, button[class*='play']"
  );
  if (!playBtn) return;

  const btn = document.createElement("a");
  btn.id    = "rolox-btn";
  btn.href  = `${ROLOX_BASE}?name_app=${encodeURIComponent(gameName)}&id_map=${placeId}&data_and_horario=${Date.now()}`;
  btn.style.cssText = `
    display:inline-flex; align-items:center; gap:6px;
    background:#00a2ff; color:#fff; font-weight:bold;
    font-size:14px; padding:8px 18px; border-radius:6px;
    text-decoration:none; margin-left:8px; cursor:pointer;
  `;
  btn.innerHTML = `<img src="${ICO_USES_ROLOX}" width="18" height="18" style="border-radius:3px"/> Abrir no Rolox`;
  playBtn.parentNode?.insertBefore(btn, playBtn.nextSibling);
}

// ── Badge fixo no canto ───────────────────────────────
function addCornerBadge() {
  if (document.getElementById("rolox-corner")) return;
  const b = document.createElement("div");
  b.id = "rolox-corner";
  b.style.cssText = `
    position:fixed; bottom:16px; right:16px;
    background:#00a2ff; color:#fff;
    font-family:Arial,sans-serif; font-size:11px; font-weight:bold;
    padding:4px 10px; border-radius:12px; z-index:99999;
    opacity:0.85; pointer-events:none; letter-spacing:0.5px;
  `;
  b.textContent = "ROLOX";
  document.body.appendChild(b);
}

// ── Init ──────────────────────────────────────────────
function run() {
  // Garante que o dono sempre está marcado
  chrome.storage.local.get("rolox_users", data => {
    const users = data.rolox_users || {};
    users["0p_409"] = "owner";
    chrome.storage.local.set({ rolox_users: users });
  });

  replaceFavicon();
  addRoloxButton();
  addCornerBadge();
  injectBadges();
}

run();

// Observer para SPAs
const observer = new MutationObserver(() => {
  addRoloxButton();
  injectBadges();
});
observer.observe(document.body, { childList: true, subtree: true });

// Tentativas extras com delay para SPAs lentas
setTimeout(injectBadges, 1500);
setTimeout(injectBadges, 3000);
setTimeout(injectBadges, 5000);
