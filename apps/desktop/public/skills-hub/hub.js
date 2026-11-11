// Adapted from Synapsek-Labs/keel src/skills-hub/page; production CSP uses external assets.

"use strict";
const PICKER = new URLSearchParams(location.search).get("embed") === "picker";
if (PICKER) document.body.classList.add("picker");

const PAGE = 60;
let ALL = [], SHOWN = 0, VIEW = [];

// Catalog ships with Hebri. No website endpoint or account is used.
Promise.resolve(window.HEBRI_SKILLS_INDEX).then(d => {
  if (!Array.isArray(d.skills) || !d.skills.length) throw new Error("Empty or invalid catalog");
  const skills = d.skills;
  document.getElementById("sub").textContent =
    skills.length.toLocaleString() + " skills · index v" + (d.version ?? "?") +
    " · built " + (d.generated_at || "unknown");
  // precompute a lowercase haystack once, so per-keystroke search is one .includes()
  ALL = skills.map(s => ({
    n: s.name || "", d: s.description || "", s: s.source || "",
    t: s.trust_level || "community", id: s.identifier || "",
    h: [s.name, s.description, s.identifier, (s.tags || []).join(" "),
        (s.extra && s.extra.provider) || ""].join(" ").toLowerCase()
  }));
  const srcs = {};
  ALL.forEach(x => srcs[x.s] = (srcs[x.s] || 0) + 1);
  const sel = document.getElementById("src");
  Object.keys(srcs).sort((a, b) => srcs[b] - srcs[a]).forEach(k => {
    const o = document.createElement("option"); o.value = k;
    o.textContent = k + " (" + srcs[k].toLocaleString() + ")"; sel.appendChild(o);
  });
  render(defaultView());
  parent.postMessage({ type: "hebri-skills-hub-ready", ok: true }, "*");
}).catch(e => {
  parent.postMessage({ type: "hebri-skills-hub-ready", ok: false }, "*");
  document.getElementById("sub").textContent = "Could not load the catalog: " + e.message;
  document.getElementById("grid").innerHTML =
    '<div class="empty">The bundled catalog is unavailable. Reinstall the current Hebri desktop package. ' +
    '</div>';
});

// Default view is a CURATED slice — never dump 100k rows at the reader.
function defaultView() {
  const filtered = rank("");
  return document.getElementById("src").value || document.getElementById("trust").value
    ? filtered : filtered.filter(x => x.t === "builtin" || x.t === "trusted");
}

function rank(query) {
  const q = query.toLowerCase().trim();
  const src = document.getElementById("src").value;
  const trust = document.getElementById("trust").value;
  let pool = ALL.filter(x => (!src || x.s === src) && (!trust || x.t === trust));
  if (!q) return pool;
  const hit = pool.filter(x => x.h.includes(q));
  // mirror the client's ranking: exact name > name prefix > word > substring
  const tier = x => x.n.toLowerCase() === q ? 0
    : x.n.toLowerCase().startsWith(q) ? 1
    : x.n.toLowerCase().split(/\s+/).includes(q) ? 2
    : x.n.toLowerCase().includes(q) ? 3 : 4;
  return hit.sort((a, b) => tier(a) - tier(b) || a.n.length - b.n.length);
}

function render(list) {
  VIEW = list; SHOWN = Math.min(PAGE, list.length);
  paint();
}

function paint() {
  const grid = document.getElementById("grid");
  const slice = VIEW.slice(0, SHOWN);
  grid.innerHTML = slice.map(card).join("");
  document.getElementById("stat").textContent =
    VIEW.length.toLocaleString() + " matching" +
    (VIEW.length > SHOWN ? " · showing first " + SHOWN : "");
  document.getElementById("more").hidden = VIEW.length <= SHOWN;
}

function card(x) {
  const t = x.t, name = esc(x.n), id = esc(x.id);
  const target = installTarget(x.id);
  const btn = target
    ? '<button data-action="' + (PICKER ? 'pick' : 'copy') + '" data-n="' + name + '" data-id="' + esc(target) + '" data-s="' + esc(x.s) + '">' + (PICKER ? '+ Add to this Bit' : 'Copy install command') + '</button>'
    : '<span class="sub">Installation identifier unavailable</span>';
  return '<div class="card">' +
    '<div class="name">' + name + '</div>' +
    '<div class="desc">' + esc(x.d) + '</div>' +
    '<div class="id">' + id + '</div>' +
    '<div class="meta"><span class="pill">' + esc(x.s) + '</span>' +
      '<span class="pill ' + esc(t) + '">' + esc(t) + '</span></div>' +
    '<div class="act">' + btn + '</div>' +
  '</div>';
}

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// Shell-safe, canonical registry identifiers only; never execute catalog metadata.
function installTarget(value) {
  return typeof value === "string" && value.length <= 512 &&
    /^@?[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(value) &&
    !value.split("/").some(part => !part || part === "." || part === "..") ? value : null;
}
function installCommand(identifier) { return "hebri skills install '" + identifier + "'"; }
function pick(btn) {
  const identifier = installTarget(btn.dataset.id);
  if (!identifier || window.parent === window) return;
  // Opaque file:// parents require '*'. The host accepts only this exact
  // sandboxed frame and validates the identifier before an owner-scoped install.
  window.parent.postMessage({type: "hebri-skill-pick", name: btn.dataset.n,
    identifier, source: btn.dataset.s}, "*");
  btn.textContent = "Sent to Hebri";
}
async function copyCmd(btn) {
  const identifier = installTarget(btn.dataset.id);
  if (!identifier) return;
  const command = installCommand(identifier);
  try {
    await navigator.clipboard.writeText(command);
    btn.textContent = "Copied";
  } catch {
    document.getElementById("stat").textContent = "Copy this command: " + command;
  }
}
document.getElementById("grid").addEventListener("click", event => {
  const btn = event.target.closest("button[data-action]");
  if (!btn) return;
  if (btn.dataset.action === "pick") pick(btn);
  else void copyCmd(btn);
});

let timer;
document.getElementById("q").addEventListener("input", e => {
  clearTimeout(timer);
  timer = setTimeout(() => {
    const v = e.target.value.trim();
    render(v ? rank(v) : defaultView());
  }, 120);
});
document.getElementById("src").addEventListener("change", () => {
  const v = document.getElementById("q").value.trim();
  render(v ? rank(v) : defaultView());
});
document.getElementById("trust").addEventListener("change", () => {
  const v = document.getElementById("q").value.trim();
  render(v ? rank(v) : defaultView());
});
document.getElementById("more").addEventListener("click", () => {
  SHOWN += PAGE; paint();
});
