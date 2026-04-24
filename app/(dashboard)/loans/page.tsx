import { redirect } from 'next/navigation'

export default function LoansPage() {
  redirect('/movimientos?tab=prestamos')
}
