import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DM_Sans, Sora } from "next/font/google";
import { Providers } from "@/components/providers";
import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";
import { getAuthUser } from "@/lib/auth";
import "./globals.css";

export const dynamic = "force-dynamic";

const dmSans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"] });
const sora = Sora({ variable: "--font-sora", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://buythecrypto.com"),
  title: {
    default: "BuyTheCrypto | Buy crypto simply and securely",
    template: "%s | BuyTheCrypto",
  },
  description: "Explore cryptocurrency markets and purchase supported digital assets through our integrated crypto payment partner.",
  openGraph: {
    title: "BuyTheCrypto",
    description: "Explore cryptocurrency markets and purchase supported digital assets through Transak.",
    url: "https://buythecrypto.com",
    siteName: "BuyTheCrypto",
    type: "website",
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-icon", type: "image/png" }],
  },
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const user = await getAuthUser();
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${dmSans.variable} ${sora.variable} h-full antialiased`}>
      <body className="min-h-full">
        <Providers>
          <SiteHeader signedIn={Boolean(user)} />
          <div id="main">{children}</div>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
