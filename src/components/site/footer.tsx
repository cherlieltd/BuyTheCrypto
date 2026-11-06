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
      ["Support", "/dashboard/support"],
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
    <footer className="mt-20 border-t border-white/10">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-4">
        <div>
          <p className="font-semibold">BuyTheCrypto</p>
          <p className="mt-3 text-sm leading-6 text-muted">
            A non-custodial cryptocurrency purchasing platform. Payments, identity checks, and crypto delivery are handled by Transak.
          </p>
        </div>
        {groups.map((group) => (
          <div key={group.title}>
            <p className="text-sm font-semibold">{group.title}</p>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              {group.links.map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="hover:text-foreground">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10 px-4 py-6 text-center text-xs text-muted">
        Cryptocurrency prices are volatile. BuyTheCrypto does not hold customer funds, cryptocurrency, card details, or private keys.
      </div>
    </footer>
  );
}
