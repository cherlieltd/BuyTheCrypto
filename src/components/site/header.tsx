"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { BrandLogo } from "@/components/site/brand-logo";
import { Button } from "@/components/ui/button";
import { useUiStore } from "@/lib/ui-store";

const links = [
  { href: "/buy-crypto", label: "Buy Crypto" },
  { href: "/markets", label: "Markets" },
  { href: "/cryptocurrencies", label: "Cryptocurrencies" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/faq", label: "FAQ" },
];

export function SiteHeader({ signedIn }: { signedIn: boolean }) {
  const open = useUiStore((state) => state.navOpen);
  const setOpen = useUiStore((state) => state.setNavOpen);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur-xl">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-foreground">
        Skip to content
      </a>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2.5 font-display text-base font-semibold tracking-tight text-foreground">
          <BrandLogo size={36} className="h-9 w-9 rounded-xl shadow-sm shadow-blue-500/20" />
          BuyTheCrypto
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted lg:flex" aria-label="Primary">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          {signedIn ? (
            <Button asChild variant="outline">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <Button asChild variant="ghost">
              <Link href="/login">Log in</Link>
            </Button>
          )}
          <Button asChild>
            <Link href="/buy-crypto">Buy Crypto</Link>
          </Button>
        </div>
        <button className="rounded-xl p-2 text-foreground lg:hidden" aria-expanded={open} aria-label="Open menu" onClick={() => setOpen(!open)}>
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open ? (
        <nav className="space-y-1 border-t border-border px-4 py-4 lg:hidden" aria-label="Mobile">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="block rounded-xl px-3 py-3 hover:bg-surface" onClick={() => setOpen(false)}>
              {link.label}
            </Link>
          ))}
          <Link href={signedIn ? "/dashboard" : "/login"} className="block rounded-xl px-3 py-3 hover:bg-surface" onClick={() => setOpen(false)}>
            {signedIn ? "Dashboard" : "Log in"}
          </Link>
          <Link href="/buy-crypto" className="block rounded-xl bg-accent px-3 py-3 text-center font-semibold text-accent-foreground" onClick={() => setOpen(false)}>
            Buy Crypto
          </Link>
        </nav>
      ) : null}
    </header>
  );
}
