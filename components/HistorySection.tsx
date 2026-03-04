import React, { useEffect, useState } from 'react';
import { type HistoryItem } from '../types';
import TweetCard from './TweetCard';
import { updateTweetStatus } from '../services/geminiService';
import SparklesIcon from './icons/SparklesIcon';

const HistorySection: React.FC = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      console.log('Fetching history...');
      const response = await fetch('/api/history');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with ${response.status}`);
      }
      const data = await response.json();
      console.log('History data received:', data);
      setHistory(data);
    } catch (err: any) {
      console.error('History fetch error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleStatusChange = async (historyId: string, groupIndex: number, tweetIndex: number, status: string) => {
    try {
      await updateTweetStatus(historyId, groupIndex, tweetIndex, status);
      // Refresh history to show updated status
      fetchHistory();
    } catch (err) {
      alert('更新狀態失敗');
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        <p className="text-gray-400">載入歷史紀錄中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-10 space-y-4">
        <div className="bg-red-900/20 border border-red-500/50 p-6 rounded-2xl text-red-200 text-center max-w-md">
          <p className="font-bold mb-2">載入失敗</p>
          <p className="text-sm opacity-80 mb-4">
            {error === 'Supabase not configured' ? '尚未設定 Supabase 環境變數' : error}
          </p>
          <button 
            onClick={() => {
              setIsLoading(true);
              setError(null);
              fetchHistory();
            }}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-bold transition-colors"
          >
            重試
          </button>
        </div>
        {error.includes('relation "tweets_history" does not exist') && (
          <div className="bg-blue-900/20 border border-blue-500/50 p-6 rounded-2xl text-blue-200 text-sm max-w-md">
            <p className="font-bold mb-2">💡 設定提示</p>
            <p>看來您的 Supabase 資料庫尚未建立 <code className="bg-blue-900/50 px-1 rounded">tweets_history</code> 資料表。請在 Supabase SQL Editor 執行以下指令：</p>
            <pre className="bg-black/50 p-3 rounded mt-3 overflow-x-auto text-[10px]">
{`CREATE TABLE tweets_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  language TEXT,
  tone TEXT,
  content JSONB,
  date_range TEXT
);`}
            </pre>
          </div>
        )}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-20 bg-gray-800/50 rounded-2xl border border-gray-700">
        <p className="text-gray-400">尚無歷史紀錄</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
        <span className="w-1.5 h-8 bg-emerald-500 rounded-full"></span>
        推文歷史紀錄
      </h2>
      
      <div className="grid grid-cols-1 gap-4">
        {history.map((item) => {
          const isExpanded = expandedId === item.id;
          const tweetCount = item.content.reduce((acc, group) => acc + group.tweets.length, 0);
          
          return (
            <div 
              key={item.id} 
              className={`bg-gray-800 border transition-all duration-300 rounded-2xl overflow-hidden ${
                isExpanded ? 'border-emerald-500/50 ring-1 ring-emerald-500/20' : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              {/* Card Header / Summary */}
              <div 
                className="p-5 cursor-pointer flex items-center justify-between hover:bg-gray-700/30 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="bg-emerald-900/30 p-3 rounded-xl">
                    <SparklesIcon className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-100">
                      {item.date_range || '未命名批次'}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-500">
                        {new Date(item.created_at).toLocaleString('zh-TW')}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 bg-gray-700 rounded text-gray-400 uppercase font-bold tracking-wider">
                        {tweetCount} 則推文
                      </span>
                      <span className="text-[10px] px-2 py-0.5 bg-blue-900/30 text-blue-400 rounded uppercase font-bold tracking-wider">
                        {item.language}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="hidden md:flex gap-2">
                    <span className="text-xs px-2 py-1 bg-gray-900/50 rounded-lg text-gray-400 border border-gray-700">
                      {item.tone}
                    </span>
                  </div>
                  <svg 
                    className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} 
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="p-6 bg-gray-900/30 border-t border-gray-700 space-y-8 animate-in fade-in slide-in-from-top-2 duration-300">
                  {item.content.map((group, gIdx) => (
                    <div key={gIdx} className="space-y-4">
                      <h4 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-3">
                        <span className="h-px flex-grow bg-gray-800"></span>
                        {group.date}
                        <span className="h-px flex-grow bg-gray-800"></span>
                      </h4>
                      <div className="grid grid-cols-1 gap-4">
                        {group.tweets.map((tweet, tIdx) => (
                          <TweetCard 
                            key={tIdx} 
                            tweet={tweet} 
                            onStatusChange={(status) => handleStatusChange(item.id, gIdx, tIdx, status)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HistorySection;
