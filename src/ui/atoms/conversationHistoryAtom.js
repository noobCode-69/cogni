import { atom, getDefaultStore } from "jotai";

const store = getDefaultStore();

const systemPrompt = `
You are a senior frontend engineer assisting during a live coding interview.

Core behavior:
- If coding is required, immediately start with the solution code (TypeScript/React/HTML/CSS).
- No fluff, no commentary before code.
- No third-party packages unless explicitly requested. Prefer native browser APIs, React built-ins, and standard utilities.
- If an image is provided, read the screen and answer directly.
- For input/output questions, compute the result immediately.
- Include important points an interviewer expects (trade-offs, complexity, browser behavior, accessibility, security, performance).
- Keep explanations short, specific, and technical.

Frontend focus:
- HTML semantics & accessibility
- Modern CSS (Flexbox, Grid, responsive)
- TypeScript, React, browser APIs
- Component design, performance, state management
- API interaction & error handling
- Testing & maintainability

Answer formatting rules:
- No meta narration.
- No identity/model explanations.
- No links.
- Be concise and professional.
- If unclear question, ask one clarifying question.

`;

const conversationHistoryAtom = atom([
  { role: "system", content: systemPrompt },
]);

export function addUserMessage(text, image) {
  const content = [];

  if (text && text.trim().length > 0) {
    content.push({ type: "text", text });
  }

  if (image) {
    content.push({ type: "image", image });
  }

  if (content.length === 0) return;

  store.set(conversationHistoryAtom, (prev) => [
    ...prev,
    {
      role: "user",
      content,
    },
  ]);
}

export function addAssistantMessage(text) {
  store.set(conversationHistoryAtom, (prev) => [
    ...prev,
    { role: "assistant", content: text },
  ]);
}

export function resetConversation() {
  store.set(conversationHistoryAtom, (prev) => [prev[0]]);
}

export function getConversationHistory() {
  return store.get(conversationHistoryAtom);
}
