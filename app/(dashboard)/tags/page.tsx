import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { insforgeAdmin } from '@/lib/insforge-admin'
import { TagsPageContent } from '@/components/tags/TagsPageContent'
import { getTags } from '@/lib/actions/tags.actions'
import type { Tag } from '@/types/database.types'

export default async function TagsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    redirect('/login')
  }

  const { data: user, error: userError } = await insforgeAdmin.database
    .from('users')
    .select('id')
    .eq('email', session.user.email)
    .single()

  if (!user?.id || userError) {
    console.error('User not found or error:', userError)
    redirect('/login')
  }

  const tagsResult = await getTags(user.id)
  const tags: Tag[] = tagsResult.success ? (tagsResult.data ?? []) : []

  return <TagsPageContent userId={user.id} initialTags={tags} />
}
