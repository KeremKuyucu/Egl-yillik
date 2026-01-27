import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/sonner"
import { cn } from "@/lib/utils"
import { ThemeProvider } from "@/components/providers/theme-provider"
import FeedbackButton from "@/components/common/feedback-button"
import "./globals.css"
import AnnouncementBanner from "@/components/layout/announcement-banner"
import ErrorReporter from "@/components/common/error-reporter"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: {
    template: "%s | EGL Yıllık",
    default: "EGL Yıllık - 2026 Mezuniyeti",
  },
  description: "Ertuğrulgazi Lisesi Dijital Yıllık ve Anı Platformu",
  icons: {
    icon: "/image.png",
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background text-foreground font-sans antialiased",
          geistSans.variable,
          geistMono.variable
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/* Yapımcı GitHub:KeremKuyucu */}
          <AnnouncementBanner />
          <ErrorReporter />
          {children}
          <FeedbackButton />
          <Toaster />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}