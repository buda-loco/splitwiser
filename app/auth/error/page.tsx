export default function AuthErrorPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          textAlign: 'center',
        }}
      >
        <h1
          style={{
            fontSize: '28px',
            fontWeight: '600',
            marginBottom: '8px',
            color: '#991B1B',
          }}
        >
          Authentication Error
        </h1>
        <p
          style={{
            color: '#6B7280',
            marginBottom: '32px',
          }}
        >
          Something went wrong with the authentication process. Please try logging in again.
        </p>

        <a
          href="/auth/login"
          style={{
            display: 'inline-block',
            padding: '14px 32px',
            fontSize: '16px',
            fontWeight: '600',
            color: 'white',
            backgroundColor: '#3B82F6',
            borderRadius: '12px',
            textDecoration: 'none',
          }}
        >
          Return to Login
        </a>
      </div>
    </div>
  )
}
