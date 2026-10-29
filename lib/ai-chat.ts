/**
 * Opens the AI chat from anywhere (header AI bar, ⌘K, "Mejor díctalo")
 * without prop drilling: the chat listens for this window event.
 */
export const OPEN_AI_CHAT_EVENT = 'gitpush:open-ai-chat'

export function openAiChat() {
  window.dispatchEvent(new Event(OPEN_AI_CHAT_EVENT))
}
