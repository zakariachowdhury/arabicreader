"use client";

import { useState, useTransition } from "react";
import { adminUpdateGroup, adminDeleteGroup } from "@/app/admin/actions";
import { Edit2, Trash2, Save, X, Palette } from "lucide-react";

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

type GroupWithUser = {
    id: number;
    name: string;
    color: string | null;
    description: string | null;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
    user: {
        name: string;
        email: string;
    } | null;
};

export function GroupManagement({ initialGroups }: { initialGroups: GroupWithUser[] }) {
    const [groups, setGroups] = useState(initialGroups);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editData, setEditData] = useState<{ name: string; color: string; description: string } | null>(null);
    const [isPending, startTransition] = useTransition();

    const handleEdit = (group: GroupWithUser) => {
        setEditingId(group.id);
        setEditData({
            name: group.name,
            color: group.color || DEFAULT_COLORS[0],
            description: group.description || "",
        });
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditData(null);
    };

    const handleSave = async (groupId: number) => {
        if (!editData || !editData.name.trim()) {
            alert("Group name is required");
            return;
        }

        startTransition(async () => {
            try {
                await adminUpdateGroup(groupId, {
                    name: editData.name.trim(),
                    color: editData.color || null,
                    description: editData.description?.trim() || null,
                });
                setGroups(groups.map(g => 
                    g.id === groupId 
                        ? { 
                            ...g, 
                            name: editData.name.trim(),
                            color: editData.color || null,
                            description: editData.description?.trim() || null,
                            updatedAt: new Date()
                        }
                        : g
                ));
                setEditingId(null);
                setEditData(null);
            } catch (error) {
                console.error("Failed to update group:", error);
                alert("Failed to update group. Please try again.");
            }
        });
    };

    const handleDelete = async (groupId: number) => {
        if (!confirm("Are you sure you want to delete this group? Todos in this group will be moved to 'Uncategorized'.")) {
            return;
        }

        startTransition(async () => {
            try {
                await adminDeleteGroup(groupId);
                setGroups(groups.filter(g => g.id !== groupId));
            } catch (error) {
                console.error("Failed to delete group:", error);
                alert("Failed to delete group. Please try again.");
            }
        });
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
                <h2 className="text-2xl font-bold text-slate-900">Group Management</h2>
                <p className="text-slate-500 mt-1">Manage all groups across the platform</p>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Color</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Description</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Owner</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Created</th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {groups.map((group) => (
                            <tr key={group.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {editingId === group.id ? (
                                        <input
                                            type="text"
                                            value={editData?.name || ""}
                                            onChange={(e) => setEditData({ ...editData!, name: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    ) : (
                                        <div className="font-medium text-slate-900">{group.name}</div>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {editingId === group.id ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="color"
                                                value={editData?.color || DEFAULT_COLORS[0]}
                                                onChange={(e) => setEditData({ ...editData!, color: e.target.value })}
                                                className="w-12 h-10 border border-slate-300 rounded-lg cursor-pointer"
                                            />
                                            <div className="flex gap-2">
                                                {DEFAULT_COLORS.map((color) => (
                                                    <button
                                                        key={color}
                                                        type="button"
                                                        onClick={() => setEditData({ ...editData!, color })}
                                                        className="w-8 h-8 rounded-lg border-2 border-slate-300 hover:border-slate-400 transition-colors"
                                                        style={{ backgroundColor: color }}
                                                        aria-label={`Select color ${color}`}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-6 h-6 rounded-full border border-slate-200"
                                                style={{ backgroundColor: group.color || DEFAULT_COLORS[0] }}
                                            />
                                            <span className="text-sm text-slate-600">{group.color || "Default"}</span>
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    {editingId === group.id ? (
                                        <textarea
                                            value={editData?.description || ""}
                                            onChange={(e) => setEditData({ ...editData!, description: e.target.value })}
                                            rows={2}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Optional description"
                                        />
                                    ) : (
                                        <div className="text-slate-600">
                                            {group.description || <span className="text-slate-400 italic">No description</span>}
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div>
                                        <div className="font-medium text-slate-900">{group.user?.name || "Unknown"}</div>
                                        <div className="text-sm text-slate-500">{group.user?.email || "N/A"}</div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                    {new Date(group.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                    {editingId === group.id ? (
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleSave(group.id)}
                                                disabled={isPending}
                                                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
                                                title="Save"
                                            >
                                                <Save className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={handleCancel}
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
                                                onClick={() => handleEdit(group)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(group.id)}
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
                        ))}
                    </tbody>
                </table>
                {groups.length === 0 && (
                    <div className="text-center py-12 text-slate-400">
                        <Palette className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No groups found</p>
                    </div>
                )}
            </div>
        </div>
    );
}

