"use client";

import { useState, useTransition } from "react";
import { getGroups, createGroup, updateGroup, deleteGroup, setDefaultGroup } from "@/app/actions";
import { type Group } from "@/db/schema";
import { Plus, Edit2, Trash2, Save, X, Palette, Star } from "lucide-react";
import { toast } from "@/lib/toast";
import { ConfirmationModal } from "@/components/ConfirmationModal";

const DEFAULT_COLORS = [
    "#3B82F6", // blue
    "#10B981", // green
    "#F59E0B", // amber
    "#EF4444", // red
    "#8B5CF6", // purple
    "#EC4899", // pink
    "#06B6D4", // cyan
    "#84CC16", // lime
];

type GroupWithCount = Group & { todoCount?: number };

export function GroupManagement({ initialGroups, todoCounts, defaultGroupId }: { initialGroups: Group[]; todoCounts?: Record<number, number>; defaultGroupId?: number | null }) {
    const [groups, setGroups] = useState<GroupWithCount[]>(
        initialGroups.map(g => ({ ...g, todoCount: todoCounts?.[g.id] || 0 }))
    );
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [isPending, startTransition] = useTransition();
    const [deletingGroupId, setDeletingGroupId] = useState<number | null>(null);

    const [formData, setFormData] = useState({
        name: "",
        color: DEFAULT_COLORS[0],
        description: "",
    });

    const handleCreate = async () => {
        if (!formData.name.trim()) {
            toast.warning("Group name is required");
            return;
        }

        startTransition(async () => {
            try {
                const formDataObj = new FormData();
                formDataObj.append("name", formData.name);
                formDataObj.append("color", formData.color);
                formDataObj.append("description", formData.description);

                await createGroup(formDataObj);
                
                // Refresh groups
                const updatedGroups = await getGroups();
                setGroups(updatedGroups.map(g => ({ ...g, todoCount: todoCounts?.[g.id] || 0 })));
                
                setIsCreating(false);
                setFormData({ name: "", color: DEFAULT_COLORS[0], description: "" });
            } catch (error) {
                console.error("Failed to create group:", error);
                toast.error(error instanceof Error ? error.message : "Failed to create group");
            }
        });
    };

    const handleEdit = (group: GroupWithCount) => {
        setEditingId(group.id);
        setFormData({
            name: group.name,
            color: group.color || DEFAULT_COLORS[0],
            description: group.description || "",
        });
    };

    const handleUpdate = async (groupId: number) => {
        if (!formData.name.trim()) {
            toast.warning("Group name is required");
            return;
        }

        startTransition(async () => {
            try {
                const formDataObj = new FormData();
                formDataObj.append("name", formData.name);
                formDataObj.append("color", formData.color);
                formDataObj.append("description", formData.description);

                await updateGroup(groupId, formDataObj);
                
                // Refresh groups
                const updatedGroups = await getGroups();
                setGroups(updatedGroups.map(g => ({ ...g, todoCount: todoCounts?.[g.id] || 0 })));
                
                setEditingId(null);
                setFormData({ name: "", color: DEFAULT_COLORS[0], description: "" });
            } catch (error) {
                console.error("Failed to update group:", error);
                toast.error(error instanceof Error ? error.message : "Failed to update group");
            }
        });
    };

    const handleDeleteClick = (groupId: number) => {
        setDeletingGroupId(groupId);
    };

    const handleDeleteConfirm = async () => {
        if (!deletingGroupId) return;

        startTransition(async () => {
            try {
                await deleteGroup(deletingGroupId);
                
                // Refresh groups
                const updatedGroups = await getGroups();
                setGroups(updatedGroups.map(g => ({ ...g, todoCount: todoCounts?.[g.id] || 0 })));
                setDeletingGroupId(null);
            } catch (error) {
                console.error("Failed to delete group:", error);
                toast.error(error instanceof Error ? error.message : "Failed to delete group");
                setDeletingGroupId(null);
            }
        });
    };

    const handleCancel = () => {
        setIsCreating(false);
        setEditingId(null);
        setFormData({ name: "", color: DEFAULT_COLORS[0], description: "" });
    };

    const handleSetDefault = async (groupId: number) => {
        const newDefaultId = defaultGroupId === groupId ? null : groupId;
        startTransition(async () => {
            try {
                await setDefaultGroup(newDefaultId);
                // Refresh groups to update UI
                const updatedGroups = await getGroups();
                setGroups(updatedGroups.map(g => ({ ...g, todoCount: todoCounts?.[g.id] || 0 })));
            } catch (error) {
                console.error("Failed to set default group:", error);
                toast.error(error instanceof Error ? error.message : "Failed to set default group");
            }
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Groups</h2>
                    <p className="text-slate-500 mt-1">Organize your tasks into groups</p>
                </div>
                {!isCreating && (
                    <button
                        onClick={() => setIsCreating(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        New Group
                    </button>
                )}
            </div>

            <div className="space-y-4">
                {isCreating && (
                    <div className="p-4 border border-blue-200 rounded-xl bg-blue-50/50">
                        <h3 className="font-semibold text-slate-900 mb-3">Create New Group</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Group name"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Color</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={formData.color}
                                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                        className="w-12 h-10 border border-slate-300 rounded-lg cursor-pointer"
                                    />
                                    <div className="flex gap-2">
                                        {DEFAULT_COLORS.map((color) => (
                                            <button
                                                key={color}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, color })}
                                                className="w-8 h-8 rounded-lg border-2 border-slate-300 hover:border-slate-400 transition-colors"
                                                style={{ backgroundColor: color }}
                                                aria-label={`Select color ${color}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Optional description"
                                    rows={2}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={handleCreate}
                                    disabled={isPending}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                                >
                                    <Save className="w-4 h-4" />
                                    Create
                                </button>
                                <button
                                    onClick={handleCancel}
                                    disabled={isPending}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {groups.length === 0 && !isCreating ? (
                    <div className="text-center py-8 text-slate-400">
                        <Palette className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No groups yet. Create your first group to organize your tasks!</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {groups.map((group) => (
                            <div
                                key={group.id}
                                className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-slate-300 transition-colors"
                            >
                                {editingId === group.id ? (
                                    <div className="flex-1 space-y-3">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                autoFocus
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Color</label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="color"
                                                    value={formData.color}
                                                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                                    className="w-12 h-10 border border-slate-300 rounded-lg cursor-pointer"
                                                />
                                                <div className="flex gap-2">
                                                    {DEFAULT_COLORS.map((color) => (
                                                        <button
                                                            key={color}
                                                            type="button"
                                                            onClick={() => setFormData({ ...formData, color })}
                                                            className="w-8 h-8 rounded-lg border-2 border-slate-300 hover:border-slate-400 transition-colors"
                                                            style={{ backgroundColor: color }}
                                                            aria-label={`Select color ${color}`}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                            <textarea
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                rows={2}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleUpdate(group.id)}
                                                disabled={isPending}
                                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                                            >
                                                <Save className="w-4 h-4" />
                                                Save
                                            </button>
                                            <button
                                                onClick={handleCancel}
                                                disabled={isPending}
                                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-3 flex-1">
                                            <div
                                                className="w-4 h-4 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: group.color || DEFAULT_COLORS[0] }}
                                            />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <div className="font-semibold text-slate-900">{group.name}</div>
                                                    {defaultGroupId === group.id && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 text-xs font-medium rounded-md border border-amber-200">
                                                            <Star className="w-3 h-3 fill-amber-500" />
                                                            Default
                                                        </span>
                                                    )}
                                                </div>
                                                {group.description && (
                                                    <div className="text-sm text-slate-500">{group.description}</div>
                                                )}
                                                <div className="text-xs text-slate-400 mt-1">
                                                    {group.todoCount || 0} {group.todoCount === 1 ? "task" : "tasks"}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleSetDefault(group.id)}
                                                disabled={isPending}
                                                className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                                                    defaultGroupId === group.id
                                                        ? "text-amber-600 hover:bg-amber-50"
                                                        : "text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                                                }`}
                                                aria-label={defaultGroupId === group.id ? "Remove as default group" : "Set as default group"}
                                                title={defaultGroupId === group.id ? "Remove as default group" : "Set as default group"}
                                            >
                                                <Star className={`w-4 h-4 ${defaultGroupId === group.id ? "fill-amber-500" : ""}`} />
                                            </button>
                                            <button
                                                onClick={() => handleEdit(group)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                aria-label="Edit group"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(group.id)}
                                                disabled={isPending}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                aria-label="Delete group"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <ConfirmationModal
                isOpen={deletingGroupId !== null}
                onClose={() => setDeletingGroupId(null)}
                onConfirm={handleDeleteConfirm}
                title="Delete Group"
                message="Are you sure you want to delete this group? Todos in this group will be moved to 'Uncategorized'."
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
                isPending={isPending}
            />
        </div>
    );
}

