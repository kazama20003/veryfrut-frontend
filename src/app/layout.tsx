import type { Metadata } from "next";
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
          {children}
        </main>
      </body>
    </html>
  );
}