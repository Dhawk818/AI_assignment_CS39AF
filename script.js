// ---------------------
// Config
// ---------------------
const BACKEND_URL = "http://127.0.0.1:8000/api/chat"; // change to your Pi IP later if needed

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

// Omni Chat elements
const omniChatForm = document.getElementById("omni-chat-form");
const omniChatInput = document.getElementById("omni-chat-input");
const omniChatResponse = document.getElementById("omni-chat-response");
const omniVoiceBtn = document.getElementById("omni-voice-btn");
const omniSpeakBtn = document.getElementById("omni-speak-btn");
const omniStatus = document.getElementById("omni-chat-status");
const omniTtsVoiceSelect = document.getElementById("omni-tts-voice");
let omniVoices = [];

const sectionTitles = {
    dashboard: "Dashboard",
    omni: "OmniAI Chat",
    modules: "Modules",
    workspaces: "Workspaces",
    archives: "Archives / Transcend",
    settings: "Kai Core / Settings"
};

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
            "[--:--] Log cleared. OmniAI is ready. Use the command box, Omni Chat tab, or module buttons to begin.";
        kaiLog.appendChild(baseEntry);
    });
}

// ---------------------
// Backend integration (Flask demo API)
// ---------------------
async function sendToBackend(message, source) {
    try {
        const response = await fetch(BACKEND_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message,
                source: source || "omni-ui"
            })
        });

        if (!response.ok) {
            logToKai(`Backend error (${response.status}).`);
            return;
        }

        const data = await response.json();
        const reply = data.reply || "(backend returned no reply)";
        logToKai(`OmniAI backend: ${reply}`);
    } catch (err) {
        logToKai("Backend not reachable. Is the Flask server running on port 8000?");
    }
}

// ---------------------
// OmniAI Chat panel → backend
// ---------------------
async function sendOmniChat(message) {
    if (!message) {
        if (omniStatus) omniStatus.textContent = "Type or speak a message first.";
        return;
    }

    if (omniStatus) omniStatus.textContent = "Sending to backend...";
    try {
        const response = await fetch(BACKEND_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message,
                source: "omni-chat"
            })
        });

        if (!response.ok) {
            if (omniStatus) omniStatus.textContent = `Backend error (${response.status}).`;
            logToKai(`Omni chat backend error (${response.status}).`);
            return;
        }

        const data = await response.json();
        const reply = data.reply || "(backend returned no reply)";

        if (omniChatResponse) {
            omniChatResponse.innerHTML = "";
            const p = document.createElement("p");
            p.textContent = reply;
            omniChatResponse.appendChild(p);
        }

        if (omniStatus) omniStatus.textContent = "Reply received.";
        logToKai("Omni chat backend replied.");
    } catch (err) {
        if (omniStatus) omniStatus.textContent = "Backend not reachable.";
        logToKai("Omni chat: backend not reachable (check Flask on port 8000).");
    }
}

// Omni Chat form submit
if (omniChatForm && omniChatInput) {
    omniChatForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const message = omniChatInput.value.trim();
        sendOmniChat(message);
    });
}

// ---------------------
// Sidebar navigation
// ---------------------
navItems.forEach((item) => {
    item.addEventListener("click", () => {
        const sectionKey = item.getAttribute("data-section");

        navItems.forEach((i) => i.classList.remove("active"));
        item.classList.add("active");

        switchToSection(sectionKey);
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
            logToKai("Math / Tutor Engine launch requested (frontend).");
            break;
        case "launch-network":
            logToKai("Network / DNS Lab Assistant launch requested (frontend).");
            break;
        case "launch-footprint":
            logToKai("Digital Footprint Removal tools launch requested (frontend).");
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
    } else if (lower.includes("omni chat") || lower.includes("chat")) {
        switchToSection("omni");
        logToKai("Switched to Omni Chat.");
    } else {
        // Anything else: send to backend "LLM" stub
        logToKai(`Command sent to backend: "${text}"`);
        sendToBackend(text, "command-box");
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
    navItems.forEach((i) => {
        const key = i.getAttribute("data-section");
        i.classList.toggle("active", key === sectionKey);
    });

    sections.forEach((sec) => sec.classList.remove("active"));
    const activeSection = document.getElementById(`section-${sectionKey}`);
    if (activeSection) {
        activeSection.classList.add("active");
    }

    if (topbarTitle) {
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

// ---------------------
// Voice input (Web Speech API)
// ---------------------
let recognition = null;
let recognizing = false;

if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => {
        recognizing = true;
        if (omniStatus) omniStatus.textContent = "Listening...";
    };

    recognition.onend = () => {
        recognizing = false;
        if (omniStatus) omniStatus.textContent = "Ready.";
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (omniChatInput) {
            omniChatInput.value = transcript;
        }
        sendOmniChat(transcript);
    };

    recognition.onerror = () => {
        recognizing = false;
        if (omniStatus) omniStatus.textContent = "Voice error. Try again.";
    };
} else {
    if (omniStatus) {
        omniStatus.textContent = "Voice input not supported in this browser.";
    }
}

// Voice button click
if (omniVoiceBtn) {
    omniVoiceBtn.addEventListener("click", () => {
        if (!recognition) {
            if (omniStatus) omniStatus.textContent = "Voice input not supported.";
            return;
        }
        if (!recognizing) {
            recognition.start();
        } else {
            recognition.stop();
        }
    });
}

// ---------------------
// TTS voice selection (playback)
// ---------------------
function populateTtsVoices() {
    if (!("speechSynthesis" in window) || !omniTtsVoiceSelect) return;

    omniVoices = window.speechSynthesis.getVoices();
    omniTtsVoiceSelect.innerHTML = "";

    const defaultOpt = document.createElement("option");
    defaultOpt.value = "";
    defaultOpt.textContent = "System default";
    omniTtsVoiceSelect.appendChild(defaultOpt);

    omniVoices.forEach((voice, index) => {
        const opt = document.createElement("option");
        opt.value = String(index);
        opt.textContent = `${voice.name} (${voice.lang})`;
        omniTtsVoiceSelect.appendChild(opt);
    });

    const preferred = omniVoices.findIndex(v =>
        v.lang.toLowerCase().startsWith("en") &&
        /female|woman|samantha|aria|zoe|jenny/i.test(v.name)
    );
    if (preferred >= 0) {
        omniTtsVoiceSelect.value = String(preferred);
    }
}

if ("speechSynthesis" in window) {
    populateTtsVoices();
    window.speechSynthesis.onvoiceschanged = populateTtsVoices;
}

// ---------------------
// Speak response (Speech Synthesis)
// ---------------------
if (omniSpeakBtn && omniChatResponse) {
    omniSpeakBtn.addEventListener("click", () => {
        if (!("speechSynthesis" in window)) {
            if (omniStatus) omniStatus.textContent = "Speech synthesis not supported.";
            return;
        }

        const text = omniChatResponse.textContent.trim();
        if (!text) {
            if (omniStatus) omniStatus.textContent = "No response to speak yet.";
            return;
        }

        window.speechSynthesis.cancel();

        const utter = new SpeechSynthesisUtterance(text);

        if (omniTtsVoiceSelect && omniVoices.length > 0) {
            const idx = parseInt(omniTtsVoiceSelect.value, 10);
            if (!isNaN(idx) && omniVoices[idx]) {
                utter.voice = omniVoices[idx];
            }
        }

        // Slightly slower, slightly higher pitch for a calmer, warmer feel
        utter.rate = 0.95;
        utter.pitch = 1.1;

        utter.onstart = () => {
            if (omniStatus) omniStatus.textContent = "Speaking response...";
        };
        utter.onend = () => {
            if (omniStatus) omniStatus.textContent = "Ready.";
        };

        window.speechSynthesis.speak(utter);
    });
}
