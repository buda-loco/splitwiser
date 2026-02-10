export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-5 pt-safe-top pb-safe-bottom bg-white dark:bg-black">
      <div className="w-full max-w-[400px] text-center">
        <h1 className="text-[28px] font-semibold mb-2 text-red-800 dark:text-red-400">
          Authentication Error
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          Something went wrong with the authentication process. Please try logging in again.
        </p>

        <a
          href="/auth/login"
          className="inline-block px-8 py-3.5 text-base font-semibold text-white bg-ios-blue rounded-xl no-underline"
        >
          Return to Login
        </a>
      </div>
    </div>
  )
}
