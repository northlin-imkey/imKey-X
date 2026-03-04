import React, { useState } from 'react';
import { type Tweet, type TweetStatus } from '../types';
import CopyIcon from './icons/CopyIcon';
import CheckIcon from './icons/CheckIcon';
import TwitterIcon from './icons/TwitterIcon';
import SparklesIcon from './icons/SparklesIcon';
import XCircleIcon from './icons/XCircleIcon';

interface TweetCardProps {
  tweet: Tweet;
  onStatusChange?: (status: TweetStatus) => void;
}

const TweetCard: React.FC<TweetCardProps> = ({ tweet, onStatusChange }) => {
  const [copiedText, setCopiedText] = useState(false);

  const handleCopy = (textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    });
  };

  const handlePostToTwitter = () => {
    const textToTweet = `${tweet.tweetText}\n\n${tweet.hashtags.join(' ')}`;
    const encodedText = encodeURIComponent(textToTweet);
    const url = `https://twitter.com/intent/tweet?text=${encodedText}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const fullTweetText = `${tweet.tweetText}\n\n${tweet.hashtags.join(' ')}`;

  return (
    <div className={`bg-gray-900/50 border p-4 rounded-lg shadow-md transition-all transform hover:scale-[1.01] group relative ${
      tweet.status === 'published' ? 'border-emerald-500/50 bg-emerald-900/10' : 
      tweet.status === 'dismissed' ? 'border-red-500/50 bg-red-900/10 opacity-60' : 
      'border-gray-700 hover:border-blue-500/50'
    }`}>
      {tweet.status && (
        <div className={`absolute -top-2 -right-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shadow-sm ${
          tweet.status === 'published' ? 'bg-emerald-500 text-white' : 
          tweet.status === 'dismissed' ? 'bg-red-500 text-white' : 
          'bg-gray-700 text-gray-300'
        }`}>
          {tweet.status === 'published' ? '已發佈' : tweet.status === 'dismissed' ? '不發佈' : '待處理'}
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div className="flex-1">
          <p className="text-gray-200 whitespace-pre-wrap text-lg leading-relaxed">{tweet.tweetText}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            {tweet.hashtags.map((tag, i) => (
              <span key={i} className="px-3 py-1 bg-blue-900/50 text-blue-300 text-sm font-medium rounded-full">
                {tag}
              </span>
            ))}
          </div>
        </div>
        
        <div className="flex flex-col space-y-2 flex-shrink-0 self-stretch md:self-center">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleCopy(fullTweetText)}
              className="flex-1 flex items-center justify-center px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors border border-gray-600 font-medium"
              title="複製內容"
            >
              {copiedText ? <CheckIcon className="w-4 h-4 mr-2 text-green-400" /> : <CopyIcon className="w-4 h-4 mr-2" />}
              {copiedText ? '已複製' : '複製'}
            </button>
            <button
              onClick={handlePostToTwitter}
              className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm transition-colors shadow-sm font-medium"
              title="發布到 Twitter"
            >
              <TwitterIcon className="w-4 h-4 mr-2" />
              推文
            </button>
          </div>

          {onStatusChange && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onStatusChange('published')}
                className={`flex-1 flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  tweet.status === 'published' 
                    ? 'bg-emerald-600 border-emerald-500 text-white' 
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-emerald-400 hover:border-emerald-500/50'
                }`}
              >
                <SparklesIcon className="w-3 h-3 mr-1.5" />
                發佈
              </button>
              <button
                onClick={() => onStatusChange('dismissed')}
                className={`flex-1 flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  tweet.status === 'dismissed' 
                    ? 'bg-red-600 border-red-500 text-white' 
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-red-400 hover:border-red-500/50'
                }`}
              >
                <XCircleIcon className="w-3 h-3 mr-1.5" />
                不發佈
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TweetCard;
