import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Suspense } from "react"
import LoadingSpinner from "@/components/global/LoadingSpinner"
import { Toaster } from "@/components/ui/sonner"
const inter = Inter({ subsets: ["latin"], display: "swap" })

export const metadata: Metadata = {
  title: "Veryfrut - Frutas y Verduras Orgánicas",
  description: "Distribuidor de frutas y verduras orgánicas de la mejor calidad",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <main>
          <Suspense fallback={<LoadingSpinner />}>{children}</Suspense>
        </main>
        <Toaster/>
      </body>
    </html>
  )
}
