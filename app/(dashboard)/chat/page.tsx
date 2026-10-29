import { redirect } from 'next/navigation'

/**
 * The chat lives in the AI palette (⌘K / header AI bar). Kept as a redirect
 * so existing links and bookmarks keep working.
 */
export default function ChatPage() {
  redirect('/dashboard')
}
