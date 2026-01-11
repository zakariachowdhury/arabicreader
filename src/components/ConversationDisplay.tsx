"use client";

import { useState, useEffect, useRef } from "react";
import { ConversationSentence } from "@/db/schema";
import { useArabicFontSize } from "@/contexts/ArabicFontSizeContext";
import { Eye, EyeOff, Play, Pause, Volume2, Settings } from "lucide-react";

interface ConversationDisplayProps {
    sentences: ConversationSentence[];
}

type Language = "arabic" | "english" | "both";
type Gender = "male" | "female";

// Cache for selected voices to ensure consistency
const voiceCache = new Map<string, SpeechSynthesisVoice | null>();

// Helper function to find a voice by language and gender preference
function findVoiceByGender(voices: SpeechSynthesisVoice[], lang: string, gender: Gender): SpeechSynthesisVoice | null {
    const cacheKey = `${lang}-${gender}`;
    
    // Check cache first
    if (voiceCache.has(cacheKey)) {
        const cachedVoice = voiceCache.get(cacheKey);
        if (cachedVoice) {
            // Verify the cached voice still exists in available voices
            const stillAvailable = voices.find(v => v.name === cachedVoice.name && v.lang === cachedVoice.lang);
            if (stillAvailable) {
                return stillAvailable;
            }
        }
    }

    const langPrefix = lang.split("-")[0];
    const langVoices = voices.filter(voice => voice.lang.startsWith(langPrefix));
    
    if (langVoices.length === 0) {
        voiceCache.set(cacheKey, null);
        return null;
    }

    // Common patterns for female voices (case-insensitive) - ordered by preference
    // These are common female voice names across different TTS engines
    const femalePatterns = [
        "samantha", "victoria", "karen", "fiona", "tessa", "zira", "hazel", 
        "susan", "kate", "veena", "lekha", "amara", "nora", "sara", "mariam", 
        "laila", "salma", "zeina", "hala", "nawal", "naomi", "yuna", "meijia", 
        "niamh", "sinead", "moira", "shelley", "agnes", "vicki", "samantha"
    ];
    
    // Common patterns for male voices (case-insensitive) - ordered by preference
    // These are common male voice names across different TTS engines
    const malePatterns = [
        "alex", "daniel", "tom", "fred", "mark", "paul", "david", "rishi", 
        "tarik", "maged", "amr", "hassan", "khaled", "omar", "thomas", "james",
        "lee", "jun", "hiroshi", "oskar", "bruce", "ralph", "albert", "bad"
    ];

    const patterns = gender === "female" ? femalePatterns : malePatterns;
    const oppositePatterns = gender === "female" ? malePatterns : femalePatterns;

    // First, try to find a voice matching the desired gender (exact match preferred)
    let selectedVoice: SpeechSynthesisVoice | null = null;
    
    for (const pattern of patterns) {
        const matchingVoice = langVoices.find(voice => {
            const voiceNameLower = voice.name.toLowerCase();
            // Try exact match first, then substring match
            return voiceNameLower === pattern.toLowerCase() || voiceNameLower.includes(pattern.toLowerCase());
        });
        if (matchingVoice) {
            selectedVoice = matchingVoice;
            break; // Use first match found
        }
    }

    // If no pattern match found, try to avoid opposite gender voices
    if (!selectedVoice) {
        const filteredVoices = langVoices.filter(voice => {
            const voiceNameLower = voice.name.toLowerCase();
            const isOppositeGender = oppositePatterns.some(pattern => 
                voiceNameLower === pattern.toLowerCase() || voiceNameLower.includes(pattern.toLowerCase())
            );
            return !isOppositeGender;
        });

        if (filteredVoices.length > 0) {
            // Prefer default voice if available
            selectedVoice = filteredVoices.find(v => v.default) || filteredVoices[0];
        }
    }

    // Last resort: use first available voice, but prefer default
    if (!selectedVoice) {
        selectedVoice = langVoices.find(v => v.default) || langVoices[0];
    }

    // Cache and return the selected voice
    if (selectedVoice) {
        voiceCache.set(cacheKey, selectedVoice);
        return selectedVoice;
    }

    voiceCache.set(cacheKey, null);
    return null;
}

// Helper function to play audio using Web Speech API
function playAudio(
    text: string, 
    lang: string = "en-US", 
    gender: Gender = "male", 
    selectedVoice: SpeechSynthesisVoice | null = null,
    onEnd?: () => void
) {
    if (typeof window === "undefined" || !window.speechSynthesis) {
        console.warn("Speech synthesis not supported");
        return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const speak = () => {
        // Always get fresh voices list
        const voices = window.speechSynthesis.getVoices();
        if (voices.length === 0) {
            console.warn("No voices available");
            return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = 0.9;
        utterance.pitch = gender === "male" ? 1 : 1.1; // Slightly higher pitch for female
        utterance.volume = 1;

        // Use selected voice if provided, otherwise try to find one
        let matchingVoice = selectedVoice;
        if (!matchingVoice) {
            matchingVoice = findVoiceByGender(voices, lang, gender);
        } else {
            // Verify the selected voice still exists
            const stillAvailable = voices.find(v => v.name === matchingVoice!.name && v.lang === matchingVoice!.lang);
            if (!stillAvailable) {
                // Fallback to auto-selection
                matchingVoice = findVoiceByGender(voices, lang, gender);
            } else {
                matchingVoice = stillAvailable;
            }
        }

        if (matchingVoice) {
            // Explicitly set the voice - this is critical for ensuring the right voice is used
            utterance.voice = matchingVoice;
            // Also ensure the language matches
            utterance.lang = matchingVoice.lang;
        } else {
            // Fallback: at least set the language
            console.warn(`No ${gender} voice found for ${lang}, using default`);
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

interface VoiceSelection {
    arabicMale: string | null;
    arabicFemale: string | null;
    englishMale: string | null;
    englishFemale: string | null;
}

export function ConversationDisplay({ sentences }: ConversationDisplayProps) {
    const { getArabicFontSize, getArabicFontStyle } = useArabicFontSize();
    const [showTranslations, setShowTranslations] = useState(true);
    const [selectedLanguage, setSelectedLanguage] = useState<Language>("arabic");
    const [playingSentenceId, setPlayingSentenceId] = useState<number | null>(null);
    const [isPlayingAll, setIsPlayingAll] = useState(false);
    const [currentPlayAllIndex, setCurrentPlayAllIndex] = useState(0);
    const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [showVoiceSettings, setShowVoiceSettings] = useState(false);
    const [voiceSelection, setVoiceSelection] = useState<VoiceSelection>(() => {
        // Load from localStorage if available
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("conversation-voice-selection");
            if (saved) {
                try {
                    return JSON.parse(saved);
                } catch (e) {
                    // Invalid JSON, use defaults
                }
            }
        }
        return {
            arabicMale: null,
            arabicFemale: null,
            englishMale: null,
            englishFemale: null,
        };
    });
    const playAllQueueRef = useRef<number[]>([]);
    const shouldContinuePlayingRef = useRef<boolean>(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Load available voices
    useEffect(() => {
        const loadVoices = () => {
            const voices = window.speechSynthesis?.getVoices() || [];
            if (voices.length > 0) {
                setAvailableVoices(voices);
            }
        };

        loadVoices();
        window.speechSynthesis?.addEventListener('voiceschanged', loadVoices);
        
        return () => {
            window.speechSynthesis?.removeEventListener('voiceschanged', loadVoices);
        };
    }, []);

    // Save voice selection to localStorage
    useEffect(() => {
        if (typeof window !== "undefined") {
            localStorage.setItem("conversation-voice-selection", JSON.stringify(voiceSelection));
        }
    }, [voiceSelection]);

    // Clear voice cache when component mounts to ensure fresh voice selection
    useEffect(() => {
        voiceCache.clear();
    }, []);

    // Helper function to get selected voice based on language and gender
    const getSelectedVoice = (lang: string, gender: Gender): SpeechSynthesisVoice | null => {
        const langPrefix = lang.split("-")[0];
        let voiceKey: keyof VoiceSelection;
        
        if (langPrefix === "ar") {
            voiceKey = gender === "male" ? "arabicMale" : "arabicFemale";
        } else {
            voiceKey = gender === "male" ? "englishMale" : "englishFemale";
        }

        const selectedVoiceName = voiceSelection[voiceKey];
        if (!selectedVoiceName) {
            return null; // Use auto-selection
        }

        // Find the voice by name
        return availableVoices.find(v => v.name === selectedVoiceName && v.lang.startsWith(langPrefix)) || null;
    };

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

        // Determine gender based on column: right column (even order) = male, left column (odd order) = female
        const isRightColumn = sentence.order % 2 === 0;
        const gender: Gender = isRightColumn ? "male" : "female";
        const arabicVoice = getSelectedVoice("ar-SA", gender);
        const englishVoice = getSelectedVoice("en-US", gender);

        if (selectedLanguage === "both") {
            // Play Arabic first, then English
            const arabicText = sentence.arabic || "";
            const englishText = sentence.english || "";

            if (arabicText.trim().length > 0) {
                // Play Arabic first
                playAudio(arabicText, "ar-SA", gender, arabicVoice, () => {
                    // Check if we should continue
                    if (!shouldContinuePlayingRef.current) {
                        return;
                    }

                    // After Arabic finishes, play English
                    if (englishText.trim().length > 0) {
                        playAudio(englishText, "en-US", gender, englishVoice, () => {
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
                playAudio(englishText, "en-US", gender, englishVoice, () => {
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
            const selectedVoice = getSelectedVoice(lang, gender);

            playAudio(text, lang, gender, selectedVoice, () => {
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

        // Determine gender based on column: right column (even order) = male, left column (odd order) = female
        const isRightColumn = sentence.order % 2 === 0;
        const gender: Gender = isRightColumn ? "male" : "female";
        const arabicVoice = getSelectedVoice("ar-SA", gender);
        const englishVoice = getSelectedVoice("en-US", gender);

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
                playAudio(arabicText, "ar-SA", gender, arabicVoice, () => {
                    // After Arabic finishes, play English if available
                    if (englishText.trim().length > 0) {
                        playAudio(englishText, "en-US", gender, englishVoice, () => {
                            setPlayingSentenceId(null);
                        });
                    } else {
                        setPlayingSentenceId(null);
                    }
                });
            } else if (englishText.trim().length > 0) {
                // Only English available
                playAudio(englishText, "en-US", gender, englishVoice, () => {
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
            const selectedVoice = getSelectedVoice(lang, gender);
            setPlayingSentenceId(sentence.id);

            playAudio(text, lang, gender, selectedVoice, () => {
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

                    <button
                        onClick={() => setShowVoiceSettings(!showVoiceSettings)}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                        title="Voice settings"
                    >
                        <Settings className="w-4 h-4" />
                        Voices
                    </button>
                </div>

                {/* Voice Selection Settings */}
                {showVoiceSettings && (
                    <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <h3 className="text-sm font-semibold text-slate-900 mb-3">Voice Selection</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Arabic Voices */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-medium text-slate-700 uppercase tracking-wide">Arabic Voices</h4>
                                {(() => {
                                    const arabicVoices = availableVoices.filter(v => {
                                        const lang = v.lang.toLowerCase();
                                        return lang.startsWith("ar");
                                    });
                                    
                                    return (
                                        <>
                                            {arabicVoices.length === 0 && (
                                                <p className="text-xs text-amber-600 mb-2">
                                                    No Arabic voices found. Your system may only have one Arabic voice, or you may need to install additional Arabic TTS voices.
                                                </p>
                                            )}
                                            {arabicVoices.length === 1 && (
                                                <p className="text-xs text-slate-500 mb-2">
                                                    Only one Arabic voice is available on your system. You can install additional Arabic voices through your system settings if needed.
                                                </p>
                                            )}
                                            <div className="space-y-2">
                                                <div>
                                                    <label className="block text-xs font-medium text-slate-600 mb-1">Male Voice (Green Column)</label>
                                                    <select
                                                        value={voiceSelection.arabicMale || ""}
                                                        onChange={(e) => setVoiceSelection({ ...voiceSelection, arabicMale: e.target.value || null })}
                                                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                                                    >
                                                        <option value="">Auto-select</option>
                                                        {arabicVoices.map(voice => (
                                                            <option key={`${voice.name}-${voice.lang}`} value={voice.name}>
                                                                {voice.name} {voice.lang !== "ar-SA" ? `(${voice.lang})` : ""} {voice.default ? "(default)" : ""}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-slate-600 mb-1">Female Voice (Blue Column)</label>
                                                    <select
                                                        value={voiceSelection.arabicFemale || ""}
                                                        onChange={(e) => setVoiceSelection({ ...voiceSelection, arabicFemale: e.target.value || null })}
                                                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                                                    >
                                                        <option value="">Auto-select</option>
                                                        {arabicVoices.map(voice => (
                                                            <option key={`${voice.name}-${voice.lang}`} value={voice.name}>
                                                                {voice.name} {voice.lang !== "ar-SA" ? `(${voice.lang})` : ""} {voice.default ? "(default)" : ""}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>

                            {/* English Voices */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-medium text-slate-700 uppercase tracking-wide">English Voices</h4>
                                <div className="space-y-2">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-1">Male Voice (Green Column)</label>
                                        <select
                                            value={voiceSelection.englishMale || ""}
                                            onChange={(e) => setVoiceSelection({ ...voiceSelection, englishMale: e.target.value || null })}
                                            className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                                        >
                                            <option value="">Auto-select</option>
                                            {availableVoices
                                                .filter(v => v.lang.startsWith("en"))
                                                .map(voice => (
                                                    <option key={voice.name} value={voice.name}>
                                                        {voice.name} {voice.default ? "(default)" : ""}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-1">Female Voice (Blue Column)</label>
                                        <select
                                            value={voiceSelection.englishFemale || ""}
                                            onChange={(e) => setVoiceSelection({ ...voiceSelection, englishFemale: e.target.value || null })}
                                            className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                                        >
                                            <option value="">Auto-select</option>
                                            {availableVoices
                                                .filter(v => v.lang.startsWith("en"))
                                                .map(voice => (
                                                    <option key={voice.name} value={voice.name}>
                                                        {voice.name} {voice.default ? "(default)" : ""}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <p className="mt-3 text-xs text-slate-500">
                            Select voices for each language and gender. Leave as &quot;Auto-select&quot; to use automatic voice selection.
                        </p>
                    </div>
                )}
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
                                                style={{ fontSize: getArabicFontSize(sentence.isTitle ? "text-xl" : "text-lg"), ...getArabicFontStyle() }}
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
                                                    style={{ fontSize: getArabicFontSize(sentence.isTitle ? "text-xl" : "text-lg"), ...getArabicFontStyle() }}
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
                                                    style={{ fontSize: getArabicFontSize(sentence.isTitle ? "text-xl" : "text-lg"), ...getArabicFontStyle() }}
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

