import { redirect } from 'next/navigation'

/**
 * Reports folded into the dashboard: the charts now follow the same month
 * selector as the cards. Kept as a redirect so existing links and bookmarks
 * don't 404.
 */
export default function ReportsPage() {
  redirect('/dashboard')
}
