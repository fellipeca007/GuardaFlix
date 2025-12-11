import { GoogleGenAI, Type } from "@google/genai";
import { Post } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateInitialPosts = async (): Promise<Post[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Generate 5 realistic, modern social media posts. The topics should be positive: nature, technology, design, or daily life. Do not mention politics or controversial topics. Include a mix of short and medium length text.",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              user: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  handle: { type: Type.STRING },
                  // We will assign avatars locally to ensure they work
                }
              },
              content: { type: Type.STRING },
              likes: { type: Type.INTEGER },
              timestamp: { type: Type.STRING, description: "Relative time like '2h ago' or 'Just now'" }
            }
          }
        }
      }
    });

    const rawPosts = JSON.parse(response.text || "[]");
    
    // Enrich with placeholder images and avatars
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return rawPosts.map((post: any, index: number) => ({
      ...post,
      user: {
        ...post.user,
        avatar: `https://picsum.photos/seed/${post.user.id}/150/150`
      },
      image: index % 2 === 0 ? `https://picsum.photos/seed/${post.id}/800/500` : undefined,
      comments: [],
      isLiked: false
    }));

  } catch (error) {
    console.error("Failed to generate posts:", error);
    return [];
  }
};