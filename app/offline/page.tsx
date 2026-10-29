'use client'

export default function OfflinePage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--chakra-colors-bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        padding: '24px',
        textAlign: 'center',
        fontFamily: 'var(--font-geist-sans)',
      }}
    >
      <div style={{ fontSize: '64px' }}>📡</div>
      <h1 style={{ color: 'var(--chakra-colors-text)', fontSize: '24px', fontWeight: '700', margin: 0 }}>
        Sin conexión
      </h1>
      <p style={{ color: 'var(--chakra-colors-text2)', fontSize: '16px', maxWidth: '280px', margin: 0, lineHeight: '1.5' }}>
        GitPush Money necesita internet para cargar tus datos. Conéctate y vuelve a intentarlo.
      </p>
      <button
        onClick={() => window.location.reload()}
        style={{
          marginTop: '8px',
          padding: '12px 24px',
          background: 'var(--chakra-colors-brand-solid)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '15px',
          fontWeight: '600',
          cursor: 'pointer',
        }}
      >
        Reintentar
      </button>
    </div>
  )
}
