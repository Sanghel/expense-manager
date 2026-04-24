import { redirect } from 'next/navigation'

export default function CategoriesPage() {
  redirect('/settings?tab=categorias')
}
