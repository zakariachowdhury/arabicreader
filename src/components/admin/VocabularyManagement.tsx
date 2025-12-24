"use client";

import { useState, useTransition, useRef } from "react";
import { VocabularyWord } from "@/db/schema";
import { addVocabularyWord, updateVocabularyWord, deleteVocabularyWord, bulkAddVocabularyWords, updateVocabularyOrder } from "@/app/admin/actions";
import { Edit2, Trash2, Save, X, Plus, Upload, Loader2, CheckCircle2, GripVertical } from "lucide-react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortableVocabularyRow({ word, editingId, editData, isPending, onEdit, onCancel, onSave, onDelete, setEditData }: {
    word: VocabularyWord;
    editingId: number | null;
    editData: { arabic: string; english: string; order: number } | null;
    isPending: boolean;
    onEdit: (word: VocabularyWord) => void;
    onCancel: () => void;
    onSave: (wordId: number) => void;
    onDelete: (wordId: number) => void;
    setEditData: (data: { arabic: string; english: string; order: number } | null) => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: word.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <tr
            ref={setNodeRef}
            style={style}
            className={`hover:bg-slate-50 transition-colors ${isDragging ? "bg-slate-100" : ""}`}
        >
            <td className="px-6 py-4 w-12">
                <button
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 p-1"
                    title="Drag to reorder"
                >
                    <GripVertical className="w-5 h-5" />
                </button>
            </td>
            <td className="px-6 py-4">
                {editingId === word.id ? (
                    <input
                        type="text"
                        value={editData?.arabic || ""}
                        onChange={(e) => setEditData({ ...editData!, arabic: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        dir="rtl"
                    />
                ) : (
                    <div className="font-medium text-slate-900 text-lg" dir="rtl">{word.arabic}</div>
                )}
            </td>
            <td className="px-6 py-4">
                {editingId === word.id ? (
                    <input
                        type="text"
                        value={editData?.english || ""}
                        onChange={(e) => setEditData({ ...editData!, english: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                ) : (
                    <div className="text-slate-600">{word.english}</div>
                )}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right">
                {editingId === word.id ? (
                    <div className="flex items-center justify-end gap-2">
                        <button
                            onClick={() => onSave(word.id)}
                            disabled={isPending}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Save"
                        >
                            <Save className="w-4 h-4" />
                        </button>
                        <button
                            onClick={onCancel}
                            disabled={isPending}
                            className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                            title="Cancel"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center justify-end gap-2">
                        <button
                            onClick={() => onEdit(word)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                        >
                            <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => onDelete(word.id)}
                            disabled={isPending}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Delete"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </td>
        </tr>
    );
}

export function VocabularyManagement({ initialWords, lessonId, lessonTitle }: { initialWords: VocabularyWord[]; lessonId: number; lessonTitle: string }) {
    const [words, setWords] = useState(initialWords);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editData, setEditData] = useState<{ arabic: string; english: string; order: number } | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [newWord, setNewWord] = useState({ arabic: "", english: "", order: words.length });
    const [isPending, startTransition] = useTransition();

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );
    
    // Image upload states
    const [isUploading, setIsUploading] = useState(false);
    const [parsedWords, setParsedWords] = useState<Array<{ arabic: string; english: string }> | null>(null);
    const [showParsedWords, setShowParsedWords] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleEdit = (word: VocabularyWord) => {
        setEditingId(word.id);
        setEditData({
            arabic: word.arabic,
            english: word.english,
            order: word.order,
        });
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditData(null);
        setIsCreating(false);
        setNewWord({ arabic: "", english: "", order: words.length });
    };

    const handleSave = async (wordId: number) => {
        if (!editData) return;

        startTransition(async () => {
            try {
                await updateVocabularyWord(wordId, {
                    arabic: editData.arabic,
                    english: editData.english,
                    order: editData.order,
                });
                setWords(words.map(w => 
                    w.id === wordId 
                        ? { ...w, ...editData }
                        : w
                ));
                setEditingId(null);
                setEditData(null);
            } catch (error) {
                console.error("Failed to update vocabulary word:", error);
                alert("Failed to update vocabulary word. Please try again.");
            }
        });
    };

    const handleCreate = async () => {
        if (!newWord.arabic.trim() || !newWord.english.trim()) {
            alert("Both Arabic and English are required");
            return;
        }

        startTransition(async () => {
            try {
                const created = await addVocabularyWord(lessonId, {
                    arabic: newWord.arabic,
                    english: newWord.english,
                    order: newWord.order,
                });
                setWords([...words, created]);
                setIsCreating(false);
                setNewWord({ arabic: "", english: "", order: words.length + 1 });
            } catch (error) {
                console.error("Failed to add vocabulary word:", error);
                alert("Failed to add vocabulary word. Please try again.");
            }
        });
    };

    const handleDelete = async (wordId: number) => {
        if (!confirm("Are you sure you want to delete this word pair?")) {
            return;
        }

        startTransition(async () => {
            try {
                await deleteVocabularyWord(wordId);
                setWords(words.filter(w => w.id !== wordId));
            } catch (error) {
                console.error("Failed to delete vocabulary word:", error);
                alert("Failed to delete vocabulary word. Please try again.");
            }
        });
    };

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith("image/")) {
            setUploadError("Please select an image file");
            return;
        }

        setIsUploading(true);
        setUploadError(null);
        setParsedWords(null);
        setShowParsedWords(false);

        try {
            const formData = new FormData();
            formData.append("image", file);

            const response = await fetch("/api/admin/parse-vocabulary-image", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to parse image");
            }

            if (data.wordPairs && data.wordPairs.length > 0) {
                setParsedWords(data.wordPairs);
                setShowParsedWords(true);
            } else {
                setUploadError("No word pairs found in the image. Please try another image.");
            }
        } catch (error) {
            console.error("Error parsing image:", error);
            setUploadError(error instanceof Error ? error.message : "Failed to parse image");
        } finally {
            setIsUploading(false);
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleBulkAdd = async () => {
        if (!parsedWords || parsedWords.length === 0) return;

        startTransition(async () => {
            try {
                const created = await bulkAddVocabularyWords(lessonId, parsedWords);
                setWords([...words, ...created]);
                setParsedWords(null);
                setShowParsedWords(false);
                setUploadError(null);
            } catch (error) {
                console.error("Failed to bulk add vocabulary words:", error);
                alert("Failed to add vocabulary words. Please try again.");
            }
        });
    };

    const handleCancelParsed = () => {
        setParsedWords(null);
        setShowParsedWords(false);
        setUploadError(null);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = words.findIndex((word) => word.id === active.id);
            const newIndex = words.findIndex((word) => word.id === over.id);

            const newWords = arrayMove(words, oldIndex, newIndex);
            setWords(newWords);

            // Update order in database
            startTransition(async () => {
                try {
                    await updateVocabularyOrder(newWords.map((w) => w.id));
                } catch (error) {
                    console.error("Failed to update vocabulary order:", error);
                    alert("Failed to update vocabulary order. Please try again.");
                    // Revert on error
                    setWords(words);
                }
            });
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Vocabulary: {lessonTitle}</h2>
                    <p className="text-slate-500 mt-1">Manage Arabic-English word pairs</p>
                </div>
                {!isCreating && !showParsedWords && (
                    <div className="flex items-center gap-2">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            id="image-upload"
                        />
                        <label
                            htmlFor="image-upload"
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors cursor-pointer ${
                                isUploading
                                    ? "bg-slate-400 text-white cursor-not-allowed"
                                    : "bg-purple-600 text-white hover:bg-purple-700"
                            }`}
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Parsing...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4" />
                                    Upload Image
                                </>
                            )}
                        </label>
                        <button
                            onClick={() => setIsCreating(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Add Word Pair
                        </button>
                    </div>
                )}
            </div>

            {uploadError && (
                <div className="p-4 mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {uploadError}
                </div>
            )}

            {showParsedWords && parsedWords && (
                <div className="p-6 border-b border-slate-100 bg-purple-50">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">
                                Extracted Word Pairs ({parsedWords.length})
                            </h3>
                            <p className="text-sm text-slate-600 mt-1">
                                Review the extracted word pairs below. You can edit them before adding.
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleBulkAdd}
                                disabled={isPending || parsedWords.length === 0}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                Add All ({parsedWords.length})
                            </button>
                            <button
                                onClick={handleCancelParsed}
                                disabled={isPending}
                                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors disabled:opacity-50"
                            >
                                <X className="w-4 h-4 inline mr-2" />
                                Cancel
                            </button>
                        </div>
                    </div>
                    <div className="max-h-96 overflow-y-auto border border-slate-200 rounded-lg bg-white">
                        <table className="w-full">
                            <thead className="bg-slate-50 sticky top-0">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Arabic</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">English</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {parsedWords.map((word, index) => (
                                    <tr key={index} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <input
                                                type="text"
                                                value={word.arabic}
                                                onChange={(e) => {
                                                    const updated = [...parsedWords];
                                                    updated[index].arabic = e.target.value;
                                                    setParsedWords(updated);
                                                }}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                dir="rtl"
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <input
                                                type="text"
                                                value={word.english}
                                                onChange={(e) => {
                                                    const updated = [...parsedWords];
                                                    updated[index].english = e.target.value;
                                                    setParsedWords(updated);
                                                }}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            />
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-right">
                                            <button
                                                onClick={() => {
                                                    const updated = parsedWords.filter((_, i) => i !== index);
                                                    setParsedWords(updated);
                                                    if (updated.length === 0) {
                                                        setShowParsedWords(false);
                                                    }
                                                }}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Remove"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {isCreating && (
                <div className="p-6 border-b border-slate-100 bg-slate-50">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Add New Word Pair</h3>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Arabic *</label>
                                <input
                                    type="text"
                                    value={newWord.arabic}
                                    onChange={(e) => setNewWord({ ...newWord, arabic: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Arabic word"
                                    dir="rtl"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">English *</label>
                                <input
                                    type="text"
                                    value={newWord.english}
                                    onChange={(e) => setNewWord({ ...newWord, english: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="English translation"
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleCreate}
                                disabled={isPending || !newWord.arabic.trim() || !newWord.english.trim()}
                                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                            >
                                <Save className="w-4 h-4 inline mr-2" />
                                Add
                            </button>
                            <button
                                onClick={handleCancel}
                                disabled={isPending}
                                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors disabled:opacity-50"
                            >
                                <X className="w-4 h-4 inline mr-2" />
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="overflow-x-auto">
                {words.length === 0 ? (
                    <div className="p-12 text-center">
                        <p className="text-slate-500">No vocabulary words yet. Add your first word pair to get started.</p>
                    </div>
                ) : (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <table className="w-full">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-12"></th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Arabic</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">English</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                <SortableContext items={words.map(w => w.id)} strategy={verticalListSortingStrategy}>
                                    {words.map((word) => (
                                        <SortableVocabularyRow
                                            key={word.id}
                                            word={word}
                                            editingId={editingId}
                                            editData={editData}
                                            isPending={isPending}
                                            onEdit={handleEdit}
                                            onCancel={handleCancel}
                                            onSave={handleSave}
                                            onDelete={handleDelete}
                                            setEditData={setEditData}
                                        />
                                    ))}
                                </SortableContext>
                            </tbody>
                        </table>
                    </DndContext>
                )}
            </div>
        </div>
    );
}

