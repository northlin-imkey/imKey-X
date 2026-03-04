
import React from 'react';
import TwitterIcon from './icons/TwitterIcon';

const Header: React.FC = () => {
  return (
    <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-10">
      <div className="container mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-500 p-2 rounded-lg">
            <TwitterIcon className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
            imKey <span className="text-gray-400">推文產生器</span>
          </h1>
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
