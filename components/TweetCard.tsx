import React, { useState } from 'react';
import { type Tweet } from '../types';
import CopyIcon from './icons/CopyIcon';
import CheckIcon from './icons/CheckIcon';
import TwitterIcon from './icons/TwitterIcon';

interface TweetCardProps {
  tweet: Tweet;
}

const TweetCard: React.FC<TweetCardProps> = ({ tweet }) => {
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
    <div className="bg-gray-900/50 border border-gray-700 p-4 rounded-lg shadow-md transition-transform transform hover:scale-[1.01] hover:border-blue-500/50 group">
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
        
        <div className="flex items-center space-x-2 flex-shrink-0 self-start md:self-center">
          <button
            onClick={() => handleCopy(fullTweetText)}
            className="flex items-center px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors border border-gray-600 font-medium"
            title="複製內容"
          >
            {copiedText ? <CheckIcon className="w-4 h-4 mr-2 text-green-400" /> : <CopyIcon className="w-4 h-4 mr-2" />}
            {copiedText ? '已複製' : '複製'}
          </button>
          <button
            onClick={handlePostToTwitter}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm transition-colors shadow-sm font-medium"
            title="發布到 Twitter"
          >
            <TwitterIcon className="w-4 h-4 mr-2" />
            推文
          </button>
        </div>
      </div>
    </div>
  );
};

export default TweetCard;