import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { insforge } from './insforge'

if (!process.env.GOOGLE_CLIENT_ID) {
  throw new Error('Missing GOOGLE_CLIENT_ID')
}
if (!process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error('Missing GOOGLE_CLIENT_SECRET')
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) {
        console.log('❌ SignIn rejected: No email')
        return false
      }

      console.log('👤 User attempting sign in:', user.email)

      try {
        // Verificar whitelist
        const { data, error } = await insforge
          .from('whitelist')
          .select('email')
          .eq('email', user.email)
          .single()

        if (error || !data) {
          console.log('❌ Email not in whitelist:', user.email)
          return false
        }

        // Crear o actualizar usuario en tabla users
        const { error: upsertError } = await insforge.from('users').upsert(
          {
            email: user.email,
            name: user.name,
            avatar_url: user.image,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'email' }
        )

        if (upsertError) {
          console.error('Error upserting user:', upsertError)
          return false
        }

        console.log('✅ User authorized:', user.email)
        return true
      } catch (error) {
        console.error('SignIn error:', error)
        return false
      }
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
}
