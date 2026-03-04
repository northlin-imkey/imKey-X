import { GoogleGenAI, Type } from "@google/genai";
import { type DailyTweetGroup, type Language, type Tone } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const getTweetSchema = (lang: Language) => {
  let langDesc = 'Simplified Chinese';
  if (lang === 'zh-TW') langDesc = 'Traditional Chinese';
  if (lang === 'en') langDesc = 'English';

  return {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        date: {
          type: Type.STRING,
          description: `The date associated with this group of tweets, e.g., "June 17" or "Monday". In ${langDesc}.`
        },
        tweets: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              tweetText: {
                type: Type.STRING,
                description: `Full tweet content, under 280 characters. MUST be in ${langDesc}.`,
              },
              hashtags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: `3-5 relevant hashtags. In ${langDesc} or English.`,
              },
            },
            required: ['tweetText', 'hashtags'],
          }
        }
      },
      required: ['date', 'tweets'],
    }
  };
};

const getSystemInstruction = (lang: Language, t: Tone) => {
  let langInstruction = 'Simplified Chinese (简体中文)';
  if (lang === 'zh-TW') langInstruction = 'Traditional Chinese (繁體中文)';
  if (lang === 'en') langInstruction = 'English';

  let toneInstruction = '';
  switch (t) {
    case 'professional':
      toneInstruction = 'Your tone should be professional, objective, serious, and informative, emphasizing security and reliability.';
      break;
    case 'influencer':
      toneInstruction = 'Your tone should be like a confident Crypto Twitter influencer. Use industry slang, be opinionated.';
      break;
    case 'humorous':
      toneInstruction = 'Your tone should be like a witty, funny, and relatable social media manager. Use memes, emojis.';
      break;
  }

  return `You are an expert social media manager for imKey. ${toneInstruction} Always output in ${langInstruction}.`;
};

const saveToHistory = async (language: Language, tone: Tone, content: DailyTweetGroup[], dateRange?: string) => {
  try {
    console.log('Saving to history:', { language, tone, dateRange });
    const response = await fetch('/api/save-history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language, tone, content, date_range: dateRange }),
    });
    const result = await response.json();
    console.log('Save result:', result);
  } catch (err) {
    console.error('Failed to save history:', err);
  }
};

export const updateTweetStatus = async (historyId: string, groupIndex: number, tweetIndex: number, status: string) => {
  try {
    console.log('Updating status:', { historyId, groupIndex, tweetIndex, status });
    const response = await fetch('/api/update-tweet-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ historyId, groupIndex, tweetIndex, status }),
    });
    if (!response.ok) throw new Error('Failed to update status');
    const result = await response.json();
    console.log('Update status result:', result);
    return result;
  } catch (err) {
    console.error('Failed to update tweet status:', err);
    throw err;
  }
};

export const generateTweets = async (imageFile: File, language: Language, tone: Tone): Promise<DailyTweetGroup[]> => {
  const base64Data = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(imageFile);
  });

  const imagePart = {
    inlineData: {
      data: base64Data,
      mimeType: imageFile.type,
    },
  };

  const textPrompt = `Analyze the attached PANNEWS calendar screenshot. Identify key dates and events. Generate 1-2 distinct tweet drafts for each. Group by date. Link events to imKey security.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: { parts: [{ text: textPrompt }, imagePart] },
    config: {
      systemInstruction: getSystemInstruction(language, tone),
      responseMimeType: "application/json",
      responseSchema: getTweetSchema(language) as any,
      temperature: 0.7,
    },
  });

  const generatedContent = JSON.parse(response.text || "[]") as DailyTweetGroup[];
  
  // Calculate date range
  let dateRange = '';
  if (generatedContent.length > 0) {
    const dates = generatedContent.map(g => g.date);
    dateRange = `${dates[0]} - ${dates[dates.length - 1]}`;
  }
  
  // Save to history asynchronously
  saveToHistory(language, tone, generatedContent, dateRange);

  return generatedContent;
};

export const generateCelebrationTweets = async (asset: string, price: string, language: Language, tone: Tone): Promise<DailyTweetGroup[]> => {
  const textPrompt = `
    The price of ${asset} has just broken through $${price}! 
    Generate 3 distinct celebratory tweet drafts for imKey.
    Each tweet should:
    1. Celebrate the price breakthrough.
    2. Remind users that with such high prices, securing their assets with imKey hardware wallet is more important than ever.
    3. Use relevant emojis and hashtags.
    4. Be under 280 characters.
    
    Output as a JSON array of objects with 'tweetText' and 'hashtags' (array of strings).
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: { parts: [{ text: textPrompt }] },
    config: {
      systemInstruction: getSystemInstruction(language, tone),
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            tweetText: { type: Type.STRING },
            hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['tweetText', 'hashtags'],
        }
      } as any,
      temperature: 0.8,
    },
  });

  const generatedContent = JSON.parse(response.text || "[]");
  const formattedResponse: DailyTweetGroup[] = [{
    date: `Breakthrough: ${asset} @ $${price}`,
    tweets: generatedContent
  }];

  // Save to history asynchronously
  saveToHistory(language, tone, formattedResponse, `Breakthrough: ${asset}`);

  return formattedResponse;
};
