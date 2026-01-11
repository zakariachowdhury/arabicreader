"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import { VocabularyWord, UserProgress } from "@/db/schema";
import { updateUserProgress } from "@/app/actions";
import { BookOpen, ChevronLeft, ChevronRight, RotateCcw, CheckCircle2, XCircle, Eye, Volume2, VolumeX, Volume1, VolumeOff, ArrowRight } from "lucide-react";
import { useArabicFontSize } from "@/contexts/ArabicFontSizeContext";
import { toast } from "@/lib/toast";

type Mode = "learn" | "practice" | "test";

interface VocabularyFlashcardsProps {
    words: VocabularyWord[];
    initialProgress: Record<number, UserProgress>;
    lessonId: number;
    initialMode?: Mode;
}

// Helper function to generate multiple choice options
function generateMultipleChoiceOptions(
    correctAnswer: string,
    allWords: VocabularyWord[],
    currentWordId: number
): string[] {
    // Get all other words' English translations as potential distractors
    const distractors = allWords
        .filter(word => word.id !== currentWordId)
        .map(word => word.english);

    // Shuffle and pick 3 random distractors
    const shuffled = [...distractors].sort(() => Math.random() - 0.5);
    const selectedDistractors = shuffled.slice(0, 3);

    // Combine correct answer with distractors and shuffle
    const options = [correctAnswer, ...selectedDistractors];
    return options.sort(() => Math.random() - 0.5);
}

export function VocabularyFlashcards({ words, initialProgress, lessonId, initialMode = "learn" }: VocabularyFlashcardsProps) {
    const { getArabicFontSize, getEnglishFontSize, getArabicFontStyle } = useArabicFontSize();
    const [mode, setMode] = useState<Mode>(initialMode);
    // Separate indices for each mode
    const [learnIndex, setLearnIndex] = useState(0);
    const [practiceIndex, setPracticeIndex] = useState(0);
    const [testIndex, setTestIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [testAnswers, setTestAnswers] = useState<Record<number, string>>({});
    const [testOptions, setTestOptions] = useState<Record<number, string[]>>({});
    const [testResults, setTestResults] = useState<Record<number, boolean>>({});
    const [testSubmitted, setTestSubmitted] = useState(false);
    const [answeredWords, setAnsweredWords] = useState<Set<number>>(new Set());
    const [progress, setProgress] = useState(initialProgress);
    // Practice mode tracking
    const [practiceResults, setPracticeResults] = useState<Record<number, boolean>>({});
    const [practiceCompleted, setPracticeCompleted] = useState(false);
    const [practicedWords, setPracticedWords] = useState<Set<number>>(new Set());
    const [showSummary, setShowSummary] = useState(false);
    const [summaryDismissed, setSummaryDismissed] = useState(false);
    const [, startTransition] = useTransition();
    const [speaking, setSpeaking] = useState<{ arabic: boolean; english: boolean }>({ arabic: false, english: false });
    const autoAdvanceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    // Shuffled words for test mode (randomized once when entering test mode)
    const [shuffledTestWords, setShuffledTestWords] = useState<VocabularyWord[]>([]);
    
    // Sound effects state with localStorage persistence
    // Initialize to true to match server render, then sync with localStorage in useEffect
    const [soundEnabled, setSoundEnabled] = useState(true);
    
    // Sync sound state from localStorage after mount (client-side only)
    useEffect(() => {
        const saved = localStorage.getItem("test-sound-enabled");
        if (saved !== null) {
            setSoundEnabled(saved === "true");
        }
    }, []);

    // Get current words array based on mode (shuffled for test, original for others)
    const currentWords = mode === "test" && shuffledTestWords.length > 0 ? shuffledTestWords : words;
    
    // Get current index based on mode
    const getCurrentIndex = () => {
        switch (mode) {
            case "learn":
                return learnIndex;
            case "practice":
                return practiceIndex;
            case "test":
                return testIndex;
            default:
                return 0;
        }
    };
    
    const setCurrentIndex = (index: number) => {
        switch (mode) {
            case "learn":
                setLearnIndex(index);
                break;
            case "practice":
                setPracticeIndex(index);
                break;
            case "test":
                setTestIndex(index);
                break;
        }
    };
    
    const currentIndex = getCurrentIndex();
    const currentWord = currentWords[currentIndex];
    const currentProgress = currentWord ? progress[currentWord.id] : null;

    // Shuffle words when entering test mode for the first time
    useEffect(() => {
        if (mode === "test" && shuffledTestWords.length === 0 && words.length > 0) {
            // Create a shuffled copy of the words array
            const shuffled = [...words].sort(() => Math.random() - 0.5);
            setShuffledTestWords(shuffled);
            setTestIndex(0); // Reset to first word in shuffled order
        }
    }, [mode, words, shuffledTestWords.length]);

    // Check for wordId in URL query parameters to jump to specific word
    useEffect(() => {
        if (typeof window !== "undefined") {
            const urlParams = new URLSearchParams(window.location.search);
            const wordIdParam = urlParams.get("wordId");
            if (wordIdParam) {
                const wordId = parseInt(wordIdParam);
                if (!isNaN(wordId)) {
                    const wordIndex = currentWords.findIndex(w => w.id === wordId);
                    if (wordIndex !== -1) {
                        setCurrentIndex(wordIndex);
                        // Clean up URL by removing the query parameter
                        const newUrl = window.location.pathname;
                        window.history.replaceState({}, "", newUrl);
                    }
                }
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentWords]);

    // Generate multiple choice options when entering test mode
    useEffect(() => {
        if (mode === "test" && currentWords.length > 0 && Object.keys(testOptions).length === 0) {
            const options: Record<number, string[]> = {};
            currentWords.forEach(word => {
                options[word.id] = generateMultipleChoiceOptions(word.english, currentWords, word.id);
            });
            setTestOptions(options);
        }
    }, [mode, currentWords, testOptions]);

    useEffect(() => {
        // Mark word as seen when viewing in learn or practice mode
        if (currentWord && (mode === "learn" || mode === "practice") && !testSubmitted) {
            if (!currentProgress?.seen) {
                const wordId = currentWord.id;
                startTransition(async () => {
                    try {
                        await updateUserProgress(wordId, { seen: true });
                        setProgress(prev => ({
                            ...prev,
                            [wordId]: {
                                ...prev[wordId],
                                id: prev[wordId]?.id || 0,
                                userId: "",
                                wordId: wordId,
                                seen: true,
                                correctCount: prev[wordId]?.correctCount || 0,
                                incorrectCount: prev[wordId]?.incorrectCount || 0,
                                lastReviewedAt: new Date(),
                                createdAt: prev[wordId]?.createdAt || new Date(),
                                updatedAt: new Date(),
                            } as UserProgress,
                        }));
                    } catch (error) {
                        console.error("Failed to update progress:", error);
                    }
                });
            }
        }
    }, [currentWord, currentProgress?.seen, mode, testSubmitted, startTransition]);

    const handleNext = () => {
        // Clear auto-advance timeout if navigating manually
        if (autoAdvanceTimeoutRef.current) {
            clearTimeout(autoAdvanceTimeoutRef.current);
            autoAdvanceTimeoutRef.current = null;
        }
        
        if (currentIndex < currentWords.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setIsFlipped(false);
            // Stop any speaking when moving to next word
            window.speechSynthesis.cancel();
            setSpeaking({ arabic: false, english: false });
        }
    };

    const handlePrevious = () => {
        // Clear auto-advance timeout if navigating manually
        if (autoAdvanceTimeoutRef.current) {
            clearTimeout(autoAdvanceTimeoutRef.current);
            autoAdvanceTimeoutRef.current = null;
        }
        
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
            setIsFlipped(false);
            // Stop any speaking when moving to previous word
            window.speechSynthesis.cancel();
            setSpeaking({ arabic: false, english: false });
        }
    };

    const handleFlip = () => {
        setIsFlipped(!isFlipped);
    };

    const handleTestAnswer = (wordId: number, answer: string) => {
        if (answeredWords.has(wordId)) return; // Prevent editing once answered
        
        // Clear any existing timeout
        if (autoAdvanceTimeoutRef.current) {
            clearTimeout(autoAdvanceTimeoutRef.current);
        }
        
        setTestAnswers(prev => ({ ...prev, [wordId]: answer }));
        setAnsweredWords(prev => new Set(prev).add(wordId));
        
        // Check if answer is correct
        const word = currentWords.find(w => w.id === wordId);
        const correct = word && answer === word.english;
        
        // Play sound effect
        if (correct) {
            playCorrectSound();
        } else {
            playIncorrectSound();
        }
        
        // Update results immediately
        setTestResults(prev => ({ ...prev, [wordId]: correct || false }));
        
        // Update progress
        if (word) {
            startTransition(async () => {
                try {
                    await updateUserProgress(word.id, {
                        seen: true,
                        correct: correct || false,
                        incorrect: !correct,
                    });
                } catch (error) {
                    console.error("Failed to update progress:", error);
                }
            });
        }
        
        // Auto-advance to next word after 3 seconds
        autoAdvanceTimeoutRef.current = setTimeout(() => {
            setTestIndex(prevIndex => {
                if (prevIndex < currentWords.length - 1) {
                    return prevIndex + 1;
                } else {
                    // All questions answered, show results
                    setTestSubmitted(true);
                    return prevIndex;
                }
            });
        }, 3000);
    };

    const handleTestReset = () => {
        // Clear auto-advance timeout
        if (autoAdvanceTimeoutRef.current) {
            clearTimeout(autoAdvanceTimeoutRef.current);
            autoAdvanceTimeoutRef.current = null;
        }
        
        setTestAnswers({});
        setTestOptions({});
        setTestResults({});
        setTestSubmitted(false);
        setTestIndex(0);
        setAnsweredWords(new Set());
        // Reshuffle words for a new test
        const shuffled = [...words].sort(() => Math.random() - 0.5);
        setShuffledTestWords(shuffled);
    };

    const handlePracticeAnswer = (correct: boolean) => {
        if (!currentWord) return;

        // Track practice result
        setPracticeResults(prev => ({ ...prev, [currentWord.id]: correct }));
        const newPracticedWords = new Set(practicedWords);
        newPracticedWords.add(currentWord.id);
        setPracticedWords(newPracticedWords);

        // Check if all words have been practiced
        const allWordsPracticed = newPracticedWords.size === words.length;

        startTransition(async () => {
            try {
                await updateUserProgress(currentWord.id, {
                    seen: true,
                    correct: correct,
                    incorrect: !correct,
                });
                setProgress(prev => ({
                    ...prev,
                    [currentWord.id]: {
                        ...prev[currentWord.id],
                        id: prev[currentWord.id]?.id || 0,
                        userId: "",
                        wordId: currentWord.id,
                        seen: true,
                        correctCount: (prev[currentWord.id]?.correctCount || 0) + (correct ? 1 : 0),
                        incorrectCount: (prev[currentWord.id]?.incorrectCount || 0) + (!correct ? 1 : 0),
                        lastReviewedAt: new Date(),
                        createdAt: prev[currentWord.id]?.createdAt || new Date(),
                        updatedAt: new Date(),
                    } as UserProgress,
                }));
            } catch (error) {
                console.error("Failed to update progress:", error);
            }
        });

        // If all words have been practiced, automatically show summary
        if (allWordsPracticed) {
            setTimeout(() => {
                setPracticeCompleted(true);
                setShowSummary(true);
                // Scroll to top to show summary
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }, 300);
        }
    };

    // Check if practice is complete
    useEffect(() => {
        if (mode === "practice" && words.length > 0) {
            const allPracticed = words.every(word => practicedWords.has(word.id));
            if (allPracticed && !practiceCompleted) {
                setPracticeCompleted(true);
            }
        }
    }, [mode, practicedWords, words, practiceCompleted]);

    // Calculate saved progress status (moved before useEffect to avoid conditional hook)
    const hasAnySavedProgress = words.some(word => {
        const wordProgress = progress[word.id];
        return wordProgress && (wordProgress.correctCount > 0 || wordProgress.incorrectCount > 0);
    });

    // Auto-show summary when entering practice mode if there's saved progress
    // Only auto-show if user hasn't explicitly dismissed it
    useEffect(() => {
        if (mode === "practice" && hasAnySavedProgress && !showSummary && !summaryDismissed && Object.keys(practiceResults).length === 0) {
            // Show summary first if user has saved progress
            setShowSummary(true);
            // Scroll to top to show summary
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [mode, hasAnySavedProgress, showSummary, summaryDismissed, practiceResults, words, progress]);

    // Reset practice tracking when entering practice mode fresh (only if explicitly reset)
    // Don't auto-reset when switching modes - keep results visible

    const handlePracticeReset = () => {
        setPracticeResults({});
        setPracticeCompleted(false);
        setPracticedWords(new Set());
        setPracticeIndex(0);
        setIsFlipped(false);
        setShowSummary(false);
        setSummaryDismissed(true); // Mark summary as dismissed to prevent auto-show
    };

    const handleJumpToWord = (wordId: number) => {
        const wordIndex = words.findIndex(w => w.id === wordId);
        if (wordIndex !== -1) {
            // Ensure we're in practice mode
            if (mode !== "practice") {
                setMode("practice");
            }
            // Hide summary first, then set index
            setShowSummary(false);
            setSummaryDismissed(true);
            // Set the practice index to jump to the word
            setPracticeIndex(wordIndex);
            setIsFlipped(false);
            // Remove from practiced words so they can practice it again
            setPracticedWords(prev => {
                const newSet = new Set(prev);
                newSet.delete(wordId);
                return newSet;
            });
            // Remove the result so it can be updated when they answer again
            setPracticeResults(prev => {
                const newResults = { ...prev };
                delete newResults[wordId];
                return newResults;
            });
            setPracticeCompleted(false);
            // Scroll to top after a brief delay to ensure state updates
            setTimeout(() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }, 0);
        }
    };

    // Sound effect functions
    const playCorrectSound = () => {
        if (!soundEnabled) return;
        
        try {
            const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            const audioContext = new AudioContextClass();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // Pleasant ascending tone for correct answer
            oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
            oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
            oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
            
            oscillator.type = "sine";
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (error) {
            console.error("Failed to play correct sound:", error);
        }
    };
    
    const playIncorrectSound = () => {
        if (!soundEnabled) return;
        
        try {
            const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            const audioContext = new AudioContextClass();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // Lower, descending tone for incorrect answer
            oscillator.frequency.setValueAtTime(392.00, audioContext.currentTime); // G4
            oscillator.frequency.setValueAtTime(293.66, audioContext.currentTime + 0.15); // D4
            
            oscillator.type = "sawtooth";
            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (error) {
            console.error("Failed to play incorrect sound:", error);
        }
    };
    
    const toggleSound = () => {
        const newValue = !soundEnabled;
        setSoundEnabled(newValue);
        if (typeof window !== "undefined") {
            localStorage.setItem("test-sound-enabled", String(newValue));
        }
    };

    // Text-to-speech function
    const speakText = (text: string, lang: "ar" | "en", type: "arabic" | "english") => {
        if (!("speechSynthesis" in window)) {
            toast.warning("Text-to-speech is not supported in your browser.");
            return;
        }

        // Stop any currently speaking
        window.speechSynthesis.cancel();
        setSpeaking({ arabic: false, english: false });

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang === "ar" ? "ar-SA" : "en-US";
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;

        // Try to get voices immediately
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
            const preferredVoice = voices.find(
                voice => lang === "ar" 
                    ? voice.lang.startsWith("ar") 
                    : voice.lang.startsWith("en")
            );
            if (preferredVoice) {
                utterance.voice = preferredVoice;
            }
        }

        setSpeaking(prev => ({ ...prev, [type]: true }));

        utterance.onend = () => {
            setSpeaking(prev => ({ ...prev, [type]: false }));
        };

        utterance.onerror = () => {
            setSpeaking(prev => ({ ...prev, [type]: false }));
        };

        window.speechSynthesis.speak(utterance);
    };

    // Auto-play Arabic word sound when word changes (all modes)
    useEffect(() => {
        if (currentWord && soundEnabled) {
            // Don't auto-play if summary is showing in practice mode
            if (mode === "practice" && showSummary) {
                return;
            }
            
            // In test mode, only auto-play if the word hasn't been answered yet
            if (mode === "test" && !testSubmitted) {
                if (!answeredWords.has(currentWord.id)) {
                    // Small delay to ensure the UI has updated
                    const timer = setTimeout(() => {
                        speakText(currentWord.arabic, "ar", "arabic");
                    }, 300);
                    
                    return () => clearTimeout(timer);
                }
            } 
            // In learn and practice modes, always auto-play
            else if (mode === "learn" || mode === "practice") {
                // Small delay to ensure the UI has updated
                const timer = setTimeout(() => {
                    speakText(currentWord.arabic, "ar", "arabic");
                }, 300);
                
                return () => clearTimeout(timer);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentWord?.id, mode, testSubmitted, soundEnabled, showSummary]);

    // Load voices when component mounts
    useEffect(() => {
        if ("speechSynthesis" in window) {
            // Some browsers load voices asynchronously
            const loadVoices = () => {
                window.speechSynthesis.getVoices();
            };
            loadVoices();
            if (window.speechSynthesis.onvoiceschanged !== undefined) {
                window.speechSynthesis.onvoiceschanged = loadVoices;
            }
        }
    }, []);

    // Cleanup: stop speech and clear timeouts when component unmounts or mode changes
    useEffect(() => {
        return () => {
            if ("speechSynthesis" in window) {
                window.speechSynthesis.cancel();
            }
            if (autoAdvanceTimeoutRef.current) {
                clearTimeout(autoAdvanceTimeoutRef.current);
            }
        };
    }, [mode]);

    if (words.length === 0) {
        return (
            <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-500 text-lg">No vocabulary words available.</p>
            </div>
        );
    }

    const correctCount = Object.values(testResults).filter(r => r).length;

    // Helper function to determine word status from saved progress
    const getWordStatusFromProgress = (wordId: number): boolean | null => {
        const wordProgress = progress[wordId];
        if (!wordProgress) return null;
        
        // If word has been practiced (has correct or incorrect counts)
        if (wordProgress.correctCount > 0 || wordProgress.incorrectCount > 0) {
            // Consider word as "correct" if correctCount >= incorrectCount, otherwise "incorrect"
            return wordProgress.correctCount >= wordProgress.incorrectCount;
        }
        return null;
    };

    // Merge current session results with saved progress
    const getAllWordResults = (): Record<number, boolean> => {
        const results: Record<number, boolean> = {};
        
        // First, add current session results
        Object.assign(results, practiceResults);
        
        // Then, add saved progress for words not in current session
        words.forEach(word => {
            if (!(word.id in results)) {
                const status = getWordStatusFromProgress(word.id);
                if (status !== null) {
                    results[word.id] = status;
                }
            }
        });
        
        return results;
    };

    const allWordResults = getAllWordResults();

    return (
        <div className="max-w-4xl mx-auto">
            {/* Mode Selector */}
            <div className="mb-8">
                <div className="inline-flex gap-1 p-1 bg-slate-100 rounded-xl mx-auto shadow-sm">
                    <button
                        onClick={() => {
                            setMode("learn");
                            setIsFlipped(false);
                            setTestSubmitted(false);
                            // Index is already tracked separately, no need to reset
                        }}
                        className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 ${
                            mode === "learn"
                                ? "bg-white text-blue-600 shadow-md"
                                : "text-slate-600 hover:text-slate-900"
                        }`}
                    >
                        Learn
                    </button>
                    <button
                        onClick={() => {
                            setMode("practice");
                            setIsFlipped(false);
                            setTestSubmitted(false);
                            // Reset summary dismissed flag when switching to practice mode
                            // so summary can auto-show if there's saved progress
                            setSummaryDismissed(false);
                            // Don't reset practice results - keep them visible so user can view summary
                            // Only reset if explicitly requested via Reset button
                            // Index is already tracked separately, no need to reset
                        }}
                        className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 ${
                            mode === "practice"
                                ? "bg-white text-blue-600 shadow-md"
                                : "text-slate-600 hover:text-slate-900"
                        }`}
                    >
                        Practice
                    </button>
                    <button
                        onClick={() => {
                            setMode("test");
                            setIsFlipped(false);
                            // If starting a fresh test (no answers yet), shuffle words and reset
                            if (Object.keys(testAnswers).length === 0) {
                                setTestAnswers({});
                                setTestOptions({});
                                setTestResults({});
                                setAnsweredWords(new Set());
                                setTestSubmitted(false);
                                // Shuffle words every time entering test mode fresh
                                if (words.length > 0) {
                                    const shuffled = [...words].sort(() => Math.random() - 0.5);
                                    setShuffledTestWords(shuffled);
                                }
                                setTestIndex(0);
                            } else {
                                // If test is in progress, just restore the position (already tracked separately)
                                setTestSubmitted(false);
                            }
                        }}
                        className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 ${
                            mode === "test"
                                ? "bg-white text-blue-600 shadow-md"
                                : "text-slate-600 hover:text-slate-900"
                        }`}
                    >
                        Test
                    </button>
                </div>
            </div>

            {/* Progress Stats */}
            <div className="mb-8">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex-1">
                            <p className="text-sm font-medium text-slate-600 mb-1">Progress</p>
                            <p className="text-2xl font-bold text-slate-900">
                                {mode === "test" ? "Question" : "Word"} <span className="text-blue-600">{currentIndex + 1}</span> of {currentWords.length}
                            </p>
                        </div>
                        {(currentProgress || mode === "test") && (
                            <div className="text-right">
                                <p className="text-sm font-medium text-slate-600 mb-1">Score</p>
                                <div className="flex items-center gap-4">
                                    {mode === "test" ? (
                                        <>
                                            <div className="flex items-center gap-1.5">
                                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                                <span className="text-lg font-bold text-emerald-600">
                                                    {Object.values(testResults).filter(r => r === true).length}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <XCircle className="w-4 h-4 text-red-600" />
                                                <span className="text-lg font-bold text-red-600">
                                                    {Object.values(testResults).filter(r => r === false).length}
                                                </span>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-1.5">
                                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                                <span className="text-lg font-bold text-emerald-600">
                                                    {currentProgress?.correctCount || 0}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <XCircle className="w-4 h-4 text-red-600" />
                                                <span className="text-lg font-bold text-red-600">
                                                    {currentProgress?.incorrectCount || 0}
                                                </span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-300 ease-out"
                            style={{ width: `${((currentIndex + 1) / currentWords.length) * 100}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Learn Mode */}
            {mode === "learn" && currentWord && (
                <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-12 min-h-[400px] flex flex-col items-center justify-center relative">
                    <div className="absolute top-4 right-4">
                        <button
                            onClick={toggleSound}
                            className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                            title={soundEnabled ? "Mute sound effects" : "Enable sound effects"}
                        >
                            {soundEnabled ? (
                                <Volume1 className="w-5 h-5" />
                            ) : (
                                <VolumeOff className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                    <div className="text-center space-y-6 w-full">
                        <div>
                            <div className="flex items-center justify-center gap-3 mb-2">
                                <p className="text-sm text-slate-500">Arabic</p>
                                <button
                                    onClick={() => speakText(currentWord.arabic, "ar", "arabic")}
                                    className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                    title="Listen to Arabic pronunciation"
                                >
                                    {speaking.arabic ? (
                                        <VolumeX className="w-5 h-5" />
                                    ) : (
                                        <Volume2 className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                            <p className="font-bold text-slate-900" dir="rtl" style={{ fontSize: getArabicFontSize("text-4xl"), ...getArabicFontStyle() }}>
                                {currentWord.arabic}
                            </p>
                        </div>
                        <div className="border-t border-slate-200 pt-6">
                            <div className="flex items-center justify-center gap-3 mb-2">
                                <p className="text-sm text-slate-500">English</p>
                                <button
                                    onClick={() => speakText(currentWord.english, "en", "english")}
                                    className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                    title="Listen to English pronunciation"
                                >
                                    {speaking.english ? (
                                        <VolumeX className="w-5 h-5" />
                                    ) : (
                                        <Volume2 className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                            <p className="font-semibold text-slate-700" style={{ fontSize: getEnglishFontSize("text-3xl") }}>
                                {currentWord.english}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Practice Mode */}
            {mode === "practice" && !showSummary && currentWord && (
                <div className="flashcard-container flex flex-col items-center justify-center relative">
                    <div className="absolute top-4 right-4 z-10">
                        <button
                            onClick={toggleSound}
                            className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                            title={soundEnabled ? "Mute sound effects" : "Enable sound effects"}
                        >
                            {soundEnabled ? (
                                <Volume1 className="w-5 h-5" />
                            ) : (
                                <VolumeOff className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                    <div
                        className={`flashcard ${isFlipped ? "flipped" : ""} cursor-pointer`}
                        onClick={handleFlip}
                    >
                        {/* Front of card - Arabic */}
                        <div className="flashcard-front text-center space-y-6 w-full">
                            <div>
                                <div className="flex items-center justify-center gap-3 mb-2">
                                    <p className="text-sm text-slate-500 font-medium">Arabic</p>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            speakText(currentWord.arabic, "ar", "arabic");
                                        }}
                                        className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                        title="Listen to Arabic pronunciation"
                                    >
                                        {speaking.arabic ? (
                                            <VolumeX className="w-5 h-5" />
                                        ) : (
                                            <Volume2 className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                                <p className="font-bold text-slate-900" dir="rtl" style={{ fontSize: getArabicFontSize("text-4xl"), ...getArabicFontStyle() }}>
                                    {currentWord.arabic}
                                </p>
                                <p className="text-sm text-slate-400 mt-4">Click to reveal answer</p>
                            </div>
                        </div>

                        {/* Back of card - English */}
                        <div className="flashcard-back text-center space-y-6 w-full">
                            <div>
                                <div className="flex items-center justify-center gap-3 mb-2">
                                    <p className="text-sm text-slate-500 font-medium">English</p>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            speakText(currentWord.english, "en", "english");
                                        }}
                                        className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                        title="Listen to English pronunciation"
                                    >
                                        {speaking.english ? (
                                            <VolumeX className="w-5 h-5" />
                                        ) : (
                                            <Volume2 className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                                <p className="font-semibold text-slate-700" style={{ fontSize: getEnglishFontSize("text-3xl") }}>
                                    {currentWord.english}
                                </p>
                                <div className="flex gap-4 justify-center mt-6">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handlePracticeAnswer(true);
                                            handleNext();
                                            setIsFlipped(false);
                                        }}
                                        className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-md hover:shadow-lg"
                                    >
                                        <CheckCircle2 className="w-5 h-5" />
                                        Correct
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handlePracticeAnswer(false);
                                            handleNext();
                                            setIsFlipped(false);
                                        }}
                                        className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 shadow-md hover:shadow-lg"
                                    >
                                        <XCircle className="w-5 h-5" />
                                        Incorrect
                                    </button>
                                </div>
                                <p className="text-sm text-slate-400 mt-4">Click card to flip back</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Test Mode */}
            {mode === "test" && (
                <div className="space-y-6">
                    {!testSubmitted ? (
                        <>
                            {currentWord && (() => {
                                const options = testOptions[currentWord.id] || [];
                                const isAnswered = answeredWords.has(currentWord.id);
                                const isCorrect = testResults[currentWord.id] === true;
                                
                                return (
                                    <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 relative">
                                        <div className="absolute top-4 right-4">
                                            <button
                                                onClick={toggleSound}
                                                className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                                title={soundEnabled ? "Mute sound effects" : "Enable sound effects"}
                                            >
                                                {soundEnabled ? (
                                                    <Volume1 className="w-5 h-5" />
                                                ) : (
                                                    <VolumeOff className="w-5 h-5" />
                                                )}
                                            </button>
                                        </div>
                                        <div className="mb-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-sm text-slate-500">Question {currentIndex + 1} of {currentWords.length}</p>
                                            </div>
                                            <div className="flex flex-col items-center mb-6">
                                                <div className="flex items-center justify-center gap-3 mb-4">
                                                    <p className="text-sm text-slate-500">Arabic</p>
                                                    <button
                                                        onClick={() => speakText(currentWord.arabic, "ar", "arabic")}
                                                        className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                                        title="Listen to Arabic pronunciation"
                                                    >
                                                        {speaking.arabic ? (
                                                            <VolumeX className="w-5 h-5" />
                                                        ) : (
                                                            <Volume2 className="w-5 h-5" />
                                                        )}
                                                    </button>
                                                </div>
                                                <p className="font-bold text-slate-900" dir="rtl" style={{ fontSize: getArabicFontSize("text-3xl"), ...getArabicFontStyle() }}>
                                                    {currentWord.arabic}
                                                </p>
                                            </div>
                                            <p className="text-sm text-slate-600 mb-4">Select the correct English translation:</p>
                                            <div className="space-y-3">
                                                {options.map((option, optionIndex) => {
                                                    const isSelected = testAnswers[currentWord.id] === option;
                                                    const isCorrectOption = option === currentWord.english;
                                                    
                                                    // Determine styling based on answer state
                                                    let borderColor = "border-slate-200";
                                                    let bgColor = "";
                                                    
                                                    if (isAnswered) {
                                                        if (isSelected && isCorrectOption) {
                                                            borderColor = "border-emerald-500";
                                                            bgColor = "bg-emerald-50";
                                                        } else if (isSelected && !isCorrectOption) {
                                                            borderColor = "border-red-500";
                                                            bgColor = "bg-red-50";
                                                        } else if (!isSelected && isCorrectOption) {
                                                            borderColor = "border-emerald-300";
                                                            bgColor = "bg-emerald-50";
                                                        }
                                                    } else if (isSelected) {
                                                        borderColor = "border-blue-500";
                                                        bgColor = "bg-blue-50";
                                                    }
                                                    
                                                    return (
                                                        <label
                                                            key={optionIndex}
                                                            className={`flex items-center p-4 border-2 rounded-lg transition-all ${
                                                                isAnswered 
                                                                    ? "cursor-default" 
                                                                    : "cursor-pointer hover:border-slate-300 hover:bg-slate-50"
                                                            } ${borderColor} ${bgColor}`}
                                                        >
                                                            <input
                                                                type="radio"
                                                                name={`word-${currentWord.id}`}
                                                                value={option}
                                                                checked={isSelected}
                                                                onChange={(e) => handleTestAnswer(currentWord.id, e.target.value)}
                                                                disabled={isAnswered}
                                                                className="w-5 h-5 text-blue-600 focus:ring-blue-500 focus:ring-2 disabled:cursor-not-allowed"
                                                            />
                                                            <span className="ml-3 text-lg text-slate-700 flex items-center gap-2">
                                                                {option}
                                                                {isAnswered && isCorrectOption && isSelected && (
                                                                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                                                )}
                                                                {isAnswered && !isCorrectOption && isSelected && (
                                                                    <XCircle className="w-5 h-5 text-red-600" />
                                                                )}
                                                            </span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                            {isAnswered && (
                                                <div className={`mt-4 p-4 rounded-lg flex items-center gap-2 ${
                                                    isCorrect ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                                                }`}>
                                                    {isCorrect ? (
                                                        <>
                                                            <CheckCircle2 className="w-5 h-5" />
                                                            <span className="font-medium">Correct! Moving to next question...</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <XCircle className="w-5 h-5" />
                                                            <span className="font-medium">Incorrect. The correct answer is &quot;{currentWord.english}&quot;. Moving to next question...</span>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })()}
                            {/* Navigation buttons - only show when answer is selected */}
                            {answeredWords.has(currentWord?.id || 0) && (
                                <div className="flex items-center justify-between">
                                    <button
                                        onClick={handlePrevious}
                                        disabled={currentIndex === 0}
                                        className="px-6 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                        Previous
                                    </button>
                                    <button
                                        onClick={handleNext}
                                        disabled={currentIndex === currentWords.length - 1}
                                        className="px-6 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        Next
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            )}
                            {/* Show submit button when all questions are answered */}
                            {answeredWords.size === currentWords.length && (
                                <div className="flex justify-center">
                                    <button
                                        onClick={() => setTestSubmitted(true)}
                                        className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg"
                                    >
                                        View Results
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8 text-center">
                                <h3 className="text-2xl font-bold text-slate-900 mb-2">Test Results</h3>
                                <p className="text-4xl font-extrabold text-blue-600 mb-4">
                                    {correctCount} / {currentWords.length}
                                </p>
                                <p className="text-slate-600">
                                    {Math.round((correctCount / currentWords.length) * 100)}% Correct
                                </p>
                            </div>
                            {currentWords.map((word) => (
                                <div
                                    key={word.id}
                                    className={`bg-white rounded-2xl shadow-lg border p-6 ${
                                        testResults[word.id]
                                            ? "border-emerald-200 bg-emerald-50"
                                            : "border-red-200 bg-red-50"
                                    }`}
                                >
                                    <div className="flex items-start gap-4">
                                        {testResults[word.id] ? (
                                            <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-1" />
                                        ) : (
                                            <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                                        )}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <p className="font-bold text-slate-900" dir="rtl" style={{ fontSize: getArabicFontSize("text-2xl"), ...getArabicFontStyle() }}>
                                                    {word.arabic}
                                                </p>
                                                <button
                                                    onClick={() => speakText(word.arabic, "ar", "arabic")}
                                                    className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                                    title="Listen to Arabic pronunciation"
                                                >
                                                    {speaking.arabic ? (
                                                        <VolumeX className="w-5 h-5" />
                                                    ) : (
                                                        <Volume2 className="w-5 h-5" />
                                                    )}
                                                </button>
                                            </div>
                                            <p className="text-lg text-slate-700 mb-1">
                                                Your answer: <span className="font-semibold">{testAnswers[word.id] || "(not answered)"}</span>
                                            </p>
                                            <div className="flex items-center gap-3">
                                                <p className="text-lg text-slate-700">
                                                    Correct answer: <span className="font-semibold text-emerald-600">{word.english}</span>
                                                </p>
                                                <button
                                                    onClick={() => speakText(word.english, "en", "english")}
                                                    className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                                    title="Listen to English pronunciation"
                                                >
                                                    {speaking.english ? (
                                                        <VolumeX className="w-5 h-5" />
                                                    ) : (
                                                        <Volume2 className="w-5 h-5" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div className="flex justify-center">
                                <button
                                    onClick={handleTestReset}
                                    className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg flex items-center gap-2"
                                >
                                    <RotateCcw className="w-5 h-5" />
                                    Retake Test
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Practice Summary - Always accessible in practice mode when there's any progress */}
            {mode === "practice" && showSummary && (Object.keys(practiceResults).length > 0 || hasAnySavedProgress) && (
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8 text-center">
                        <h3 className="text-2xl font-bold text-slate-900 mb-4">
                            {practiceCompleted ? "Practice Complete!" : "Practice Summary"}
                        </h3>
                        <div className="flex items-center justify-center gap-8 mb-4">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                                <span className="text-3xl font-extrabold text-emerald-600">
                                    {Object.values(allWordResults).filter(r => r === true).length}
                                </span>
                                <span className="text-slate-600">Correct</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <XCircle className="w-6 h-6 text-red-600" />
                                <span className="text-3xl font-extrabold text-red-600">
                                    {Object.values(allWordResults).filter(r => r === false).length}
                                </span>
                                <span className="text-slate-600">Incorrect</span>
                            </div>
                        </div>
                        <p className="text-slate-600 mb-6">
                            {Object.keys(allWordResults).length > 0 && (
                                <>
                                    {Math.round((Object.values(allWordResults).filter(r => r === true).length / Object.keys(allWordResults).length) * 100)}% Accuracy
                                    <span className="text-slate-400 ml-2">
                                        ({Object.keys(allWordResults).length} of {words.length} words)
                                    </span>
                                </>
                            )}
                        </p>
                        {/* Practice Again Button */}
                        <div className="flex justify-center mt-6">
                            <button
                                onClick={() => {
                                    setSummaryDismissed(true); // Mark as dismissed first
                                    handlePracticeReset();
                                    // Scroll to top to show practice view
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg flex items-center gap-2"
                            >
                                <RotateCcw className="w-5 h-5" />
                                Practice Again
                            </button>
                        </div>
                    </div>

                    {/* Incorrect Words Group - Show first */}
                    {Object.values(allWordResults).some(r => r === false) && (
                        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                            <h4 className="text-xl font-bold text-red-700 mb-4 flex items-center gap-2">
                                <XCircle className="w-6 h-6" />
                                Incorrect ({Object.values(allWordResults).filter(r => r === false).length})
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {words
                                    .filter(word => allWordResults[word.id] === false)
                                    .map((word) => {
                                        const wordProgress = progress[word.id];
                                        const isFromCurrentSession = word.id in practiceResults;
                                        return (
                                        <div
                                            key={word.id}
                                            className="bg-red-50 border border-red-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <p className="font-bold text-slate-900" dir="rtl" style={{ fontSize: getArabicFontSize("text-xl"), ...getArabicFontStyle() }}>
                                                            {word.arabic}
                                                        </p>
                                                        <button
                                                            onClick={() => speakText(word.arabic, "ar", "arabic")}
                                                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                                            title="Listen to Arabic pronunciation"
                                                        >
                                                            {speaking.arabic ? (
                                                                <VolumeX className="w-4 h-4" />
                                                            ) : (
                                                                <Volume2 className="w-4 h-4" />
                                                            )}
                                                        </button>
                                                    </div>
                                                    <p className="text-lg text-slate-700 font-semibold">{word.english}</p>
                                                    {wordProgress && (wordProgress.correctCount > 0 || wordProgress.incorrectCount > 0) && (
                                                        <p className="text-xs text-slate-500 mt-1">
                                                            {wordProgress.correctCount} correct, {wordProgress.incorrectCount} incorrect
                                                            {isFromCurrentSession && " (this session)"}
                                                        </p>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => handleJumpToWord(word.id)}
                                                    className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Review this word"
                                                >
                                                    <ArrowRight className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                    })}
                            </div>
                        </div>
                    )}

                    {/* Correct Words Group - Show after incorrect words */}
                    {Object.values(allWordResults).some(r => r === true) && (
                        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                            <h4 className="text-xl font-bold text-emerald-700 mb-4 flex items-center gap-2">
                                <CheckCircle2 className="w-6 h-6" />
                                Correct ({Object.values(allWordResults).filter(r => r === true).length})
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {words
                                    .filter(word => allWordResults[word.id] === true)
                                    .map((word) => {
                                        const wordProgress = progress[word.id];
                                        const isFromCurrentSession = word.id in practiceResults;
                                        return (
                                        <div
                                            key={word.id}
                                            className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <p className="font-bold text-slate-900" dir="rtl" style={{ fontSize: getArabicFontSize("text-xl"), ...getArabicFontStyle() }}>
                                                            {word.arabic}
                                                        </p>
                                                        <button
                                                            onClick={() => speakText(word.arabic, "ar", "arabic")}
                                                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                                            title="Listen to Arabic pronunciation"
                                                        >
                                                            {speaking.arabic ? (
                                                                <VolumeX className="w-4 h-4" />
                                                            ) : (
                                                                <Volume2 className="w-4 h-4" />
                                                            )}
                                                        </button>
                                                    </div>
                                                    <p className="text-lg text-slate-700 font-semibold">{word.english}</p>
                                                    {wordProgress && (wordProgress.correctCount > 0 || wordProgress.incorrectCount > 0) && (
                                                        <p className="text-xs text-slate-500 mt-1">
                                                            {wordProgress.correctCount} correct, {wordProgress.incorrectCount} incorrect
                                                            {isFromCurrentSession && " (this session)"}
                                                        </p>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => handleJumpToWord(word.id)}
                                                    className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Review this word"
                                                >
                                                    <ArrowRight className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                    })}
                            </div>
                        </div>
                    )}

                    {/* Unpracticed Words Group - Show words that haven't been practiced yet */}
                    {words.some(word => !(word.id in allWordResults)) && (
                        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                            <h4 className="text-xl font-bold text-slate-700 mb-4 flex items-center gap-2">
                                <BookOpen className="w-6 h-6" />
                                Not Yet Practiced ({words.filter(word => !(word.id in allWordResults)).length})
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {words
                                    .filter(word => !(word.id in allWordResults))
                                    .map((word) => (
                                        <div
                                            key={word.id}
                                            className="bg-slate-50 border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <p className="font-bold text-slate-900" dir="rtl" style={{ fontSize: getArabicFontSize("text-xl"), ...getArabicFontStyle() }}>
                                                            {word.arabic}
                                                        </p>
                                                        <button
                                                            onClick={() => speakText(word.arabic, "ar", "arabic")}
                                                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                                            title="Listen to Arabic pronunciation"
                                                        >
                                                            {speaking.arabic ? (
                                                                <VolumeX className="w-4 h-4" />
                                                            ) : (
                                                                <Volume2 className="w-4 h-4" />
                                                            )}
                                                        </button>
                                                    </div>
                                                    <p className="text-lg text-slate-700 font-semibold">{word.english}</p>
                                                </div>
                                                <button
                                                    onClick={() => handleJumpToWord(word.id)}
                                                    className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Practice this word"
                                                >
                                                    <ArrowRight className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}

                </div>
            )}

            {/* Navigation (only for Learn and Practice modes) */}
            {(mode === "learn" || (mode === "practice" && !showSummary)) && (
                <div className="mt-6 flex items-center justify-between">
                    <button
                        onClick={handlePrevious}
                        disabled={currentIndex === 0}
                        className="px-6 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <ChevronLeft className="w-5 h-5" />
                        Previous
                    </button>
                    {mode === "practice" && (
                        <>
                            <button
                                onClick={handleFlip}
                                className="px-6 py-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-2"
                            >
                                <Eye className="w-5 h-5" />
                                {isFlipped ? "Hide" : "Show"} Answer
                            </button>
                            <button
                                onClick={() => {
                                    setShowSummary(true);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className={`px-6 py-3 rounded-lg transition-colors flex items-center gap-2 ${
                                    hasAnySavedProgress || Object.keys(practiceResults).length > 0
                                        ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                                }`}
                                disabled={!hasAnySavedProgress && Object.keys(practiceResults).length === 0}
                                title={!hasAnySavedProgress && Object.keys(practiceResults).length === 0 ? "Practice some words first" : "View summary"}
                            >
                                <BookOpen className="w-5 h-5" />
                                Summary
                            </button>
                        </>
                    )}
                    <button
                        onClick={handleNext}
                        disabled={currentIndex === currentWords.length - 1}
                        className="px-6 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        Next
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            )}
        </div>
    );
}

