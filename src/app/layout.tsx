import type { Metadata } from "next";
import { Afacad, Archivo, Geist_Mono } from "next/font/google";
import { RESTORE_SIDEBAR_SCRIPT } from "@/lib/sidebar";
import InlineScript from "@/components/inline-script";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const afacad = Afacad({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Headlines on the public site only — see --font-display in globals.css. The
// width axis comes along because the logo's capitals are wider than a default
// grotesque, and the hero is set to match them.
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
});

export const metadata: Metadata = {
  title: "Dry Cleaner Portal",
  description: "Booking, tracking, and receipts for the dry cleaning shop",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // The server cannot know the saved sidebar state, so it renders the
    // expanded default and the script below corrects it during parsing.
    // suppressHydrationWarning covers exactly that: it is shallow, so it
    // silences the data-sidebar mismatch on <html> without hiding anything
    // in the tree underneath.
    <html
      lang="en"
      data-sidebar="expanded"
      suppressHydrationWarning
      className={`${afacad.variable} ${archivo.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Inline rather than next/script: beforeInteractive queues into
            __next_s and runs after paint, too late to stop the sidebar opening
            wide and snapping shut. In the head it runs before any of the shell
            is parsed. */}
        <InlineScript html={RESTORE_SIDEBAR_SCRIPT} />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
