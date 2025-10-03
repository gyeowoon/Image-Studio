import { GoogleGenAI, Modality } from "@google/genai";
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { AspectRatio, Tab } from "../types";

const apiKey = process.env.API_KEY;
if (!apiKey) {
    // 서버 로그에만 표시됩니다.
    console.error("API_KEY environment variable not set.");
    // 클라이언트에게는 일반적인 오류 메시지를 보냅니다.
    throw new Error("서버에 API 키가 구성되지 않았습니다.");
}
const ai = new GoogleGenAI({ apiKey });

const fileDataToGenerativePart = (file: { data: string; mimeType: string }) => {
    return {
        inlineData: {
            data: file.data,
            mimeType: file.mimeType,
        },
    };
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { action, payload } = req.body;

        if (action === 'improvePrompt') {
            const { prompt } = payload;
            const systemInstruction = `You are an expert prompt engineer for an AI image generation model. Your task is to take a user's simple prompt and rewrite it into a highly detailed, descriptive, and creative prompt that will produce a better image. Follow the principles of describing a scene, using photographic terms, and providing rich context. Respond only with the improved prompt text. The prompt must be in Korean.`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    systemInstruction: systemInstruction,
                },
            });

            return res.status(200).json({ result: response.text });
        }

        if (action === 'generateImage') {
            const { prompt, images, aspectRatio, tab }: { prompt: string, images: {data: string, mimeType: string}[], aspectRatio: AspectRatio, tab: Tab } = payload;
            
            if (tab === Tab.GENERATE) {
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
                    throw new Error("생성된 이미지 데이터를 찾을 수 없습니다.");
                }
                const base64ImageBytes = response.generatedImages[0].image.imageBytes;
                return res.status(200).json({ result: `data:image/jpeg;base64,${base64ImageBytes}` });

            } else { // EDIT or COMPOSE
                const imageParts = images.map(fileDataToGenerativePart);
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
                        return res.status(200).json({ result: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` });
                    }
                }
                throw new Error("생성된 이미지 데이터를 찾을 수 없습니다.");
            }
        }

        return res.status(400).json({ error: 'Invalid action' });

    } catch (error) {
        console.error("API Error:", error);
        const message = error instanceof Error ? error.message : "서버에서 알 수 없는 오류가 발생했습니다.";
        return res.status(500).json({ error: message });
    }
}
