"use client";

import { useState, useEffect, useRef } from "react";
import { ConversationSentence } from "@/db/schema";
import { useArabicFontSize } from "@/contexts/ArabicFontSizeContext";
import { Eye, EyeOff, Play, Pause, Volume2 } from "lucide-react";

interface ConversationDisplayProps {
    sentences: ConversationSentence[];
}

type Language = "arabic" | "english" | "both";

// Helper function to play audio using Web Speech API
function playAudio(text: string, lang: string = "en-US", onEnd?: () => void) {
    if (typeof window === "undefined" || !window.speechSynthesis) {
        console.warn("Speech synthesis not supported");
        return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const speak = () => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;

        // Try to find a voice that matches the language
        const voices = window.speechSynthesis.getVoices();
        const langPrefix = lang.split("-")[0];
        const matchingVoice = voices.find(
            (voice) => voice.lang.startsWith(langPrefix)
        );
        if (matchingVoice) {
            utterance.voice = matchingVoice;
        }

        if (onEnd) {
            utterance.onend = onEnd;
            utterance.onerror = onEnd;
        }

        window.speechSynthesis.speak(utterance);
    };

    // Ensure voices are loaded before speaking
    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) {
        // Voices might not be loaded yet, wait for them
        window.speechSynthesis.onvoiceschanged = () => {
            window.speechSynthesis.onvoiceschanged = null;
            speak();
        };
    } else {
        speak();
    }
}

export function ConversationDisplay({ sentences }: ConversationDisplayProps) {
    const { getArabicFontSize } = useArabicFontSize();
    const [showTranslations, setShowTranslations] = useState(true);
    const [selectedLanguage, setSelectedLanguage] = useState<Language>("arabic");
    const [playingSentenceId, setPlayingSentenceId] = useState<number | null>(null);
    const [isPlayingAll, setIsPlayingAll] = useState(false);
    const [currentPlayAllIndex, setCurrentPlayAllIndex] = useState(0);
    const playAllQueueRef = useRef<number[]>([]);
    const shouldContinuePlayingRef = useRef<boolean>(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Sort sentences by order for sequential playback
    const sortedSentences = [...sentences].sort((a, b) => a.order - b.order);

    // Split sentences into left and right columns based on order
    // Arabic conversations start from right to left, so:
    // Even orders (0, 2, 4...) go to right column (first sentence)
    // Odd orders (1, 3, 5...) go to left column
    const rightColumnSentences = sentences.filter(s => s.order % 2 === 0);
    const leftColumnSentences = sentences.filter(s => s.order % 2 === 1);

    // Play all sentences sequentially
    const handlePlayAll = () => {
        if (isPlayingAll) {
            // Stop playing
            shouldContinuePlayingRef.current = false;
            window.speechSynthesis?.cancel();
            
            // Clear any pending timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
            
            setIsPlayingAll(false);
            setPlayingSentenceId(null);
            setCurrentPlayAllIndex(0);
            playAllQueueRef.current = [];
            return;
        }

        // Filter sentences that have text in the selected language
        const playableSentences = sortedSentences.filter(s => {
            if (selectedLanguage === "arabic") {
                return s.arabic && s.arabic.trim().length > 0;
            } else if (selectedLanguage === "english") {
                return s.english && s.english.trim().length > 0;
            } else {
                // For "both" mode, include sentences that have at least one language
                return (s.arabic && s.arabic.trim().length > 0) || (s.english && s.english.trim().length > 0);
            }
        });

        if (playableSentences.length === 0) {
            return;
        }

        shouldContinuePlayingRef.current = true;
        setIsPlayingAll(true);
        setCurrentPlayAllIndex(0);
        playAllQueueRef.current = playableSentences.map(s => s.id);

        // Start playing the first sentence
        playSentenceSequentially(playableSentences, 0);
    };

    const playSentenceSequentially = (playableSentences: ConversationSentence[], index: number) => {
        // Check if we should stop playing
        if (!shouldContinuePlayingRef.current) {
            return;
        }

        if (index >= playableSentences.length) {
            // Finished playing all sentences
            setIsPlayingAll(false);
            setPlayingSentenceId(null);
            setCurrentPlayAllIndex(0);
            playAllQueueRef.current = [];
            shouldContinuePlayingRef.current = false;
            return;
        }

        const sentence = playableSentences[index];
        setPlayingSentenceId(sentence.id);
        setCurrentPlayAllIndex(index);

        if (selectedLanguage === "both") {
            // Play Arabic first, then English
            const arabicText = sentence.arabic || "";
            const englishText = sentence.english || "";

            if (arabicText.trim().length > 0) {
                // Play Arabic first
                playAudio(arabicText, "ar-SA", () => {
                    // Check if we should continue
                    if (!shouldContinuePlayingRef.current) {
                        return;
                    }

                    // After Arabic finishes, play English
                    if (englishText.trim().length > 0) {
                        playAudio(englishText, "en-US", () => {
                            // Check again if we should continue before moving to next sentence
                            if (!shouldContinuePlayingRef.current) {
                                return;
                            }

                            // Clear any existing timeout
                            if (timeoutRef.current) {
                                clearTimeout(timeoutRef.current);
                            }

                            // Move to next sentence after both audios finish
                            timeoutRef.current = setTimeout(() => {
                                if (shouldContinuePlayingRef.current) {
                                    playSentenceSequentially(playableSentences, index + 1);
                                }
                                timeoutRef.current = null;
                            }, 300); // Small delay between sentences
                        });
                    } else {
                        // No English text, move to next sentence
                        if (timeoutRef.current) {
                            clearTimeout(timeoutRef.current);
                        }
                        timeoutRef.current = setTimeout(() => {
                            if (shouldContinuePlayingRef.current) {
                                playSentenceSequentially(playableSentences, index + 1);
                            }
                            timeoutRef.current = null;
                        }, 300);
                    }
                });
            } else if (englishText.trim().length > 0) {
                // Only English available
                playAudio(englishText, "en-US", () => {
                    if (!shouldContinuePlayingRef.current) {
                        return;
                    }
                    if (timeoutRef.current) {
                        clearTimeout(timeoutRef.current);
                    }
                    timeoutRef.current = setTimeout(() => {
                        if (shouldContinuePlayingRef.current) {
                            playSentenceSequentially(playableSentences, index + 1);
                        }
                        timeoutRef.current = null;
                    }, 300);
                });
            } else {
                // No text available, skip to next
                playSentenceSequentially(playableSentences, index + 1);
            }
        } else {
            // Single language mode (existing behavior)
            const text = selectedLanguage === "arabic" ? sentence.arabic : (sentence.english || "");
            const lang = selectedLanguage === "arabic" ? "ar-SA" : "en-US";

            playAudio(text, lang, () => {
                // Check again if we should continue before moving to next sentence
                if (!shouldContinuePlayingRef.current) {
                    return;
                }

                // Clear any existing timeout
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                }

                // Move to next sentence after current one finishes
                timeoutRef.current = setTimeout(() => {
                    if (shouldContinuePlayingRef.current) {
                        playSentenceSequentially(playableSentences, index + 1);
                    }
                    timeoutRef.current = null;
                }, 300); // Small delay between sentences
            });
        }
    };

    // Play individual sentence
    const handlePlaySentence = (sentence: ConversationSentence) => {
        // If playing all, stop it first
        if (isPlayingAll) {
            shouldContinuePlayingRef.current = false;
            window.speechSynthesis?.cancel();
            
            // Clear any pending timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
            
            setIsPlayingAll(false);
            setCurrentPlayAllIndex(0);
            playAllQueueRef.current = [];
        }

        // If already playing this sentence, stop it
        if (playingSentenceId === sentence.id) {
            window.speechSynthesis?.cancel();
            setPlayingSentenceId(null);
            return;
        }

        if (selectedLanguage === "both") {
            // Play Arabic first, then English
            const arabicText = sentence.arabic || "";
            const englishText = sentence.english || "";

            if (!arabicText.trim().length && !englishText.trim().length) {
                return;
            }

            setPlayingSentenceId(sentence.id);

            if (arabicText.trim().length > 0) {
                // Play Arabic first
                playAudio(arabicText, "ar-SA", () => {
                    // After Arabic finishes, play English if available
                    if (englishText.trim().length > 0) {
                        playAudio(englishText, "en-US", () => {
                            setPlayingSentenceId(null);
                        });
                    } else {
                        setPlayingSentenceId(null);
                    }
                });
            } else if (englishText.trim().length > 0) {
                // Only English available
                playAudio(englishText, "en-US", () => {
                    setPlayingSentenceId(null);
                });
            }
        } else {
            // Single language mode
            const text = selectedLanguage === "arabic" ? sentence.arabic : (sentence.english || "");
            if (!text || text.trim().length === 0) {
                return;
            }

            const lang = selectedLanguage === "arabic" ? "ar-SA" : "en-US";
            setPlayingSentenceId(sentence.id);

            playAudio(text, lang, () => {
                setPlayingSentenceId(null);
            });
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            shouldContinuePlayingRef.current = false;
            window.speechSynthesis?.cancel();
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    // Stop all playback when language changes
    useEffect(() => {
        shouldContinuePlayingRef.current = false;
        window.speechSynthesis?.cancel();
        
        // Clear any pending timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        
        setIsPlayingAll(false);
        setPlayingSentenceId(null);
        setCurrentPlayAllIndex(0);
        playAllQueueRef.current = [];
    }, [selectedLanguage]);

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-slate-900">Conversation</h2>
                    <button
                        onClick={() => setShowTranslations(!showTranslations)}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                        title={showTranslations ? "Hide translations" : "Show translations"}
                    >
                        {showTranslations ? (
                            <>
                                <EyeOff className="w-4 h-4" />
                                Hide Translations
                            </>
                        ) : (
                            <>
                                <Eye className="w-4 h-4" />
                                Show Translations
                            </>
                        )}
                    </button>
                </div>
                
                {/* Audio Controls */}
                <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-slate-700">Language:</label>
                        <select
                            value={selectedLanguage}
                            onChange={(e) => setSelectedLanguage(e.target.value as Language)}
                            className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        >
                            <option value="arabic">Arabic</option>
                            <option value="english">English</option>
                            <option value="both">Both Languages</option>
                        </select>
                    </div>
                    
                    <button
                        onClick={handlePlayAll}
                        disabled={sortedSentences.length === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isPlayingAll ? (
                            <>
                                <Pause className="w-4 h-4" />
                                Stop All
                            </>
                        ) : (
                            <>
                                <Play className="w-4 h-4" />
                                Play All
                            </>
                        )}
                    </button>
                </div>
            </div>

            {sentences.length === 0 ? (
                <div className="p-12 text-center">
                    <p className="text-slate-500 text-lg">No conversation sentences available.</p>
                </div>
            ) : (
                <div className="p-6">
                    {/* Mobile view: Single column with alternating styles */}
                    <div className="space-y-4 md:hidden">
                        {sortedSentences.map((sentence, index) => {
                            const isRightColumn = sentence.order % 2 === 0;
                            const isPlaying = playingSentenceId === sentence.id;
                            const hasText = selectedLanguage === "arabic" 
                                ? sentence.arabic && sentence.arabic.trim().length > 0
                                : selectedLanguage === "english"
                                ? sentence.english && sentence.english.trim().length > 0
                                : (sentence.arabic && sentence.arabic.trim().length > 0) || (sentence.english && sentence.english.trim().length > 0);
                            
                            const bgColor = sentence.isTitle 
                                ? "bg-red-50 border-red-300" 
                                : isRightColumn 
                                    ? "bg-emerald-50 border-emerald-200" 
                                    : "bg-blue-50 border-blue-200";
                            
                            const playingBgColor = sentence.isTitle 
                                ? "border-red-500 border-2 bg-red-100 shadow-md ring-2 ring-red-200" 
                                : isRightColumn 
                                    ? "border-emerald-500 border-2 bg-emerald-100 shadow-md ring-2 ring-emerald-200" 
                                    : "border-blue-500 border-2 bg-blue-100 shadow-md ring-2 ring-blue-200";
                            
                            const borderColor = sentence.isTitle 
                                ? "text-red-600 border-red-200" 
                                : isRightColumn 
                                    ? "text-slate-600 border-emerald-200" 
                                    : "text-slate-600 border-blue-200";
                            
                            const buttonBgColor = isPlaying
                                ? (isRightColumn ? "bg-emerald-600 text-white" : "bg-blue-600 text-white")
                                : (isRightColumn ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-blue-100 text-blue-700 hover:bg-blue-200");
                            
                            return (
                                <div
                                    key={sentence.id}
                                    className={`${bgColor} border rounded-lg p-4 shadow-sm transition-all ${
                                        isPlaying ? playingBgColor : ""
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1">
                                            <div
                                                className={`font-medium mb-2 ${
                                                    sentence.isTitle 
                                                        ? "text-red-700 font-bold" 
                                                        : "text-slate-900"
                                                }`}
                                                dir="rtl"
                                                style={{ fontSize: getArabicFontSize(sentence.isTitle ? "text-xl" : "text-lg") }}
                                            >
                                                {sentence.arabic}
                                            </div>
                                            {showTranslations && sentence.english && (
                                                <div className={`text-sm mt-2 pt-2 border-t ${borderColor}`}>
                                                    {sentence.english}
                                                </div>
                                            )}
                                        </div>
                                        {hasText && (
                                            <button
                                                onClick={() => handlePlaySentence(sentence)}
                                                className={`flex-shrink-0 p-2 rounded-lg transition-colors ${buttonBgColor}`}
                                                title={selectedLanguage === "both" ? "Play Arabic then English" : `Play ${selectedLanguage === "arabic" ? "Arabic" : "English"} audio`}
                                            >
                                                {isPlaying ? (
                                                    <Pause className="w-4 h-4" />
                                                ) : (
                                                    <Volume2 className="w-4 h-4" />
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Desktop view: Two columns */}
                    <div className="hidden md:grid md:grid-cols-2 gap-6">
                        {/* Right Column (first in RTL) */}
                        <div className="space-y-4 md:order-2">
                            {rightColumnSentences.map((sentence, index) => {
                                const isPlaying = playingSentenceId === sentence.id;
                                const hasText = selectedLanguage === "arabic" 
                                    ? sentence.arabic && sentence.arabic.trim().length > 0
                                    : selectedLanguage === "english"
                                    ? sentence.english && sentence.english.trim().length > 0
                                    : (sentence.arabic && sentence.arabic.trim().length > 0) || (sentence.english && sentence.english.trim().length > 0);
                                
                                return (
                                    <div
                                        key={sentence.id}
                                        className={`${sentence.isTitle 
                                            ? "bg-red-50 border-red-300" 
                                            : "bg-emerald-50 border-emerald-200"
                                        } border rounded-lg p-4 shadow-sm transition-all ${
                                            isPlaying 
                                                ? `${sentence.isTitle 
                                                    ? "border-red-500 border-2 bg-red-100 shadow-md ring-2 ring-red-200" 
                                                    : "border-emerald-500 border-2 bg-emerald-100 shadow-md ring-2 ring-emerald-200"
                                                }` 
                                                : ""
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1">
                                                <div
                                                    className={`font-medium mb-2 ${
                                                        sentence.isTitle 
                                                            ? "text-red-700 font-bold" 
                                                            : "text-slate-900"
                                                    }`}
                                                    dir="rtl"
                                                    style={{ fontSize: getArabicFontSize(sentence.isTitle ? "text-xl" : "text-lg") }}
                                                >
                                                    {sentence.arabic}
                                                </div>
                                                {showTranslations && sentence.english && (
                                                    <div className={`text-sm mt-2 pt-2 border-t ${
                                                        sentence.isTitle 
                                                            ? "text-red-600 border-red-200" 
                                                            : "text-slate-600 border-emerald-200"
                                                    }`}>
                                                        {sentence.english}
                                                    </div>
                                                )}
                                            </div>
                                            {hasText && (
                                                <button
                                                    onClick={() => handlePlaySentence(sentence)}
                                                    className={`flex-shrink-0 p-2 rounded-lg transition-colors ${
                                                        isPlaying
                                                            ? "bg-emerald-600 text-white"
                                                            : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                                    }`}
                                                    title={selectedLanguage === "both" ? "Play Arabic then English" : `Play ${selectedLanguage === "arabic" ? "Arabic" : "English"} audio`}
                                                >
                                                    {isPlaying ? (
                                                        <Pause className="w-4 h-4" />
                                                    ) : (
                                                        <Volume2 className="w-4 h-4" />
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            {rightColumnSentences.length === 0 && (
                                <div className="text-center text-slate-400 py-8">
                                    <p className="text-sm">No sentences in this column</p>
                                </div>
                            )}
                        </div>

                        {/* Left Column */}
                        <div className="space-y-4 md:order-1">
                            {leftColumnSentences.map((sentence, index) => {
                                const isPlaying = playingSentenceId === sentence.id;
                                const hasText = selectedLanguage === "arabic" 
                                    ? sentence.arabic && sentence.arabic.trim().length > 0
                                    : selectedLanguage === "english"
                                    ? sentence.english && sentence.english.trim().length > 0
                                    : (sentence.arabic && sentence.arabic.trim().length > 0) || (sentence.english && sentence.english.trim().length > 0);
                                
                                return (
                                    <div
                                        key={sentence.id}
                                        className={`${sentence.isTitle 
                                            ? "bg-red-50 border-red-300" 
                                            : "bg-blue-50 border-blue-200"
                                        } border rounded-lg p-4 shadow-sm transition-all ${
                                            isPlaying 
                                                ? `${sentence.isTitle 
                                                    ? "border-red-500 border-2 bg-red-100 shadow-md ring-2 ring-red-200" 
                                                    : "border-blue-500 border-2 bg-blue-100 shadow-md ring-2 ring-blue-200"
                                                }` 
                                                : ""
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1">
                                                <div
                                                    className={`font-medium mb-2 ${
                                                        sentence.isTitle 
                                                            ? "text-red-700 font-bold" 
                                                            : "text-slate-900"
                                                    }`}
                                                    dir="rtl"
                                                    style={{ fontSize: getArabicFontSize(sentence.isTitle ? "text-xl" : "text-lg") }}
                                                >
                                                    {sentence.arabic}
                                                </div>
                                                {showTranslations && sentence.english && (
                                                    <div className={`text-sm mt-2 pt-2 border-t ${
                                                        sentence.isTitle 
                                                            ? "text-red-600 border-red-200" 
                                                            : "text-slate-600 border-blue-200"
                                                    }`}>
                                                        {sentence.english}
                                                    </div>
                                                )}
                                            </div>
                                            {hasText && (
                                                <button
                                                    onClick={() => handlePlaySentence(sentence)}
                                                    className={`flex-shrink-0 p-2 rounded-lg transition-colors ${
                                                        isPlaying
                                                            ? "bg-blue-600 text-white"
                                                            : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                                                    }`}
                                                    title={selectedLanguage === "both" ? "Play Arabic then English" : `Play ${selectedLanguage === "arabic" ? "Arabic" : "English"} audio`}
                                                >
                                                    {isPlaying ? (
                                                        <Pause className="w-4 h-4" />
                                                    ) : (
                                                        <Volume2 className="w-4 h-4" />
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            {leftColumnSentences.length === 0 && (
                                <div className="text-center text-slate-400 py-8">
                                    <p className="text-sm">No sentences in this column</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

