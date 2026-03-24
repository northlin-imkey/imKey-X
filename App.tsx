import React, { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import InputSection from './components/InputSection';
import ResultsSection from './components/ResultsSection';
import HistorySection from './components/HistorySection';
import CelebrationTool from './components/CelebrationTool';
import Calendar from './components/Calendar';
import { DailyTweetGroup, Language, Tone, TweetType, HistoryItem } from './types';
import { generateTweets, generateCelebrationTweets, generateHotTopics } from './services/geminiService';

const App: React.FC = () => {
  console.log('App component is rendering');
  const [view, setView] = useState<'generator' | 'history'>('generator');
  const [serverStatus, setServerStatus] = useState<'checking' | 'ok' | 'error'>('checking');
  const [supabaseStatus, setSupabaseStatus] = useState<boolean>(false);
  const [geminiStatus, setGeminiStatus] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const response = await fetch(`/backend/history?t=${Date.now()}`);
      if (response.ok) {
        const data = await response.json();
        console.log('[App] History fetched:', data.length, 'items');
        setHistory(data);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setHistoryError(errorData.error || `伺服器錯誤 (${response.status})`);
      }
    } catch (err: any) {
      console.error('Failed to fetch history:', err);
      setHistoryError(err.message || '無法連線至資料庫');
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    const checkServer = async () => {
      try {
        const pingUrl = `/backend/ping?t=${Date.now()}`;
        const res = await fetch(pingUrl, { 
          method: 'GET',
          headers: { 
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          }
        });
        
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`HTTP ${res.status}: ${text.substring(0, 100)}`);
        }
        
        const data = await res.json();
        if (data.status === 'ok') {
          setServerStatus('ok');
          setSupabaseStatus(data.supabase);
          setGeminiStatus(data.gemini);
          fetchHistory();
        } else {
          setServerStatus('error');
          setServerError('伺服器回應格式錯誤');
        }
      } catch (err: any) {
        setServerStatus('error');
        setServerError(err.message || '無法連線至後端伺服器');
      }
    };

    checkServer();
  }, [fetchHistory]);

  const [pannewsImage, setPannewsImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [generatedTweets, setGeneratedTweets] = useState<DailyTweetGroup[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>('zh-CN');
  const [tone, setTone] = useState<Tone>('professional');
  const [tweetType, setTweetType] = useState<TweetType>('educational');

  const handleImageChange = (file: File) => {
    setPannewsImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleImageRemove = () => {
    setPannewsImage(null);
    setImagePreview(null);
  };

  const handleGenerate = useCallback(async () => {
    if (!pannewsImage || isLoading) return;

    setIsLoading(true);
    setError(null);
    setGeneratedTweets([]);

    try {
      const tweets = await generateTweets(pannewsImage, language, tone, tweetType);
      setGeneratedTweets(tweets);
      fetchHistory();
    } catch (err: any) {
      console.error(err);
      setError(`推文生成失敗: ${err.message || '請檢查您的網路連線、圖片格式或稍後再試。'}`);
    } finally {
      setIsLoading(false);
    }
  }, [pannewsImage, isLoading, language, tone, tweetType, fetchHistory]);

  const handleGenerateHotTopics = async () => {
    if (isLoading) return;

    setIsLoading(true);
    setError(null);
    setGeneratedTweets([]);

    try {
      const tweets = await generateHotTopics(language, tone);
      setGeneratedTweets(tweets);
      fetchHistory();
    } catch (err) {
      console.error(err);
      setError('時事推文生成失敗，請稍後再試。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCelebrationGenerate = async (asset: string, price: string) => {
    if (isLoading) return;

    setIsLoading(true);
    setError(null);
    setGeneratedTweets([]);

    try {
      const tweets = await generateCelebrationTweets(asset, price, language, tone);
      setGeneratedTweets(tweets);
      fetchHistory();
    } catch (err) {
      console.error(err);
      setError('祝賀推文生成失敗，請稍後再試。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex flex-col">
      <Header />
      
      <div className="container mx-auto px-4 md:px-8 mt-6">
        <div className="flex items-center justify-between">
          <div className="flex bg-gray-800 p-1 rounded-xl w-fit border border-gray-700">
            <button
              onClick={() => setView('generator')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                view === 'generator' 
                  ? 'bg-emerald-600 text-white shadow-lg' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              推文產生器
            </button>
            <button
              onClick={() => setView('history')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                view === 'history' 
                  ? 'bg-emerald-600 text-white shadow-lg' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              歷史紀錄
            </button>
          </div>
          
          <div className="flex items-center gap-4">
            {serverStatus === 'ok' && (
              <div className="hidden md:flex items-center gap-4">
                <div className="flex items-center gap-2 text-[10px] text-gray-500 bg-gray-800/50 px-3 py-1.5 rounded-full border border-gray-700">
                  <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${geminiStatus ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                  AI 服務: {geminiStatus ? '正常' : '未設定'}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-gray-500 bg-gray-800/50 px-3 py-1.5 rounded-full border border-gray-700">
                  <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${supabaseStatus ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                  資料庫: {supabaseStatus ? '連線正常' : '連線失敗'}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-gray-500 bg-gray-800/50 px-3 py-1.5 rounded-full border border-gray-700">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                  伺服器連線正常
                </div>
              </div>
            )}
          </div>
        </div>
        
        {serverStatus !== 'ok' && (
          <div className="mt-4 flex justify-center">
            <div className={`text-xs px-3 py-1 rounded-full border ${
              serverStatus === 'checking' 
                ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' 
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}>
              伺服器狀態: {serverStatus === 'checking' ? '檢查中...' : `連線失敗 (${serverError})`}
              <button 
                onClick={async () => {
                  try {
                    const res1 = await fetch('/backend/ping');
                    const text1 = await res1.text();
                    const res2 = await fetch('/ping');
                    const text2 = await res2.text();
                    alert(`Backend: ${res1.status} - ${text1}\nRoot: ${res2.status} - ${text2}`);
                  } catch (e: any) {
                    alert(`Error: ${e.message}`);
                  }
                }}
                className="ml-2 px-2 py-0.5 bg-white/10 rounded hover:bg-white/20"
              >
                手動測試
              </button>
              {serverStatus === 'error' && (
                <button 
                  onClick={() => {
                    setServerStatus('checking');
                    setServerError(null);
                    window.location.reload();
                  }}
                  className="ml-2 underline hover:text-white"
                >
                  重試
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <main className="flex-grow container mx-auto p-4 md:p-8">
        {view === 'generator' ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <div className="lg:col-span-1 space-y-6">
                <Calendar history={history} />
                <CelebrationTool 
                  onGenerate={handleCelebrationGenerate} 
                  isLoading={isLoading} 
                />
              </div>
              <div className="lg:col-span-3">
                <InputSection
                  onImageChange={handleImageChange}
                  onImageRemove={handleImageRemove}
                  imagePreview={imagePreview}
                  onGenerate={handleGenerate}
                  onGenerateHotTopics={handleGenerateHotTopics}
                  isLoading={isLoading}
                  language={language}
                  onLanguageChange={setLanguage}
                  tone={tone}
                  onToneChange={setTone}
                  tweetType={tweetType}
                  onTweetTypeChange={setTweetType}
                />
              </div>
            </div>
            
            <ResultsSection
              tweetGroups={generatedTweets}
              isLoading={isLoading}
              error={error}
            />
          </div>
        ) : (
          <HistorySection 
            history={history} 
            isLoading={historyLoading} 
            error={historyError} 
            onRefresh={fetchHistory} 
          />
        )}
      </main>
      <footer className="text-center p-4 text-gray-500 text-sm">
        <p>由 AI 驅動，為 imKey 打造</p>
      </footer>
    </div>
  );
};

export default App;
