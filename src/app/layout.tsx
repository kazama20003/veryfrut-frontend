import type { Metadata } from "next";
import { QueryClientProvider } from "@/lib/api/providers";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
export const metadata: Metadata = {
  title: "Veryfrut",
  description: "Real human insights platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <main>
          <QueryClientProvider>
            {children}
            <Toaster />
          </QueryClientProvider>
        </main>
      </body>
    </html>
  );
}
