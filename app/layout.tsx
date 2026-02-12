import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { BottomNav } from "@/components/BottomNav";
import { SwipeNavigation } from "@/components/SwipeNavigation";
import { AuthProvider } from "@/lib/contexts/AuthContext";
import { RateLimitToastContainer } from "@/components/RateLimitToast";
import { ScheduledDeletionBanner } from "@/components/ScheduledDeletionBanner";
import { PolicyAcceptanceCheck } from "@/components/PolicyAcceptanceCheck";
import "./globals.css";

export const metadata: Metadata = {
  title: "Splitwiser",
  description: "Beautiful expense splitting for iOS",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Splitwiser",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // iOS native feel
  viewportFit: "cover", // Safe area support
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased pb-16"> {/* pb-16 for bottom nav height, nav handles safe area */}
        <AuthProvider>
          {/* Scheduled deletion warning banner */}
          <ScheduledDeletionBanner />

          {/* Policy acceptance check for existing users */}
          <PolicyAcceptanceCheck />

          {/* Content area with bottom padding for fixed nav */}
          <SwipeNavigation>
            <div className="min-h-screen">
              {children}
            </div>
          </SwipeNavigation>

          {/* Bottom navigation */}
          <BottomNav />

          {/* Rate limit toast notifications */}
          <RateLimitToastContainer />
        </AuthProvider>

        {/* Service worker registration */}
        <Script id="register-sw" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js').then(
                  (registration) => {
                    console.log('SW registered:', registration);
                  },
                  (error) => {
                    console.log('SW registration failed:', error);
                  }
                );
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}
