import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import ThemeProvider from "@/components/ThemeProvider";
import { ToastProvider } from "@/components/ToastProvider";
import PushManager from "@/components/PushManager";
import "./globals.css";

const roboto = Roboto({
  weight: ["400", "500", "700", "900"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gridhub",
  description: "Social network for developers",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${roboto.className} antialiased`} suppressHydrationWarning>
        <ThemeProvider>
          <ToastProvider>
            {children}
            <PushManager />
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
