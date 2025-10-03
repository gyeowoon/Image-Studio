import { AspectRatio, Tab } from "../types";

// Helper to convert a File to a base64 string
const fileToBase64 = (file: File): Promise<{ data: string, mimeType: string }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            // result is "data:image/jpeg;base64,xxxxxxxx..."
            // We need to extract the part after the comma
            const data = result.split(',')[1];
            resolve({ data, mimeType: file.type });
        };
        reader.onerror = (error) => reject(error);
    });
};


export const improvePrompt = async (prompt: string): Promise<string> => {
    try {
        const response = await fetch('/api/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                operation: 'improvePrompt',
                payload: { prompt }
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || '프롬프트 개선 중 서버 오류 발생');
        }

        const data = await response.json();
        return data.text;
    } catch (error) {
        console.error("Error improving prompt:", error);
        throw new Error(error instanceof Error ? error.message : "프롬프트 개선 중 오류가 발생했습니다.");
    }
};

export const generateImage = async (prompt: string, images: File[], aspectRatio: AspectRatio, tab: Tab): Promise<string> => {
    try {
        const imagePayloads = await Promise.all(images.map(fileToBase64));

        const response = await fetch('/api/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                operation: 'generateImage',
                payload: {
                    prompt,
                    images: imagePayloads,
                    aspectRatio,
                    tab
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || '이미지 생성 중 서버 오류 발생');
        }

        const data = await response.json();
        return data.imageUrl;
    } catch (error) {
        console.error("Error generating/editing image:", error);
        throw new Error(error instanceof Error ? error.message : "이미지 생성/편집 중 오류가 발생했습니다.");
    }
};
