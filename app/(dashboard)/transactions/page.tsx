import { redirect } from 'next/navigation'

export default function TransactionsPage() {
  redirect('/movimientos?tab=transacciones')
}
