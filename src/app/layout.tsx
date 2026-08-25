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
    <html
      lang="en"
      className={`${afacad.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Raw and inline on purpose. next/script's beforeInteractive queues
            into __next_s and runs after paint, which is too late to stop the
            sidebar opening wide and snapping shut; this executes as the parser
            reaches it. Being in the root layout it is only ever hydrated, never
            mounted fresh on the client, so React does not re-create it. */}
        <script dangerouslySetInnerHTML={{ __html: RESTORE_SIDEBAR_SCRIPT }} />
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
