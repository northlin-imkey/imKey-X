
import React from 'react';
import TwitterIcon from './icons/TwitterIcon';
import PriceTicker from './PriceTicker';

const Header: React.FC = () => {
  return (
    <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-10">
      <div className="container mx-auto px-4 md:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-500 p-2 rounded-lg">
              <TwitterIcon className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              imKey <span className="text-gray-400">推文產生器</span>
              <span className="ml-2 px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] rounded border border-emerald-500/30 font-black uppercase">v2.0</span>
            </h1>
          </div>
          <div className="hidden lg:block border-l border-gray-700 h-8"></div>
          <div className="hidden md:block">
            <PriceTicker />
          </div>
        </div>
        <a 
          href="https://imkey.im/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-sm font-semibold text-gray-300 hover:text-white transition-colors"
        >
          imKey Official
        </a>
      </div>
    </header>
  );
};

export default Header;
