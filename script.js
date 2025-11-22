// Simple navigation handling
const navItems = document.querySelectorAll(".nav-item");
const sections = document.querySelectorAll(".section");
const topbarTitle = document.getElementById("topbar-title");
const kaiLog = document.getElementById("kai-log");
const commandInput = document.getElementById("command-input");
const sidebarToggle = document.getElementById("sidebar-toggle");
const commandSuggestions = document.getElementById("command-suggestions");
const clearLogBtn = document.getElementById("clear-log-btn");
const moduleSearch = document.getElementById("module-search");
const modulesGrid = document.getElementById("modules-grid");
const workspaceDetailsBody = document.getElementById("workspace-details-body");
const workspaceDetailsPlaceholder = document.getElementById("workspace-details-placeholder");

const sectionTitles = {
    dashboard: "Dashboard",
    modules: "Modules",
    workspaces: "Workspaces",
    archives: "Archives / Transcend",
    settings: "Kai Core / Settings"
};

// ---------------------
// Sidebar navigation
// ---------------------
navItems.forEach((item) => {
    item.addEventListener("click", () => {
        const sectionKey = item.getAttribute("data-section");

        // Sidebar active state
        navItems.forEach((i) => i.classList.remove("active"));
        item.classList.add("active");

        // Content active state
        switchToSection(sectionKey);

        // Log switch
        logToKai(`Switched view to: ${sectionTitles[sectionKey] || "OmniAI"}`);
    });
});

// ---------------------
// Sidebar collapse
// ---------------------
if (sidebarToggle) {
    sidebarToggle.addEventListener("click", () => {
        document.body.classList.toggle("sidebar-collapsed");
        const collapsed = document.body.classList.contains("sidebar-collapsed");
        logToKai(collapsed ? "Collapsed navigation sidebar." : "Expanded navigation sidebar.");
    });
}

// ---------------------
// Kai log helpers
// ---------------------
function logToKai(message) {
    if (!kaiLog) return;
    const now = new Date();
    const timestamp = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const entry = document.createElement("div");
    entry.className = "kai-log-entry";
    entry.textContent = `[${timestamp}] ${message}`;

    kaiLog.prepend(entry);

    // Optional: cap log length to 50 entries
    const entries = kaiLog.querySelectorAll(".kai-log-entry");
    if (entries.length > 50) {
        entries[entries.length - 1].remove();
    }
}

if (clearLogBtn && kaiLog) {
    clearLogBtn.addEventListener("click", () => {
        kaiLog.innerHTML = "";
        const baseEntry = document.createElement("div");
        baseEntry.className = "kai-log-entry";
        baseEntry.textContent =
            "[--:--] Log cleared. OmniAI is ready. Use the command box or module buttons to begin.";
        kaiLog.appendChild(baseEntry);
    });
}

// ---------------------
// Module loader helper
// ---------------------
function loadModuleInFrame(path, description) {
    const frame = document.getElementById("module-frame");
    if (!frame) {
        logToKai("Tried to load module, but module frame is missing.");
        return;
    }
    frame.src = path;
    logToKai(`Loaded module: ${description}`);
}

// ---------------------
// Actions (placeholder hooks)
// ---------------------
document.addEventListener("click", (event) => {
    const btnAction = event.target.closest("[data-action]");
    if (btnAction) {
        const action = btnAction.getAttribute("data-action");
        handleAction(action);
    }

    const workspaceBtn = event.target.closest("[data-workspace-action]");
    if (workspaceBtn) {
        const li = workspaceBtn.closest("li");
        if (li) {
            showWorkspaceDetails(li);
        }
    }
});

function handleAction(action) {
    switch (action) {
        case "launch-jargon":
            switchToSection("modules");
            loadModuleInFrame("modules/jargon-linker/index.html", "Jargon Linker");
            break;
        case "launch-math":
            logToKai("Math / Tutor Engine launch requested.");
            break;
        case "launch-network":
            logToKai("Network / DNS Lab Assistant launch requested.");
            break;
        case "launch-footprint":
            logToKai("Digital Footprint Removal tools launch requested.");
            break;
        case "open-standards":
            logToKai("Opening Kai standards view.");
            switchToSection("settings");
            break;
        case "open-blueprint":
            logToKai("Opening OmniAI Blueprint / Sandbox overview.");
            break;
        default:
            logToKai(`Unknown action: ${action}`);
            break;
    }
}

// ---------------------
// Command box interpreter
// ---------------------
if (commandInput) {
    commandInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            const value = commandInput.value.trim();
            if (!value) return;

            interpretCommand(value);
            commandInput.value = "";
        }
    });
}

function interpretCommand(text) {
    const lower = text.toLowerCase();

    if (lower.includes("jargon")) {
        handleAction("launch-jargon");
    } else if (lower.includes("math")) {
        handleAction("launch-math");
        switchToSection("modules");
    } else if (lower.includes("network") || lower.includes("dns")) {
        handleAction("launch-network");
        switchToSection("modules");
    } else if (lower.includes("footprint") || lower.includes("broker")) {
        handleAction("launch-footprint");
        switchToSection("modules");
    } else if (lower.includes("standard") || lower.includes("kai core") || lower.includes("kai")) {
        switchToSection("settings");
        logToKai("Navigated to Kai Core / Settings via command.");
    } else {
        logToKai(`Command received (not yet mapped): "${text}"`);
    }
}

// Command suggestions / chips
if (commandSuggestions && commandInput) {
    commandSuggestions.addEventListener("click", (e) => {
        const chip = e.target.closest(".chip");
        if (!chip) return;
        const command = chip.getAttribute("data-command");
        if (!command) return;

        interpretCommand(command);
    });
}

// ---------------------
// Section switching helper
// ---------------------
function switchToSection(sectionKey) {
    // Update sidebar active state too (in case we navigated via command)
    navItems.forEach((i) => {
        const key = i.getAttribute("data-section");
        i.classList.toggle("active", key === sectionKey);
    });

    // Update content
    sections.forEach((sec) => sec.classList.remove("active"));
    const activeSection = document.getElementById(`section-${sectionKey}`);
    if (activeSection) {
        activeSection.classList.add("active");
        topbarTitle.textContent = sectionTitles[sectionKey] || "OmniAI";
    }
}

// ---------------------
// Module search filtering
// ---------------------
if (moduleSearch && modulesGrid) {
    const moduleCards = modulesGrid.querySelectorAll(".module-card");

    moduleSearch.addEventListener("input", () => {
        const query = moduleSearch.value.trim().toLowerCase();
        moduleCards.forEach((card) => {
            const name = (card.getAttribute("data-module-name") || "").toLowerCase();
            const keywords = (card.getAttribute("data-module-keywords") || "").toLowerCase();
            const haystack = `${name} ${keywords}`;
            const match = haystack.includes(query);
            card.style.display = match ? "" : "none";
        });
    });
}

// ---------------------
// Workspace details
// ---------------------
function showWorkspaceDetails(li) {
    if (!workspaceDetailsBody) return;

    const id = li.getAttribute("data-workspace-id") || "";
    const title = li.getAttribute("data-workspace-title") || "";
    const status = li.getAttribute("data-workspace-status") || "";
    const notes = li.getAttribute("data-workspace-notes") || "";

    if (workspaceDetailsPlaceholder) {
        workspaceDetailsPlaceholder.style.display = "none";
    }

    workspaceDetailsBody.innerHTML = `
        <p><strong>ID:</strong> ${id}</p>
        <p><strong>Title:</strong> ${title}</p>
        <p><strong>Status:</strong> ${status}</p>
        <p class="muted"><strong>Notes:</strong> ${notes}</p>
    `;

    logToKai(`Opened workspace: ${id} (${status})`);
}
