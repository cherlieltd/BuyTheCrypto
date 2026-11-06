type BrandLogoProps = {
  className?: string;
  size?: number;
  title?: string;
};

export function BrandLogo({ className, size = 36, title = "BuyTheCrypto" }: BrandLogoProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/images/brand-mark.svg"
      alt=""
      width={size}
      height={size}
      className={className}
      title={title}
    />
  );
}
