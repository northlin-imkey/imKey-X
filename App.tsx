import React, { useState, useCallback } from 'react';
import { generateTweets } from './services/geminiService';
import { type DailyTweetGroup, type Language, type Tone } from './types';
import Header from './components/Header';
import InputSection from './components/InputSection';
import ResultsSection from './components/ResultsSection';

const App: React.FC = () => {
  const [pannewsImage, setPannewsImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [generatedTweets, setGeneratedTweets] = useState<DailyTweetGroup[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>('zh-CN');
  const [tone, setTone] = useState<Tone>('professional');

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
      const tweets = await generateTweets(pannewsImage, language, tone);
      setGeneratedTweets(tweets);
    } catch (err) {
      console.error(err);
      setError('推文生成失敗，請檢查您的網路連線、圖片格式或稍後再試。');
    } finally {
      setIsLoading(false);
    }
  }, [pannewsImage, isLoading, language, tone]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <InputSection
          onImageChange={handleImageChange}
          onImageRemove={handleImageRemove}
          imagePreview={imagePreview}
          onGenerate={handleGenerate}
          isLoading={isLoading}
          language={language}
          onLanguageChange={setLanguage}
          tone={tone}
          onToneChange={setTone}
        />
        <ResultsSection
          tweetGroups={generatedTweets}
          isLoading={isLoading}
          error={error}
        />
      </main>
      <footer className="text-center p-4 text-gray-500 text-sm">
        <p>由 AI 驅動，為 imKey 打造</p>
      </footer>
    </div>
  );
};

export default App;