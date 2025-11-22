const STORAGE_KEY = "jargonLinkerEntries_v1";

let entries = [];
let editingId = null;

const termInput = document.getElementById("term-input");
const definitionInput = document.getElementById("definition-input");
const categoryInput = document.getElementById("category-input");
const addBtn = document.getElementById("add-btn");
const searchInput = document.getElementById("search-input");
const categoryFilter = document.getElementById("category-filter");
const entriesContainer = document.getElementById("entries-container");

function loadEntries() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        entries = raw ? JSON.parse(raw) : [];
    } catch (e) {
        console.error("Failed to parse Jargon Linker entries:", e);
        entries = [];
    }
}

function saveEntries() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function renderCategoryFilter() {
    const categories = Array.from(
        new Set(entries.map((e) => e.category).filter((c) => c && c.trim() !== ""))
    ).sort((a, b) => a.localeCompare(b));

    const current = categoryFilter.value;
    categoryFilter.innerHTML = "";
    const allOpt = document.createElement("option");
    allOpt.value = "";
    allOpt.textContent = "All categories";
    categoryFilter.appendChild(allOpt);

    categories.forEach((cat) => {
        const opt = document.createElement("option");
        opt.value = cat;
        opt.textContent = cat;
        categoryFilter.appendChild(opt);
    });

    // restore selection if possible
    const exists = categories.includes(current);
    categoryFilter.value = exists ? current : "";
}

function renderEntries() {
    entriesContainer.innerHTML = "";
    const query = (searchInput.value || "").toLowerCase();
    const catFilter = categoryFilter.value || "";

    const filtered = entries.filter((e) => {
        const text = `${e.term} ${e.definition} ${e.category}`.toLowerCase();
        const matchesText = !query || text.includes(query);
        const matchesCat = !catFilter || e.category === catFilter;
        return matchesText && matchesCat;
    });

    if (filtered.length === 0) {
        const empty = document.createElement("div");
        empty.className = "jl-entry";
        empty.textContent = "No entries yet. Add your first term on the left.";
        entriesContainer.appendChild(empty);
        return;
    }

    filtered
        .slice()
        .sort((a, b) => b.createdAt - a.createdAt)
        .forEach((entry) => {
            const div = document.createElement("div");
            div.className = "jl-entry";

            const header = document.createElement("div");
            header.className = "jl-entry-header";

            const termSpan = document.createElement("span");
            termSpan.className = "jl-term";
            termSpan.textContent = entry.term;

            const meta = document.createElement("div");
            meta.className = "jl-meta";

            if (entry.category && entry.category.trim() !== "") {
                const cat = document.createElement("span");
                cat.className = "jl-category";
                cat.textContent = entry.category;
                meta.appendChild(cat);
            }

            const dateSpan = document.createElement("span");
            dateSpan.className = "jl-date";
            const d = new Date(entry.createdAt);
            dateSpan.textContent = d.toLocaleString();
            meta.appendChild(dateSpan);

            header.appendChild(termSpan);
            header.appendChild(meta);

            const def = document.createElement("div");
            def.className = "jl-definition";
            def.textContent = entry.definition;

            const actions = document.createElement("div");
            actions.className = "jl-actions";

            const editBtn = document.createElement("button");
            editBtn.className = "btn";
            editBtn.textContent = "Edit";
            editBtn.addEventListener("click", () => beginEdit(entry.id));

            const delBtn = document.createElement("button");
            delBtn.className = "btn danger";
            delBtn.textContent = "Delete";
            delBtn.addEventListener("click", () => deleteEntry(entry.id));

            actions.appendChild(editBtn);
            actions.appendChild(delBtn);

            div.appendChild(header);
            div.appendChild(def);
            div.appendChild(actions);

            entriesContainer.appendChild(div);
        });
}

function beginEdit(id) {
    const entry = entries.find((e) => e.id === id);
    if (!entry) return;
    editingId = id;
    termInput.value = entry.term;
    definitionInput.value = entry.definition;
    categoryInput.value = entry.category || "";
    addBtn.textContent = "Update Entry";
}

function clearForm() {
    editingId = null;
    termInput.value = "";
    definitionInput.value = "";
    categoryInput.value = "";
    addBtn.textContent = "Add / Update Entry";
}

function addOrUpdateEntry() {
    const term = termInput.value.trim();
    const def = definitionInput.value.trim();
    const cat = categoryInput.value.trim();

    if (!term || !def) {
        alert("Please provide both a term and a definition.");
        return;
    }

    const now = Date.now();

    if (editingId != null) {
        const idx = entries.findIndex((e) => e.id === editingId);
        if (idx !== -1) {
            entries[idx] = {
                ...entries[idx],
                term,
                definition: def,
                category: cat,
                updatedAt: now
            };
        }
    } else {
        const existing = entries.find(
            (e) => e.term.toLowerCase() === term.toLowerCase() && e.category === cat
        );
        if (existing) {
            existing.definition = def;
            existing.updatedAt = now;
        } else {
            const entry = {
                id: now + Math.random(),
                term,
                definition: def,
                category: cat,
                createdAt: now
            };
            entries.push(entry);
        }
    }

    saveEntries();
    renderCategoryFilter();
    renderEntries();
    clearForm();
}

function deleteEntry(id) {
    if (!confirm("Delete this entry?")) return;
    entries = entries.filter((e) => e.id !== id);
    saveEntries();
    renderCategoryFilter();
    renderEntries();
    if (editingId === id) {
        clearForm();
    }
}

// Event listeners
if (addBtn) {
    addBtn.addEventListener("click", addOrUpdateEntry);
}

if (searchInput) {
    searchInput.addEventListener("input", renderEntries);
}

if (categoryFilter) {
    categoryFilter.addEventListener("change", renderEntries);
}

// Init
loadEntries();
renderCategoryFilter();
renderEntries();
