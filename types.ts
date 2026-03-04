export type Language = 'zh-CN' | 'zh-TW' | 'en';
export type Tone = 'professional' | 'influencer' | 'humorous';
export type TweetStatus = 'pending' | 'published' | 'dismissed';

export interface Tweet {
  tweetText: string;
  hashtags: string[];
  status?: TweetStatus;
}

export interface DailyTweetGroup {
  date: string;
  tweets: Tweet[];
}

export interface HistoryItem {
  id: string;
  created_at: string;
  language: Language;
  tone: Tone;
  date_range?: string;
  content: DailyTweetGroup[];
}
