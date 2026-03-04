import { GoogleGenAI, Type } from "@google/genai";
import { type DailyTweetGroup, type Language, type Tone } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getTweetSchema = (language: Language) => {
    let langDesc = 'Simplified Chinese';
    if (language === 'zh-TW') langDesc = 'Traditional Chinese';
    if (language === 'en') langDesc = 'English';

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

const getSystemInstruction = (language: Language, tone: Tone) => {
    let langInstruction = 'Simplified Chinese (简体中文)';
    if (language === 'zh-TW') langInstruction = 'Traditional Chinese (繁體中文)';
    if (language === 'en') langInstruction = 'English';

    let toneInstruction = '';
    switch (tone) {
        case 'professional':
            toneInstruction = 'Your tone should be professional, objective, serious, and informative, emphasizing security and reliability. Use clear, concise language suitable for a corporate announcement or serious news update.';
            break;
        case 'influencer':
            toneInstruction = 'Your tone should be like a confident Crypto Twitter influencer or "whale" (OG). Use industry slang (e.g., WAGMI, LFG, DYOR, liquidity, alpha, bear/bull market), be opinionated, and frame the news as crucial market insights ("Alpha") that require secure storage. Speak with authority.';
            break;
        case 'humorous':
            toneInstruction = 'Your tone should be like a witty, funny, and relatable social media manager. Use memes concepts, emojis, light-hearted jokes, sarcasm, and be playful. Poke gentle fun at market volatility or degen behavior while subtly reminding users that "funds are safu" with imKey.';
            break;
    }

    return `You are an expert social media manager for imKey, a leading hardware wallet company. 
    Your goal is to create engaging and relevant Twitter posts that connect current crypto news with the security and benefits of using an imKey hardware wallet. 
    ${toneInstruction}
    Always output in ${langInstruction} for the tweet text.`;
};

async function fileToGenerativePart(file: File) {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
}

export const generateTweets = async (imageFile: File, language: Language, tone: Tone): Promise<DailyTweetGroup[]> => {
  const pannewsImagePart = await fileToGenerativePart(imageFile);

  const textPrompt = `
    Analyze the attached PANNEWS calendar screenshot containing major crypto events for the week.

    Your task is to:
    1. Identify key dates and events from the PANNEWS screenshot that can be connected to imKey hardware wallet security, market movements, or crypto trends.
    2. For each identified key date, generate 1-2 distinct tweet drafts.
    3. Group tweets by date.

    For each tweet draft, provide:
    - Engaging tweet content (under 280 chars) matching the selected tone ('${tone}') and linking the event to self-custody and the importance of using a hardware wallet like imKey.
    - 3-5 relevant hashtags.

    The output must be a valid JSON array matching the specified schema.
  `;

  const textGenerationResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts: [{ text: textPrompt }, pannewsImagePart] },
      config: {
        systemInstruction: getSystemInstruction(language, tone),
        responseMimeType: "application/json",
        responseSchema: getTweetSchema(language),
        temperature: 0.7,
      },
    });
    
  let jsonText = textGenerationResponse.text || "[]";
  
  // Clean up potential markdown formatting if present (prevents syntax errors)
  jsonText = jsonText.trim();
  if (jsonText.startsWith('```json')) {
    jsonText = jsonText.replace(/^```json/, '').replace(/```$/, '');
  } else if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/^```/, '').replace(/```$/, '');
  }

  try {
      const tweetGroups = JSON.parse(jsonText) as DailyTweetGroup[];
      return tweetGroups;
  } catch (error) {
      console.error("Failed to parse JSON:", jsonText);
      throw new Error("AI response was not valid JSON.");
  }
};