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
        const { data, error } = await insforge.database
          .from('whitelist')
          .select('email')
          .eq('email', user.email)
          .maybeSingle()

        if (error || !data) {
          console.log('❌ Email not in whitelist:', user.email)
          return false
        }

        // Crear o actualizar usuario (insert con fallback a update si ya existe)
        const { error: insertError } = await insforge.database
          .from('users')
          .insert([
            {
              email: user.email,
              name: user.name,
              avatar_url: user.image,
            },
          ])

        if (insertError) {
          const isDuplicate =
            (insertError as { code?: string }).code === '23505'

          if (isDuplicate) {
            // El usuario ya existe — actualizar sus datos
            const { error: updateError } = await insforge.database
              .from('users')
              .update({
                name: user.name,
                avatar_url: user.image,
                updated_at: new Date().toISOString(),
              })
              .eq('email', user.email)

            if (updateError) {
              console.error('Error updating user:', updateError)
              return false
            }
          } else {
            console.error('Error inserting user:', insertError)
            return false
          }
        }

        console.log('✅ User authorized:', user.email)
        return true
      } catch (error) {
        console.error('SignIn error:', error)
        return false
      }
    },
    async session({ session }) {
      if (session.user?.email) {
        const { data: user } = await insforge.database
          .from('users')
          .select('id')
          .eq('email', session.user.email)
          .maybeSingle()

        if (user) {
          session.user.id = user.id
        }
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
