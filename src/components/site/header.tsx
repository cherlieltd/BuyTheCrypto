"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
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
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#07111f]/80 backdrop-blur-xl">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-accent focus:px-4 focus:py-2">
        Skip to content
      </a>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-accent text-sm text-accent-foreground">B</span>
          BuyTheCrypto
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted md:flex" aria-label="Primary">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
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
        <button className="rounded-full p-2 md:hidden" aria-expanded={open} aria-label="Open menu" onClick={() => setOpen(!open)}>
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open ? (
        <nav className="space-y-2 border-t border-white/10 px-4 py-4 md:hidden" aria-label="Mobile">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="block rounded-2xl px-3 py-3 hover:bg-white/5" onClick={() => setOpen(false)}>
              {link.label}
            </Link>
          ))}
          <Link href={signedIn ? "/dashboard" : "/login"} className="block rounded-2xl px-3 py-3 hover:bg-white/5" onClick={() => setOpen(false)}>
            {signedIn ? "Dashboard" : "Log in"}
          </Link>
        </nav>
      ) : null}
    </header>
  );
}
