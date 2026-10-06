const state = { notes: [], filter: "all", query: "", lang: "ar", selected: null, mine: [] };

const fieldLabel = {
  psychiatry: { ar: "طب نفسي", en: "Psychiatry" },
  criminology: { ar: "علم إجرام", en: "Criminology" }
};

function loadMine() {
  try { state.mine = JSON.parse(localStorage.getItem("case-atlas-notes") || "[]"); }
  catch { state.mine = []; }
}

function saveMine() {
  localStorage.setItem("case-atlas-notes", JSON.stringify(state.mine));
}

function visible() {
  const q = state.query.trim().toLowerCase();
  return [...state.notes, ...state.mine].filter((note) => {
    if (state.filter !== "all" && note.field !== state.filter) return false;
    if (!q) return true;
    return [note.title_ar, note.title_en, note.body_ar, note.body_en, note.id].join(" ").toLowerCase().includes(q);
  });
}

function render() {
  const rows = visible();
  document.querySelector("#count").textContent = rows.length;
  document.querySelector("#mine-count").textContent = state.mine.length;
  document.querySelector("#table").innerHTML = rows.map((note) => `
    <tr data-id="${note.id}">
      <td><span class="tag">${note.id}</span></td>
      <td><span class="tag ${note.field}">${fieldLabel[note.field][state.lang]}</span></td>
      <td><strong>${state.lang === "ar" ? note.title_ar : note.title_en}</strong><div class="note">${state.lang === "ar" ? note.title_en : note.title_ar}</div></td>
      <td>${note.level || "—"}</td>
    </tr>
  `).join("") || `<tr><td colspan="4">لا نتائج.</td></tr>`;

  document.querySelectorAll("#table tr").forEach((row) => {
    row.addEventListener("click", () => open(row.dataset.id));
  });

  const drawer = document.querySelector("#drawer");
  if (!state.selected) { drawer.hidden = true; return; }
  const note = [...state.notes, ...state.mine].find((item) => item.id === state.selected);
  drawer.hidden = false;
  drawer.innerHTML = `
    <p class="mark">${note.id} · ${fieldLabel[note.field][state.lang]}</p>
    <h2>${note.title_ar}</h2>
    <p>${note.body_ar}</p>
    <p class="en"><strong>${note.title_en}.</strong> ${note.body_en}</p>
  `;
}

function open(id) {
  state.selected = id;
  render();
  document.querySelector("#drawer").scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function bind() {
  document.querySelectorAll("[data-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      state.filter = button.dataset.filter;
      document.querySelectorAll("[data-filter]").forEach((item) => item.classList.toggle("active", item === button));
      render();
    });
  });
  document.querySelector("#q").addEventListener("input", (event) => {
    state.query = event.target.value;
    render();
  });
  document.querySelector("#lang").addEventListener("click", () => {
    state.lang = state.lang === "ar" ? "en" : "ar";
    document.documentElement.lang = state.lang;
    document.documentElement.dir = state.lang === "ar" ? "rtl" : "ltr";
    document.querySelector("#lang").textContent = state.lang === "ar" ? "EN" : "عربي";
    render();
  });
  document.querySelector("#add").addEventListener("click", () => {
    const title = document.querySelector("#title").value.trim();
    const body = document.querySelector("#body").value.trim();
    const field = document.querySelector("#field").value;
    if (!title || !body) return;
    state.mine.unshift({
      id: "ME-" + String(state.mine.length + 1).padStart(2, "0"),
      field,
      level: "خاص",
      title_ar: title,
      title_en: title,
      body_ar: body,
      body_en: body
    });
    saveMine();
    document.querySelector("#title").value = "";
    document.querySelector("#body").value = "";
    render();
  });
}

fetch("data/notes.json")
  .then((response) => response.json())
  .then((notes) => {
    state.notes = notes;
    loadMine();
    bind();
    render();
  })
  .catch(() => {
    document.querySelector("#table").innerHTML = "<tr><td>تعذر تحميل البطاقات. افتح الملف عبر خادم محلي أو GitHub Pages.</td></tr>";
  });
