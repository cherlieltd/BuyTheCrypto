export function Sparkline({ prices, width = 128, height = 40 }: { prices: number[]; width?: number; height?: number }) {
  if (prices.length < 2) return null;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const points = prices
    .map((price, index) => {
      const x = (index / (prices.length - 1)) * width;
      const y = height - ((price - min) / (max - min || 1)) * (height - 4) - 2;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
  const up = prices.at(-1)! >= prices[0]!;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} role="img" aria-label="Price trend">
      <polyline fill="none" stroke={up ? "#34d399" : "#fb7185"} strokeWidth="2" points={points} />
    </svg>
  );
}

export function PriceChart({ prices }: { prices: Array<[number, number]> }) {
  const values = prices.map((point) => point[1]);
  if (values.length < 2) {
    return <p className="text-sm text-muted">Chart data is not available for this range.</p>;
  }
  const width = 720;
  const height = 240;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const coords = values.map((price, index) => {
    const x = (index / (values.length - 1)) * width;
    const y = height - ((price - min) / (max - min || 1)) * (height - 16) - 8;
    return [x, y] as const;
  });
  const line = coords.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `0,${height} ${line} ${width},${height}`;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-60 w-full" role="img" aria-label="Historical price chart">
      <polygon points={area} fill="rgba(52,211,153,0.12)" />
      <polyline fill="none" stroke="#34d399" strokeWidth="3" points={line} />
    </svg>
  );
}
