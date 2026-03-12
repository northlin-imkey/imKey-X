export type Language = 'zh-CN' | 'zh-TW' | 'en';
export type Tone = 'professional' | 'influencer' | 'humorous';
export type TweetStatus = 'pending' | 'published' | 'dismissed';
export type TweetType = 'educational' | 'promotional' | 'interaction' | 'news' | 'poll';

export interface Tweet {
  tweetText: string;
  hashtags: string[];
  status?: TweetStatus;
  type?: TweetType;
  pollOptions?: string[];
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
  tweet_type?: TweetType;
  date_range?: string;
  content: DailyTweetGroup[];
}
