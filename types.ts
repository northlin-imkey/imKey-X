export type Language = 'zh-CN' | 'zh-TW' | 'en';
export type Tone = 'professional' | 'influencer' | 'humorous';

export interface Tweet {
  tweetText: string;
  hashtags: string[];
}

export interface DailyTweetGroup {
  date: string;
  tweets: Tweet[];
}