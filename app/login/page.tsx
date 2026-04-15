'use client'

import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function LoginContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1E1B4B 0%, #3730A3 50%, #4F46E5 100%)' }}
      >
        {/* Decorative circles */}
        <div
          className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #818CF8 0%, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #F97316 0%, transparent 70%)' }}
        />
        <div
          className="absolute top-1/2 right-8 w-40 h-40 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #C7D2FE 0%, transparent 70%)' }}
        />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg"
              style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' }}
            >
              EM
            </div>
            <span className="text-white font-semibold text-lg tracking-tight">Expense Manager</span>
          </div>
        </div>

        {/* Tagline */}
        <div className="relative z-10">
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Tus finanzas,<br />
            bajo control.
          </h2>
          <p className="text-indigo-200 text-base leading-relaxed max-w-xs">
            Registra ingresos y gastos, analiza tendencias y toma decisiones financieras inteligentes.
          </p>

          {/* Feature list */}
          <div className="mt-8 space-y-3">
            {[
              'Seguimiento de transacciones en tiempo real',
              'Conversión entre COP, USD y Bs',
              'Categorías y presupuestos personalizados',
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(249, 115, 22, 0.8)' }}
                >
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-indigo-100 text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom note */}
        <p className="relative z-10 text-indigo-300 text-xs">
          Gestión financiera personal · Acceso privado
        </p>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
              style={{ background: 'linear-gradient(135deg, #4F46E5, #818CF8)' }}
            >
              EM
            </div>
            <span className="font-semibold text-gray-900">Expense Manager</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Bienvenido</h1>
            <p className="text-gray-500 text-sm">Inicia sesión para continuar</p>
          </div>

          {error && (
            <div className="mb-6 px-4 py-3 rounded-xl text-sm flex items-start gap-3"
              style={{ background: '#FFF1F2', border: '1px solid #FECDD3', color: '#E11D48' }}>
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error === 'AccessDenied'
                ? 'Tu email no tiene acceso. Contacta al administrador.'
                : 'Ocurrió un error al iniciar sesión. Intenta nuevamente.'}
            </div>
          )}

          <button
            onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
            className="w-full flex items-center justify-center gap-3 px-5 py-3 rounded-xl font-medium text-gray-700 transition-all duration-150"
            style={{
              background: '#fff',
              border: '1.5px solid #E5E7EB',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#C7D2FE'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(79,70,229,0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#E5E7EB'
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'
            }}
          >
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continuar con Google
          </button>

          <div className="mt-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400">acceso restringido</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          <p className="mt-4 text-center text-xs text-gray-400">
            Solo usuarios autorizados pueden acceder a esta aplicación.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}
