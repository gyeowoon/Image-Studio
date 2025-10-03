// /api/gemini.js
const { GoogleGenAI, Modality } = require('@google/genai');

const Tab = {
  GENERATE: 'GENERATE',
  EDIT: 'EDIT',
  COMPOSE: 'COMPOSE',
};

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!process.env.API_KEY) {
    return res.status(500).json({ error: 'API_KEY environment variable not set on server' });
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const { operation, payload } = req.body;

  try {
    switch (operation) {
      case 'improvePrompt': {
        const { prompt } = payload;
        if (!prompt) {
          return res.status(400).json({ error: 'Prompt is required for improvement.' });
        }

        const systemInstruction = `You are an expert prompt engineer for an AI image generation model. Your task is to take a user's simple prompt and rewrite it into a highly detailed, descriptive, and creative prompt that will produce a better image. Follow the principles of describing a scene, using photographic terms, and providing rich context. Respond only with the improved prompt text. The prompt must be in Korean.`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
            },
        });
        
        return res.status(200).json({ text: response.text });
      }

      case 'generateImage': {
        const { prompt, images, aspectRatio, tab } = payload;

        if (tab === Tab.GENERATE) {
            if (!prompt) {
                return res.status(400).json({ error: "프롬프트를 제공해야 합니다." });
            }
            
            const response = await ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: prompt,
                config: {
                  numberOfImages: 1,
                  outputMimeType: 'image/jpeg',
                  aspectRatio: aspectRatio,
                },
            });
            
            if (!response.generatedImages || response.generatedImages.length === 0) {
                return res.status(500).json({ error: "생성된 이미지 데이터를 찾을 수 없습니다." });
            }

            const base64ImageBytes = response.generatedImages[0].image.imageBytes;
            const imageUrl = `data:image/jpeg;base64,${base64ImageBytes}`;
            return res.status(200).json({ imageUrl });

        } else { // EDIT or COMPOSE
            if (!prompt && (!images || images.length === 0)) {
                return res.status(400).json({ error: "프롬프트 또는 이미지를 제공해야 합니다." });
            }

            const imageParts = images.map(img => ({
                inlineData: { data: img.data, mimeType: img.mimeType },
            }));
            const textPart = { text: prompt };
            const allParts = [...imageParts, textPart];
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: allParts },
                config: {
                    responseModalities: [Modality.IMAGE, Modality.TEXT],
                },
            });

            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    const imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                    return res.status(200).json({ imageUrl });
                }
            }
            
            return res.status(500).json({ error: "생성된 이미지 데이터를 찾을 수 없습니다." });
        }
      }

      default:
        return res.status(400).json({ error: `Unknown operation: ${operation}` });
    }
  } catch (error) {
    console.error(`Error during operation ${operation}:`, error);
    return res.status(500).json({ error: error.message || 'An unexpected error occurred.' });
  }
}

module.exports = handler;
