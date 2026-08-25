import type { Metadata } from "next";
import { Afacad, Geist_Mono } from "next/font/google";
import { RESTORE_SIDEBAR_SCRIPT } from "@/lib/sidebar";
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
      className={`${afacad.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Raw, inline, and in the head on purpose. next/script's
            beforeInteractive queues into __next_s and runs after paint, too
            late to stop the sidebar opening wide and snapping shut; this runs
            as the parser reaches it, before any of the shell is painted. */}
        <script dangerouslySetInnerHTML={{ __html: RESTORE_SIDEBAR_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
