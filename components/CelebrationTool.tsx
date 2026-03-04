import React, { useEffect, useState } from 'react';
import SparklesIcon from './icons/SparklesIcon';
import { type Language, type Tone } from '../types';

interface CelebrationToolProps {
  onGenerate: (asset: string, price: string) => void;
  isLoading: boolean;
}

const CelebrationTool: React.FC<CelebrationToolProps> = ({ onGenerate, isLoading }) => {
  const [prices, setPrices] = useState<{ symbol: string; price: string }[]>([]);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const response = await fetch('https://api.binance.com/api/v3/ticker/price?symbols=["BTCUSDT","ETHUSDT"]');
        const data = await response.json();
        setPrices(data.map((item: any) => ({
          symbol: item.symbol.replace('USDT', ''),
          price: parseFloat(item.price).toFixed(2)
        })));
      } catch (err) {
        console.error('Failed to fetch prices', err);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gradient-to-br from-emerald-900/40 to-blue-900/40 p-6 rounded-2xl border border-emerald-500/30 shadow-xl">
      <div className="flex items-center space-x-2 mb-4">
        <div className="bg-emerald-500 p-1.5 rounded-lg">
          <SparklesIcon className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-lg font-bold text-white">突破祝賀工具</h2>
      </div>
      
      <p className="text-sm text-gray-300 mb-6">
        當 BTC 或 ETH 突破關鍵價位時，點擊下方按鈕快速產生慶祝推文，提醒用戶資產安全的重要性。
      </p>

      <div className="grid grid-cols-2 gap-4">
        {prices.map((p) => (
          <button
            key={p.symbol}
            disabled={isLoading}
            onClick={() => onGenerate(p.symbol, p.price)}
            className="group relative bg-gray-900/60 hover:bg-emerald-600/20 border border-gray-700 hover:border-emerald-500/50 p-4 rounded-xl transition-all duration-300 text-left disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex justify-between items-start mb-1">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{p.symbol}</span>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <SparklesIcon className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
            <div className="text-xl font-mono font-bold text-white">${parseFloat(p.price).toLocaleString()}</div>
            <div className="mt-3 text-[10px] font-bold text-emerald-400 uppercase tracking-tighter group-hover:translate-x-1 transition-transform">
              點擊產生祝賀推文 →
            </div>
          </button>
        ))}
      </div>
      
      {isLoading && (
        <div className="mt-4 flex items-center justify-center space-x-2 text-emerald-400 text-sm font-medium animate-pulse">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></div>
          <span>正在構思祝賀詞...</span>
        </div>
      )}
    </div>
  );
};

export default CelebrationTool;
