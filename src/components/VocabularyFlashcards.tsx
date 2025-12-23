"use client";

import { useState, useEffect, useTransition } from "react";
import { VocabularyWord, UserProgress } from "@/db/schema";
import { updateUserProgress } from "@/app/actions";
import { BookOpen, ChevronLeft, ChevronRight, RotateCcw, CheckCircle2, XCircle, Eye, Volume2, VolumeX } from "lucide-react";

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
    const [mode, setMode] = useState<Mode>(initialMode);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [testAnswers, setTestAnswers] = useState<Record<number, string>>({});
    const [testOptions, setTestOptions] = useState<Record<number, string[]>>({});
    const [testResults, setTestResults] = useState<Record<number, boolean>>({});
    const [testSubmitted, setTestSubmitted] = useState(false);
    const [progress, setProgress] = useState(initialProgress);
    const [isPending, startTransition] = useTransition();
    const [speaking, setSpeaking] = useState<{ arabic: boolean; english: boolean }>({ arabic: false, english: false });

    // Check for wordId in URL query parameters to jump to specific word
    useEffect(() => {
        if (typeof window !== "undefined") {
            const urlParams = new URLSearchParams(window.location.search);
            const wordIdParam = urlParams.get("wordId");
            if (wordIdParam) {
                const wordId = parseInt(wordIdParam);
                if (!isNaN(wordId)) {
                    const wordIndex = words.findIndex(w => w.id === wordId);
                    if (wordIndex !== -1) {
                        setCurrentIndex(wordIndex);
                        // Clean up URL by removing the query parameter
                        const newUrl = window.location.pathname;
                        window.history.replaceState({}, "", newUrl);
                    }
                }
            }
        }
    }, [words]);

    const currentWord = words[currentIndex];
    const currentProgress = currentWord ? progress[currentWord.id] : null;

    // Generate multiple choice options when entering test mode
    useEffect(() => {
        if (mode === "test" && words.length > 0 && Object.keys(testOptions).length === 0) {
            const options: Record<number, string[]> = {};
            words.forEach(word => {
                options[word.id] = generateMultipleChoiceOptions(word.english, words, word.id);
            });
            setTestOptions(options);
        }
    }, [mode, words, testOptions]);

    useEffect(() => {
        // Mark word as seen when viewing in learn or practice mode
        if (currentWord && (mode === "learn" || mode === "practice") && !testSubmitted) {
            if (!currentProgress?.seen) {
                startTransition(async () => {
                    try {
                        await updateUserProgress(currentWord.id, { seen: true });
                        setProgress(prev => ({
                            ...prev,
                            [currentWord.id]: {
                                ...prev[currentWord.id],
                                id: prev[currentWord.id]?.id || 0,
                                userId: "",
                                wordId: currentWord.id,
                                seen: true,
                                correctCount: prev[currentWord.id]?.correctCount || 0,
                                incorrectCount: prev[currentWord.id]?.incorrectCount || 0,
                                lastReviewedAt: new Date(),
                                createdAt: prev[currentWord.id]?.createdAt || new Date(),
                                updatedAt: new Date(),
                            } as UserProgress,
                        }));
                    } catch (error) {
                        console.error("Failed to update progress:", error);
                    }
                });
            }
        }
    }, [currentWord?.id, mode, testSubmitted]);

    const handleNext = () => {
        if (currentIndex < words.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setIsFlipped(false);
            // Stop any speaking when moving to next word
            window.speechSynthesis.cancel();
            setSpeaking({ arabic: false, english: false });
        }
    };

    const handlePrevious = () => {
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
        setTestAnswers(prev => ({ ...prev, [wordId]: answer }));
    };

    const handleTestSubmit = () => {
        const results: Record<number, boolean> = {};
        words.forEach(word => {
            const answer = testAnswers[word.id]?.trim() || "";
            const correct = answer === word.english;
            results[word.id] = correct;

            // Update progress
            startTransition(async () => {
                try {
                    await updateUserProgress(word.id, {
                        seen: true,
                        correct: correct,
                        incorrect: !correct,
                    });
                } catch (error) {
                    console.error("Failed to update progress:", error);
                }
            });
        });
        setTestResults(results);
        setTestSubmitted(true);
    };

    const handleTestReset = () => {
        setTestAnswers({});
        setTestOptions({});
        setTestResults({});
        setTestSubmitted(false);
        setCurrentIndex(0);
    };

    const handlePracticeAnswer = (correct: boolean) => {
        if (!currentWord) return;

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
    };

    // Text-to-speech function
    const speakText = (text: string, lang: "ar" | "en", type: "arabic" | "english") => {
        if (!("speechSynthesis" in window)) {
            alert("Text-to-speech is not supported in your browser.");
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

    // Cleanup: stop speech when component unmounts or mode changes
    useEffect(() => {
        return () => {
            if ("speechSynthesis" in window) {
                window.speechSynthesis.cancel();
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
    const totalWords = words.length;

    return (
        <div className="max-w-4xl mx-auto">
            {/* Mode Selector */}
            <div className="mb-6 flex gap-2 justify-center">
                <button
                    onClick={() => {
                        setMode("learn");
                        setIsFlipped(false);
                        setTestSubmitted(false);
                    }}
                    className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                        mode === "learn"
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                >
                    Learn
                </button>
                <button
                    onClick={() => {
                        setMode("practice");
                        setIsFlipped(false);
                        setTestSubmitted(false);
                    }}
                    className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                        mode === "practice"
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                >
                    Practice
                </button>
                <button
                    onClick={() => {
                        setMode("test");
                        setIsFlipped(false);
                        setTestSubmitted(false);
                        setTestAnswers({});
                        setTestOptions({});
                        setTestResults({});
                    }}
                    className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                        mode === "test"
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                >
                    Test
                </button>
            </div>

            {/* Progress Stats */}
            <div className="mb-6 text-center">
                <p className="text-slate-600">
                    Word {currentIndex + 1} of {words.length}
                </p>
                {currentProgress && (
                    <p className="text-sm text-slate-500 mt-1">
                        Correct: {currentProgress.correctCount} | Incorrect: {currentProgress.incorrectCount}
                    </p>
                )}
            </div>

            {/* Learn Mode */}
            {mode === "learn" && currentWord && (
                <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-12 min-h-[400px] flex flex-col items-center justify-center">
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
                            <p className="text-4xl font-bold text-slate-900" dir="rtl">
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
                            <p className="text-3xl font-semibold text-slate-700">
                                {currentWord.english}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Practice Mode */}
            {mode === "practice" && currentWord && (
                <div className="flashcard-container flex flex-col items-center justify-center">
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
                                <p className="text-4xl font-bold text-slate-900" dir="rtl">
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
                                <p className="text-3xl font-semibold text-slate-700">
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
                            {words.map((word, index) => {
                                const options = testOptions[word.id] || [];
                                return (
                                    <div
                                        key={word.id}
                                        className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6"
                                    >
                                        <div className="mb-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-sm text-slate-500">Question {index + 1}</p>
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
                                            <p className="text-3xl font-bold text-slate-900 mb-6" dir="rtl">
                                                {word.arabic}
                                            </p>
                                            <p className="text-sm text-slate-600 mb-4">Select the correct English translation:</p>
                                            <div className="space-y-3">
                                                {options.map((option, optionIndex) => (
                                                    <label
                                                        key={optionIndex}
                                                        className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                                            testAnswers[word.id] === option
                                                                ? "border-blue-500 bg-blue-50"
                                                                : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                                        }`}
                                                    >
                                                        <input
                                                            type="radio"
                                                            name={`word-${word.id}`}
                                                            value={option}
                                                            checked={testAnswers[word.id] === option}
                                                            onChange={(e) => handleTestAnswer(word.id, e.target.value)}
                                                            className="w-5 h-5 text-blue-600 focus:ring-blue-500 focus:ring-2"
                                                        />
                                                        <span className="ml-3 text-lg text-slate-700">{option}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div className="flex justify-center">
                                <button
                                    onClick={handleTestSubmit}
                                    disabled={Object.keys(testAnswers).length < words.length}
                                    className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Submit Test
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8 text-center">
                                <h3 className="text-2xl font-bold text-slate-900 mb-2">Test Results</h3>
                                <p className="text-4xl font-extrabold text-blue-600 mb-4">
                                    {correctCount} / {totalWords}
                                </p>
                                <p className="text-slate-600">
                                    {Math.round((correctCount / totalWords) * 100)}% Correct
                                </p>
                            </div>
                            {words.map((word, index) => (
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
                                                <p className="text-2xl font-bold text-slate-900" dir="rtl">
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

            {/* Navigation (only for Learn and Practice modes) */}
            {(mode === "learn" || mode === "practice") && (
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
                        <button
                            onClick={handleFlip}
                            className="px-6 py-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-2"
                        >
                            <Eye className="w-5 h-5" />
                            {isFlipped ? "Hide" : "Show"} Answer
                        </button>
                    )}
                    <button
                        onClick={handleNext}
                        disabled={currentIndex === words.length - 1}
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

