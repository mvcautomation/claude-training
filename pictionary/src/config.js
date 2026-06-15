// Realtime server host. In dev the Node ws server runs on 127.0.0.1:3100.
// In production set VITE_PARTYKIT_HOST to the deployed host (no protocol),
// e.g. pictionary.ai-app.space — partysocket upgrades to wss:// on https pages.
export const PARTYKIT_HOST = import.meta.env.VITE_PARTYKIT_HOST || "127.0.0.1:3100";

export const TEAM_NAMES = ["Sparks", "Bolts"];
export const TEAM_COLORS = ["#ff5a3c", "#1ca6b8"]; // coral, teal
