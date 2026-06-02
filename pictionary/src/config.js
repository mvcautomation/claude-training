// PartyKit host. In dev `partykit dev` serves on 127.0.0.1:1999.
// In production set VITE_PARTYKIT_HOST to your deployed host,
// e.g. robopictionary.<your-username>.partykit.dev
export const PARTYKIT_HOST = import.meta.env.VITE_PARTYKIT_HOST || "127.0.0.1:1999";

export const TEAM_NAMES = ["Sparks", "Bolts"];
export const TEAM_COLORS = ["#ff5a3c", "#1ca6b8"]; // coral, teal
