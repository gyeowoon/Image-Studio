import { AspectRatio, Tab } from "../types";

// 이 헬퍼는 File 객체를 base64 문자열과 MIME 유형으로 변환합니다.
const fileToBase64 = (file: File): Promise<{ data: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            resolve({
                data: result.split(',')[1],
                mimeType: file.type,
            });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

const callApi = async (action: string, payload: any) => {
    const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, payload }),
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.error || 'API 요청 중 오류가 발생했습니다.');
    }

    return result.result;
};


export const improvePrompt = async (prompt: string): Promise<string> => {
    if (!prompt) {
        throw new Error("프롬프트를 제공해야 합니다.");
    }
    return callApi('improvePrompt', { prompt });
};

export const generateImage = async (prompt: string, images: File[], aspectRatio: AspectRatio, tab: Tab): Promise<string> => {
     if (tab !== Tab.GENERATE && images.length === 0) {
        throw new Error("편집 또는 합성을 위한 이미지를 제공해야 합니다.");
    }
    if (!prompt) {
        throw new Error("프롬프트를 제공해야 합니다.");
    }

    const imagePayload = await Promise.all(images.map(fileToBase64));
    return callApi('generateImage', { prompt, images: imagePayload, aspectRatio, tab });
};
