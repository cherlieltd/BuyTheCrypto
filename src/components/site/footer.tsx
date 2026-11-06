import Link from "next/link";

const groups = [
  {
    title: "Product",
    links: [
      ["Buy Crypto", "/buy-crypto"],
      ["Markets", "/markets"],
      ["Cryptocurrencies", "/cryptocurrencies"],
      ["How it works", "/how-it-works"],
    ],
  },
  {
    title: "Company",
    links: [
      ["About", "/about"],
      ["Contact", "/contact"],
      ["FAQ", "/faq"],
      ["Support", "/contact"],
    ],
  },
  {
    title: "Legal",
    links: [
      ["Terms", "/terms"],
      ["Privacy", "/privacy"],
      ["Risk disclosure", "/risk-disclosure"],
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border bg-card">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 font-display font-semibold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-xs font-bold text-accent-foreground">B</span>
            BuyTheCrypto
          </div>
          <p className="mt-4 text-sm leading-6 text-muted">
            A non-custodial cryptocurrency purchasing platform. Payments, identity checks, and crypto delivery are handled by Transak.
          </p>
        </div>
        {groups.map((group) => (
          <div key={group.title}>
            <p className="text-sm font-semibold text-foreground">{group.title}</p>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              {group.links.map(([label, href]) => (
                <li key={`${group.title}-${href}-${label}`}>
                  <Link href={href} className="hover:text-accent">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border px-4 py-6 text-center text-xs text-muted">
        Cryptocurrency prices are volatile. BuyTheCrypto does not hold customer funds, cryptocurrency, card details, or private keys.
      </div>
    </footer>
  );
}
