import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/sonner"
import { cn } from "@/lib/utils"
import "./globals.css"

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
  themeColor: "#ffffff",
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
          "min-h-screen bg-slate-50/50 font-sans antialiased", // Varsayılan arka plan rengi
          geistSans.variable,
          geistMono.variable
        )}
      >
        {children}
        <Toaster /> {/* Bildirimlerin görünmesi için gerekli */}
        <Analytics />
      </body>
    </html>
  )
}