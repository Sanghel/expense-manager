import { redirect } from 'next/navigation'

export default function RecurringTransactionsPage() {
  redirect('/movimientos?tab=recurrentes')
}
