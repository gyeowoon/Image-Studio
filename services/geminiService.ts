
import { GoogleGenAI, Modality } from "@google/genai";
import { AspectRatio, Tab } from "../types";

const API_KEY = process.env.API_KEY;

const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

export const isApiKeyConfigured = (): boolean => {
    return !!ai;
};

const getAiClient = (): GoogleGenAI => {
    if (!ai) {
        throw new Error("API 키가 설정되지 않았습니다. 애플리케이션을 호스팅하는 서비스(예: Vercel)의 환경 변수 설정에서 'API_KEY'를 추가하고 다시 배포해주세요.");
    }
    return ai;
};


const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
    });
    return {
        inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
};

export const improvePrompt = async (prompt: string): Promise<string> => {
    try {
        const aiClient = getAiClient();
        const systemInstruction = `You are an expert prompt engineer for an AI image generation model. Your task is to take a user's simple prompt and rewrite it into a highly detailed, descriptive, and creative prompt that will produce a better image. Follow the principles of describing a scene, using photographic terms, and providing rich context. Respond only with the improved prompt text. The prompt must be in Korean.`;
        
        const response = await aiClient.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
            },
        });
        return response.text;
    } catch (error) {
        console.error("Error improving prompt:", error);
        if (error instanceof Error) {
            throw error;
        }
        throw new Error("프롬프트 개선 중 오류가 발생했습니다.");
    }
};

export const generateImage = async (prompt: string, images: File[], aspectRatio: AspectRatio, tab: Tab): Promise<string> => {
    const aiClient = getAiClient();
    if (tab === Tab.GENERATE) {
        if (!prompt) {
            throw new Error("프롬프트를 제공해야 합니다.");
        }
        try {
            const response = await aiClient.models.generateImages({
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

            const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
            return `data:image/jpeg;base64,${base64ImageBytes}`;
        } catch (error) {
            console.error("Error generating image with imagen:", error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error("이미지 생성 중 오류가 발생했습니다.");
        }
    } else { // EDIT or COMPOSE
        if (!prompt && images.length === 0) {
            throw new Error("프롬프트 또는 이미지를 제공해야 합니다.");
        }
        
        try {
            const imageParts = await Promise.all(images.map(fileToGenerativePart));
            const textPart = { text: prompt };
            
            const allParts = [...imageParts, textPart];
            
            const response = await aiClient.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: allParts },
                config: {
                    responseModalities: [Modality.IMAGE, Modality.TEXT],
                },
            });

            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }
            
            throw new Error("생성된 이미지 데이터를 찾을 수 없습니다.");

        } catch (error) {
            console.error("Error generating/editing image:", error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error("이미지 생성/편집 중 오류가 발생했습니다.");
        }
    }
};
