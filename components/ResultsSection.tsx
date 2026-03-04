
import React from 'react';
import { type DailyTweetGroup } from '../types';
import TweetCard from './TweetCard';

interface ResultsSectionProps {
  tweetGroups: DailyTweetGroup[];
  isLoading: boolean;
  error: string | null;
}

const LoadingSkeleton: React.FC = () => (
    <div className="mb-6 animate-pulse">
        <div className="h-5 bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="space-y-4">
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-700 rounded w-5/6 mb-4"></div>
                <div className="flex flex-wrap gap-2">
                    <div className="h-6 bg-gray-700 rounded-full w-20"></div>
                    <div className="h-6 bg-gray-700 rounded-full w-24"></div>
                </div>
            </div>
        </div>
    </div>
);

const ResultsSection: React.FC<ResultsSectionProps> = ({ tweetGroups, isLoading, error }) => {
  return (
    <div className="bg-gray-800 p-6 rounded-xl shadow-lg flex flex-col">
      <h2 className="text-lg font-semibold mb-4 text-gray-300">2. AI 生成的推文草稿</h2>
      <div className="flex-grow space-y-4 overflow-y-auto pr-2 -mr-2">
        {isLoading && Array.from({ length: 2 }).map((_, i) => <LoadingSkeleton key={i} />)}
        
        {!isLoading && error && (
          <div className="text-center p-8 bg-red-900/30 rounded-lg">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {!isLoading && !error && tweetGroups.length === 0 && (
          <div className="text-center p-8 text-gray-500 h-full flex flex-col justify-center items-center">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="font-semibold">等待生成推文</p>
            <p className="text-sm">在這裡您將會看到 AI 為您準備的推文草稿。</p>
          </div>
        )}

        {!isLoading && tweetGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="pt-2">
            <h3 className="text-md font-bold text-blue-400 border-b-2 border-gray-700 pb-2 mb-4 sticky top-0 bg-gray-800 py-2">
              {group.date}
            </h3>
            <div className="space-y-4">
              {group.tweets.map((tweet, tweetIndex) => (
                <TweetCard key={tweetIndex} tweet={tweet} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResultsSection;
