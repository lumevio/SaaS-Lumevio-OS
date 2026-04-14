import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "LUMEVIO GO",
  description: "Publiczne kampanie LUMEVIO",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl">
      <body>{children}</body>
    </html>
  );
}