import { redirect } from 'next/navigation'

export default function BudgetsPage() {
  redirect('/planificacion?tab=presupuestos')
}
