import React, { useEffect, useState } from 'react';

interface PriceData {
  symbol: string;
  price: string;
  change: string;
}

const PriceTicker: React.FC = () => {
  const [prices, setPrices] = useState<PriceData[]>([]);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const response = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbols=["BTCUSDT","ETHUSDT"]');
        const data = await response.json();
        const formatted = data.map((item: any) => ({
          symbol: item.symbol.replace('USDT', ''),
          price: parseFloat(item.lastPrice).toLocaleString(undefined, { minimumFractionDigits: 2 }),
          change: parseFloat(item.priceChangePercent).toFixed(2)
        }));
        setPrices(formatted);
      } catch (err) {
        console.error('Failed to fetch prices', err);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center space-x-6 overflow-hidden">
      {prices.map((p) => (
        <div key={p.symbol} className="flex items-center space-x-2 whitespace-nowrap">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{p.symbol}</span>
          <span className="text-sm font-mono font-bold text-white">${p.price}</span>
          <span className={`text-[10px] font-bold ${parseFloat(p.change) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {parseFloat(p.change) >= 0 ? '+' : ''}{p.change}%
          </span>
        </div>
      ))}
    </div>
  );
};

export default PriceTicker;
