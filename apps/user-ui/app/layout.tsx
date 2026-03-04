import type { Metadata } from "next";
import { Geist, Geist_Mono, Poppins } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/providers/query-provider";
import { Toaster } from "@/components/ui/sonner";
import Header from "@/components/shared/Header/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Shopify",
  description: "A Shopify app built with Next.js and React Query",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${poppins.variable} antialiased`}
      >
        <QueryProvider>
          <Header />
          
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: "#0f1523",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#f8fafc",
            
          },
            }}
          />
        </QueryProvider>
      </body>
    </html>
  );
}
