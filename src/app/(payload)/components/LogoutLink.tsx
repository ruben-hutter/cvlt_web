'use client'

export function LogoutLink() {
  return (
    <a
      href="/admin/logout"
      style={{
        display: 'block',
        padding: '0 16px',
        marginTop: '8px',
        fontSize: '13px',
        color: 'var(--theme-elevation-500)',
        textDecoration: 'none',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = 'var(--theme-elevation-800)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = 'var(--theme-elevation-500)'
      }}
    >
      Esci
    </a>
  )
}
