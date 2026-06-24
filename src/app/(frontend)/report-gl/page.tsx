import Link from 'next/link'

export const metadata = {
  title: 'Report GL | ROOC PvP Ranker',
}

export default function ReportGLPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#09090b',
        padding: '20px',
      }}
    >
      <div
        style={{
          textAlign: 'center',
          background: 'rgba(0,0,0,0.4)',
          padding: '60px 40px',
          borderRadius: '24px',
          border: '1px solid rgba(255,255,255,0.05)',
          maxWidth: '500px',
        }}
      >
        <div
          style={{
            fontSize: '64px',
            filter: 'drop-shadow(0 0 12px rgba(16,185,129,0.4))',
            marginBottom: '24px',
          }}
        >
          📊
        </div>
        <h1 style={{ color: '#fff', fontSize: '32px', marginBottom: '16px' }}>Report GL</h1>
        <p style={{ color: '#9ca3af', lineHeight: '1.6', marginBottom: '32px' }}>
          Fitur ini sedang dalam tahap pengembangan. Nantinya Anda dapat mengevaluasi performa Guild
          League berdasarkan gabungan 40% Stats dan 60% Performa di sini.
        </p>
        <Link
          href="/"
          style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#fff',
            padding: '12px 24px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 600,
            display: 'inline-block',
          }}
        >
          Kembali ke Dashboard
        </Link>
      </div>
    </main>
  )
}
