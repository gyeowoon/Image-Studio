import React, { useState, useCallback, useEffect } from 'react';
import { Tab, AspectRatio, ImageFile } from './types';
import { MagicWandIcon, UploadIcon, SpinnerIcon } from './components/icons';
import { improvePrompt, generateImage } from './services/geminiService';

const PROMPT_TEMPLATES: Record<string, string> = {
    '사실적인 장면': '[장면 유형]의 사실적인 사진: [피사체], [행동 또는 표정], [배경]. [조명 설명]으로 장면을 비추어 [분위기] 분위기를 연출합니다. [카메라/렌즈 정보]로 촬영하여 [주요 질감 및 디테일]을 강조합니다. 이미지는 [이미지 비율] 형식이어야 합니다.',
    '세련된 삽화': '[스타일] 스타일의 [피사체] 스티커, [주요 특징]과 [색상 팔레트]를 특징으로 합니다. 디자인은 [선 스타일]과 [음영 스타일]을 가져야 합니다. 배경은 투명해야 합니다.',
    '정확한 텍스트': '[브랜드/컨셉]을 위한 [이미지 유형]을 만들어 주세요. 텍스트는 "[렌더링할 텍스트]"이며, 글꼴은 [글꼴 스타일]입니다. 디자인은 [스타일 설명]과 [색상 구성표]를 가져야 합니다.',
    '제품 목업': '[제품 설명]의 고해상도 스튜디오 조명 제품 사진. [배경 표면/설명] 위에 놓여 있습니다. 조명은 [조명 설정]으로 [조명 목적]을 달성합니다. 카메라 각도는 [각도 유형]으로 [특정 기능]을 보여줍니다. 초현실적이며 [주요 디테일]에 선명한 초점. [이미지 비율].',
};

const Header = () => (
    <header className="text-center p-6 border-b border-gray-700">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
            Gemini 이미지 생성기
        </h1>
        <p className="text-gray-400 mt-2">일명 Nano Banana 🍌</p>
    </header>
);

const ApiKeyModal: React.FC<{ onApiKeySubmit: (key: string) => void }> = ({ onApiKeySubmit }) => {
    const [inputKey, setInputKey] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputKey.trim()) {
            onApiKeySubmit(inputKey.trim());
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <form onSubmit={handleSubmit} className="bg-gray-800 rounded-lg shadow-xl p-8 max-w-md w-full text-center border border-purple-500/50">
                <h2 className="text-2xl font-bold text-purple-400 mb-4">Gemini API 키 입력</h2>
                <p className="text-gray-300 mb-6">
                    애플리케이션을 사용하려면 Gemini API 키를 입력해주세요. 입력된 키는 현재 브라우저 세션 동안만 저장됩니다.
                </p>
                <input
                    type="password"
                    value={inputKey}
                    onChange={(e) => setInputKey(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-600 rounded-md p-3 text-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition mb-4"
                    placeholder="API 키를 여기에 붙여넣으세요"
                    autoComplete="off"
                />
                <button
                    type="submit"
                    className="w-full bg-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-purple-700 transition-all duration-300 disabled:opacity-50"
                    disabled={!inputKey.trim()}
                >
                    키 저장 및 시작
                </button>
                 <p className="text-xs text-gray-500 mt-4">
                    API 키는 <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline hover:text-purple-400">Google AI Studio</a>에서 얻을 수 있습니다.
                </p>
            </form>
        </div>
    );
};


const TabSelector: React.FC<{ activeTab: Tab; setActiveTab: (tab: Tab) => void }> = ({ activeTab, setActiveTab }) => {
    const tabs: { key: Tab; label: string }[] = [
        { key: Tab.GENERATE, label: '이미지 생성' },
        { key: Tab.EDIT, label: '이미지 편집' },
        { key: Tab.COMPOSE, label: '이미지 합성' },
    ];

    return (
        <nav className="flex justify-center p-4 bg-gray-800/50 rounded-lg">
            <div className="flex space-x-2 bg-gray-900 p-1 rounded-md">
                {tabs.map(({ key, label }) => (
                    <button
                        key={key}
                        onClick={() => setActiveTab(key)}
                        className={`px-6 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                            activeTab === key
                                ? 'bg-purple-600 text-white'
                                : 'text-gray-300 hover:bg-gray-700'
                        }`}
                    >
                        {label}
                    </button>
                ))}
            </div>
        </nav>
    );
};

const ImageUpload: React.FC<{ onImageSelect: (file: File) => void; imageFile: ImageFile | null; onImageRemove: () => void; text: string }> = ({ onImageSelect, imageFile, onImageRemove, text }) => {
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onImageSelect(e.target.files[0]);
        }
    };

    return (
        <div className="w-full aspect-square">
            {imageFile ? (
                <div className="relative group h-full">
                    <img src={imageFile.preview} alt="업로드 미리보기" className="w-full h-full object-cover rounded-lg" />
                    <button
                        onClick={onImageRemove}
                        className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        ✕
                    </button>
                </div>
            ) : (
                <label className="flex flex-col items-center justify-center w-full h-full border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-800 hover:bg-gray-700 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                        <UploadIcon className="w-8 h-8 mb-4 text-gray-400" />
                        <p className="mb-2 text-sm text-gray-400">{text}</p>
                        <p className="text-xs text-gray-500">PNG, JPG, WEBP</p>
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                </label>
            )}
        </div>
    );
};

const App: React.FC = () => {
    const [apiKey, setApiKey] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>(Tab.GENERATE);
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
    const [images, setImages] = useState<ImageFile[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isImproving, setIsImproving] = useState(false);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const storedKey = sessionStorage.getItem('gemini_api_key');
        if (storedKey) {
            setApiKey(storedKey);
        }
    }, []);

    const handleApiKeySubmit = (key: string) => {
        setApiKey(key);
        sessionStorage.setItem('gemini_api_key', key);
    };

    const handleImprovePrompt = useCallback(async () => {
        if (!prompt || !apiKey) return;
        setIsImproving(true);
        setError(null);
        try {
            const improved = await improvePrompt(prompt, apiKey);
            setPrompt(improved);
        } catch (err) {
            setError(err instanceof Error ? err.message : "프롬프트 개선 중 오류 발생");
        } finally {
            setIsImproving(false);
        }
    }, [prompt, apiKey]);

    const handleSubmit = useCallback(async () => {
        if (!apiKey) {
            setError("API 키가 설정되지 않았습니다. 페이지를 새로고침하고 키를 다시 입력해주세요.");
            return;
        }
        setIsProcessing(true);
        setError(null);
        setResultImage(null);

        const imageFiles = images.map(img => img.file);

        try {
            const generatedImg = await generateImage(prompt, imageFiles, aspectRatio, activeTab, apiKey);
            setResultImage(generatedImg);
        } catch (err) {
            setError(err instanceof Error ? err.message : "이미지 생성 중 오류 발생");
        } finally {
            setIsProcessing(false);
        }
    }, [prompt, aspectRatio, images, activeTab, apiKey]);
    
    const handleImageSelect = (file: File, index: number) => {
        const newImage: ImageFile = {
            id: Date.now(),
            file,
            preview: URL.createObjectURL(file)
        };
        setImages(prevImages => {
            const newImages = [...prevImages];
            // Clean up old object URL if exists
            if (newImages[index]) {
                URL.revokeObjectURL(newImages[index].preview);
            }
            newImages[index] = newImage;
            return newImages;
        });
    };

    const handleImageRemove = (index: number) => {
        setImages(prevImages => {
            const newImages = [...prevImages];
            const removedImage = newImages.splice(index, 1)[0];
            if (removedImage) {
                 URL.revokeObjectURL(removedImage.preview);
            }
            return newImages;
        });
    };
    
    const handleTabChange = (tab: Tab) => {
        setActiveTab(tab);
        setPrompt('');
        setImages([]);
        setResultImage(null);
        setError(null);
    }
    
    const getSubmitButtonText = () => {
        switch (activeTab) {
            case Tab.GENERATE: return '생성하기';
            case Tab.EDIT: return '편집하기';
            case Tab.COMPOSE: return '합성하기';
        }
    };

    const isSubmitDisabled = () => {
        if (isProcessing) return true;
        if (activeTab === Tab.GENERATE) return !prompt;
        if (activeTab === Tab.EDIT) return !prompt || images.length !== 1;
        if (activeTab === Tab.COMPOSE) return !prompt || images.length < 2;
        return true;
    };
    
    const maxImages = activeTab === Tab.EDIT ? 1 : (activeTab === Tab.COMPOSE ? 5 : 0);
    const imageUploadSlots = Array.from({ length: maxImages });

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
            {!apiKey && <ApiKeyModal onApiKeySubmit={handleApiKeySubmit} />}
            <div className={!apiKey ? 'pointer-events-none blur-sm' : ''}>
                <Header />
                <main className="container mx-auto p-4 md:p-8">
                    <TabSelector activeTab={activeTab} setActiveTab={handleTabChange} />

                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mt-8">
                        {/* Control Panel */}
                        <div className="bg-gray-800/50 p-6 rounded-xl space-y-6 lg:col-span-2">
                            <h2 className="text-xl font-semibold text-gray-200">1. 옵션 설정</h2>

                            {activeTab === Tab.EDIT && (
                                <div className="grid grid-cols-1 gap-4">
                                    {imageUploadSlots.map((_, index) => (
                                        <ImageUpload
                                            key={index}
                                            onImageSelect={(file) => handleImageSelect(file, index)}
                                            imageFile={images[index] || null}
                                            onImageRemove={() => handleImageRemove(index)}
                                            text="편집할 이미지 업로드"
                                        />
                                    ))}
                                </div>
                            )}

                            {activeTab === Tab.COMPOSE && (
                                <div className="space-y-4">
                                    {/* First row: 2 images */}
                                    <div className="grid grid-cols-2 gap-4">
                                        {Array.from({ length: 2 }).map((_, index) => (
                                            <ImageUpload
                                                key={index}
                                                onImageSelect={(file) => handleImageSelect(file, index)}
                                                imageFile={images[index] || null}
                                                onImageRemove={() => handleImageRemove(index)}
                                                text={`이미지 ${index + 1} 업로드`}
                                            />
                                        ))}
                                    </div>
                                    {/* Second row: 3 images */}
                                    <div className="grid grid-cols-3 gap-4">
                                        {Array.from({ length: 3 }).map((_, index) => {
                                            const actualIndex = index + 2;
                                            return (
                                                <ImageUpload
                                                    key={actualIndex}
                                                    onImageSelect={(file) => handleImageSelect(file, actualIndex)}
                                                    imageFile={images[actualIndex] || null}
                                                    onImageRemove={() => handleImageRemove(actualIndex)}
                                                    text={`이미지 ${actualIndex + 1} 업로드`}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                            
                            <div>
                                <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-2">프롬프트</label>
                                <div className="relative">
                                    <textarea
                                        id="prompt"
                                        rows={6}
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        className="w-full bg-gray-900 border border-gray-600 rounded-md p-3 text-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                                        placeholder="생성하고 싶은 이미지에 대해 자세히 설명해주세요..."
                                    />
                                    <button
                                        onClick={handleImprovePrompt}
                                        disabled={isImproving || !prompt}
                                        className="absolute bottom-2 right-2 p-2 rounded-md bg-gray-700 hover:bg-gray-600 text-purple-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                        title="프롬프트 개선"
                                    >
                                        {isImproving ? <SpinnerIcon /> : <MagicWandIcon className="w-5 h-5"/>}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label htmlFor="template" className="block text-sm font-medium text-gray-300 mb-2">프롬프트 템플릿</label>
                                <select
                                    id="template"
                                    onChange={(e) => e.target.value && setPrompt(PROMPT_TEMPLATES[e.target.value])}
                                    className="w-full bg-gray-900 border border-gray-600 rounded-md p-3 text-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                >
                                    <option value="">템플릿 선택...</option>
                                    {Object.keys(PROMPT_TEMPLATES).map(key => (
                                        <option key={key} value={key}>{key}</option>
                                    ))}
                                </select>
                            </div>
                            
                            {activeTab === Tab.GENERATE && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">이미지 비율</label>
                                    <div className="flex space-x-2">
                                        {(['1:1', '16:9', '9:16', '4:3', '3:4'] as AspectRatio[]).map(ratio => (
                                            <button
                                                key={ratio}
                                                onClick={() => setAspectRatio(ratio)}
                                                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                                                    aspectRatio === ratio
                                                        ? 'bg-purple-600 text-white'
                                                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                                                }`}
                                            >
                                                {ratio}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitDisabled()}
                                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 px-4 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
                            >
                                {isProcessing ? '처리 중...' : getSubmitButtonText()}
                            </button>
                        </div>

                        {/* Result Display */}
                        <div className="bg-gray-800/50 p-6 rounded-xl flex flex-col items-center justify-center lg:col-span-3">
                            <h2 className="text-xl font-semibold text-gray-200 w-full text-left mb-4">2. 결과</h2>
                            <div className="w-full max-w-[740px] aspect-[74/80] bg-gray-900 rounded-lg flex items-center justify-center border border-gray-700">
                            {isProcessing && <div className="flex flex-col items-center gap-4"><SpinnerIcon /><p className="text-gray-400">이미지를 생성하고 있습니다...</p></div>}
                            {error && <p className="text-red-400 p-4 text-center">{error}</p>}
                            {!isProcessing && !error && resultImage && (
                                <img src={resultImage} alt="생성된 이미지" className="max-w-full max-h-full object-contain rounded-md" />
                            )}
                            {!isProcessing && !error && !resultImage && (
                                <p className="text-gray-500">결과가 여기에 표시됩니다.</p>
                            )}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default App;
