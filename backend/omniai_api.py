"""
OmniAI Demo Text Backend (Flask)

This is a small, local-only API that lets the OmniAI UI send a text
command and get a text reply back, similar to a very tiny LLM.

It does NOT call any real LLM. Instead, it uses simple rule-based
responses based on the message content. The goal is to show how the
front-end (OmniAI UI) could talk to a backend.

Run locally with:

    pip install flask
    python omniai_api.py

Then, in script.js, the frontend can call:
    POST http://localhost:8000/api/chat  with JSON: {"message": "..."}
"""

from flask import Flask, request, jsonify
from datetime import datetime

app = Flask(__name__)


@app.after_request
def add_cors_headers(response):
    """Allow the browser UI (served from file:// or GitHub Pages) to call this API."""
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    response.headers["Access-Control-Allow-Methods"] = "POST, OPTIONS"
    return response


@app.route("/api/ping", methods=["GET"])
def ping():
    """Simple health check endpoint."""
    return jsonify(
        {
            "status": "ok",
            "service": "OmniAI demo backend",
            "version": "0.1.0",
            "timestamp": datetime.utcnow().isoformat() + "Z",
        }
    )


@app.route("/api/chat", methods=["POST"])
def chat():
    """
    Main "LLM-style" endpoint.

    Expected JSON body:
        {
            "message": "...",
            "source": "omni-ui"   # optional
        }
    """
    data = request.get_json(force=True, silent=True) or {}
    message = (data.get("message") or "").strip()
    source = data.get("source") or "unknown"

    if not message:
        reply = "Kai demo backend: I didn't receive any message text."
    else:
        reply = generate_reply(message)

    return jsonify(
        {
            "reply": reply,
            "meta": {
                "backend": "omni-demo",
                "version": "0.1.0",
                "source": source,
                "received_at": datetime.utcnow().isoformat() + "Z",
            },
        }
    )


def generate_reply(message: str) -> str:
    """
    Very small rule-based engine to *simulate* an LLM-like reply.

    This is intentionally simple and local-only. You can replace this later
    with real LLM calls if you want.
    """
    lower = message.lower()

    # Jargon Linker
    if "jargon" in lower or "definition" in lower:
        return (
            "Demo backend: For Jargon Linker, add or search terms directly in the "
            "Jargon Linker module inside OmniAI. This backend would eventually let "
            "you ask things like 'explain term X using my stored definitions'."
        )

    # Math / tutor style
    math_words = ["solve", "equation", "graph", "derivative", "integral", "limit"]
    if any(word in lower for word in math_words):
        return (
            "Demo backend (math mode): I don't compute exact answers here, but this "
            "endpoint represents where a real LLM or math engine would respond. "
            "Describe your problem in the OmniAI UI and this backend would send it "
            "to the actual solver."
        )

    # Network / DNS
    if "dns" in lower or "resolver" in lower or "wireshark" in lower or "seedlab" in lower:
        return (
            "Demo backend (network mode): think of me as the place where DNS lab "
            "explanations and Wireshark hints would come from. Right now I'm just "
            "a stub, but a real deployment could query a stronger assistant here."
        )

    # Digital footprint
    if "spokeo" in lower or "mylife" in lower or "footprint" in lower or "broker" in lower:
        return (
            "Demo backend (digital footprint): this is where you'd track progress "
            "removing your name from broker sites (Spokeo, MyLife, etc.) and ask "
            "for next-step suggestions."
        )

    # Kai / standards / commands
    if "standard" in lower or "hit me" in lower or "transcend" in lower or "functional textbuild" in lower:
        return (
            "Demo backend (Kai standards): current standards include 'hit me' for "
            "full code bundles, 'Transcend' for packaging, the Functional TextBuild "
            "Standard, and your PDF / copyright formatting rules."
        )

    # OmniAI / general help
    if "omniai" in lower or "kai" in lower:
        return (
            "Demo backend: OmniAI is your personal console around Kai. The UI lets "
            "you navigate modules like Jargon Linker, Math / Tutor Engine, DNS labs, "
            "and Digital Footprint tools, while this backend shows how a future LLM "
            "or service layer could respond to commands."
        )

    # Default: echo-style explanation
    return (
        "Demo backend: I received your message:\n\n"
        f'    "{message}"\n\n'
        "In a full system this would be passed to a real LLM, but here it's just "
        "a local Python Flask stub to support your OmniAI assignment."
    )


if __name__ == "__main__":
    # For local testing only (not for GitHub Pages)
    app.run(host="0.0.0.0", port=8000, debug=True)
