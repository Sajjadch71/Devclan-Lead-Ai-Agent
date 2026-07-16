import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DevClan | AI Calling",
  description: "AI voice agent calling dashboard for DevClan",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-base-950 bg-grid-glow bg-fixed min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
