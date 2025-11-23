Click code tab to see a more clear structure. 

AI_assignment_CS39AF-main/
  index.html                 # Main OmniAI Console UI
  styles.css                 # Styling for the UI
  script.js                  # UI logic + backend integration + voice I/O

  backend/
    omniai_api.py            # Flask backend (LLM-style API)
    # (optional) venv/       # Python virtualenv if used

  core/
    omniai-python/
      app.py                 # Python core modules/standards demo
    omniai-java/
      Main.java              # Java core modules/standards demo
      KaiStylizer.java       # Consent-gated audio stylizer (Java)
      KaiVoiceInspired.java  # Advanced voice chain (Java)

  modules/
    jargon-linker/
      index.html             # Jargon Linker SPA (if included)

  docs/
    omniai_network_map_v2.png  # Network/architecture diagram
    README.md                  # This document

  archives/
    # placeholder for future ZIPs / PDFs created via "Transcend"
