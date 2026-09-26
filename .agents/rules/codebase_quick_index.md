---
name: codebase-quick-index
description: "Instant path lookup and architectural cross-references for the NASA HUNCH codebase."
trigger: "always_on"
---

# Codebase Quick Index

| Component | Path | Description |
| :--- | :--- | :--- |
| **Main Web UI** | `/Users/harshan/Hunch/index.html` | AEGIS-V1 Mission Control HUD & 3D Viewer |
| **Viewer & Physics Logic** | `/Users/harshan/Hunch/app.js` | Three.js scene, 1/6g mass calculator, route simulator |
| **Ollama Navigation Data** | `/Users/harshan/Hunch/payload.json` | `hunch-rover-nav` system prompt & sensor examples |
| **3D Simulator (Digital Twin)** | `/Users/harshan/Hunch/Hunch/nasa-llaso-cad/viewer.html` | High-fidelity 60 FPS WebGL rover simulator + ONNX |
| **Neural Pilot Trainer** | `/Users/harshan/Hunch/Hunch/nasa-llaso-cad/train_rover_imitation.py` | PyTorch `RoverPilotNet` CNN+MLP training script |
| **Trained Neural Models** | `/Users/harshan/Hunch/Hunch/nasa-llaso-cad/rover_pilot.onnx` | ONNX WebAssembly model run live in `viewer.html` |
| **Telemetry Logger Server** | `/Users/harshan/Hunch/Hunch/nasa-llaso-cad/serve.py` | Python HTTP server logging flight actions |
| **Logistics Optimizer** | `/Users/harshan/Hunch/Hunch/nasa-llaso-cad/optimize_manifest.py` | 14-day LIFO lunar packing & center-of-mass calculator |
| **AMR Rover React App** | `/Users/harshan/Hunch/Hunch/nasa-hunch-rover/` | Vite + React + Tailwind dashboard |
| **Hardware Spec Sheet** | `/Users/harshan/Hunch/Hunch/nasa-hunch-rover/cad_model/hardware_specification_sheet.md` | Motors, drivers, buck converter, LiFePO4 battery, PETG |
| **CoppeliaSim Simulation** | `/Users/harshan/Hunch/Hunch/coppeliabot/` | Multi-robot URDF, Lua controller, remote API |
| **NAS Server Specs** | `/Users/harshan/Library/CloudStorage/GoogleDrive-harshannh62212@gmail.com/My Drive/Hunch/nas_192.168.1.27_specs.md` | Ubuntu 26.04 server specs & active Docker containers |
