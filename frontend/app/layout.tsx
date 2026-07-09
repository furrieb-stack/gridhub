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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  title: { default: "Gridhub", template: "%s | Gridhub" },
  description: "Gridhub — social network for developers. Share code, ideas, and build together.",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "Gridhub",
    description: "Social network for developers. Share code, ideas, and build together.",
    url: siteUrl,
    siteName: "Gridhub",
    locale: "en_US",
    type: "website",
    images: [{ url: `${siteUrl}/og-image.png`, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Gridhub",
    description: "Social network for developers. Share code, ideas, and build together.",
    images: [`${siteUrl}/og-image.png`],
  },
  robots: { index: true, follow: true },
  alternates: { canonical: siteUrl },
  other: {
    "og:image:width": "1200",
    "og:image:height": "630",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Gridhub",
    url: siteUrl,
    description: "Social network for developers. Share code, ideas, and build together.",
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${roboto.className} antialiased`} suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
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
