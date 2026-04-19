'use client'

import { signIn } from 'next-auth/react'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import logo from '@/public/brand/gh_push_money_logo.png'
import { HStack, Text } from '@chakra-ui/react'

function LoginContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f0f13',
        fontFamily:
          "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        padding: '24px',
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap');

        .login-card {
          background: #18181d;
          border: 1px solid #2d2d35;
          border-radius: 24px;
          padding: 48px 44px 44px;
          width: 100%;
          max-width: 440px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        }

        .login-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 36px;
        }

        .login-logo-mark {
          width: 140px;
          height: auto;
          flex-shrink: 0;
        }

        .login-logo-name {
          font-size: 15px;
          font-weight: 600;
          color: #e5e7eb;
          letter-spacing: -0.2px;
        }

        .login-heading {
          font-size: 30px;
          font-weight: 700;
          color: #f9fafb;
          letter-spacing: -0.8px;
          line-height: 1.2;
          margin: 0 0 10px 0;
        }

        .login-subheading {
          font-size: 15px;
          color: #9ca3af;
          font-weight: 400;
          line-height: 1.5;
          margin: 0 0 32px 0;
        }

        .login-error {
          background: rgba(225, 29, 72, 0.1);
          border: 1px solid rgba(225, 29, 72, 0.3);
          color: #fb7185;
          border-radius: 12px;
          padding: 12px 14px;
          font-size: 13.5px;
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-bottom: 24px;
          line-height: 1.4;
        }

        .login-google-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 13px 20px;
          border-radius: 14px;
          border: 1.5px solid #2d2d35;
          background: #1e1e24;
          color: #e5e7eb;
          font-size: 15px;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.15s ease;
          letter-spacing: -0.1px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        }

        .login-google-btn:hover {
          border-color: #4F46E5;
          background: #23232d;
          box-shadow: 0 4px 16px rgba(79,70,229,0.2);
          transform: translateY(-1px);
        }

        .login-google-btn:active {
          transform: translateY(0);
          box-shadow: 0 1px 4px rgba(79,70,229,0.1);
        }

        .login-footer {
          margin-top: 28px;
          text-align: center;
          font-size: 12.5px;
          color: #6b7280;
          line-height: 1.5;
        }

        @media (max-width: 480px) {
          .login-card {
            padding: 36px 24px 28px;
            border-radius: 20px;
          }
          .login-heading {
            font-size: 26px;
          }
        }
      `}</style>

      <div className="login-card">
        <div
          className="login-logo"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Image src={logo} alt="GitPush Money" width={50} height={50} />
          <HStack gap={2} align="center" justify="center">
            <Text fontSize="24px" fontWeight="bold" color="brand.300">
              GitPush
            </Text>
            <Text fontSize="24px" fontWeight="bold" color="brand.200">
              Money
            </Text>
          </HStack>
        </div>

        <h1 className="login-heading text-center">Bienvenido de vuelta</h1>
        <p className="login-subheading text-center">
          Inicia sesión para acceder a tu panel financiero.
        </p>

        {error && (
          <div className="login-error">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ flexShrink: 0, marginTop: 1 }}
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error === 'AccessDenied'
              ? 'Tu email no tiene acceso. Contacta al administrador.'
              : 'Ocurrió un error al iniciar sesión. Intenta nuevamente.'}
          </div>
        )}

        <button
          className="login-google-btn"
          onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            style={{ flexShrink: 0 }}
          >
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continuar con Google
        </button>

        <p className="login-footer">
          Solo usuarios autorizados pueden acceder a esta aplicación.
        </p>
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
