'use client'

import { useSession, signOut } from 'next-auth/react'

export default function Home() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <main className="min-h-screen p-8">
        <p>Cargando...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold">Expense Manager</h1>
            <p className="mt-2 text-gray-600">
              Sistema de gestión de finanzas personales
            </p>
          </div>
          {session && (
            <button
              onClick={() => signOut()}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Cerrar Sesión
            </button>
          )}
        </div>

        {session?.user && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Sesión Iniciada</h2>
            <div className="space-y-2">
              <p>
                <strong>Nombre:</strong> {session.user.name}
              </p>
              <p>
                <strong>Email:</strong> {session.user.email}
              </p>
              {session.user.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={session.user.image}
                  alt="Avatar"
                  className="w-16 h-16 rounded-full mt-4"
                />
              )}
            </div>
            <p className="mt-4 text-sm text-gray-500">
              ✅ Autenticación funcional con NextAuth + Google OAuth
            </p>
          </div>
        )}

        <div className="mt-8 bg-blue-50 p-6 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">FASE 02 Completada</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✅ InsForge configurado</li>
            <li>✅ NextAuth implementado</li>
            <li>✅ Google OAuth funcionando</li>
            <li>✅ Middleware de autenticación activo</li>
            <li>⏳ Whitelist pendiente (FASE 03)</li>
          </ul>
        </div>
      </div>
    </main>
  )
}
