"use client";

import { useState, useTransition } from "react";
import { User } from "@/db/schema";
import { updateUser, deleteUser } from "@/app/admin/actions";
import { Edit2, Trash2, Save, X, Shield, ShieldOff, Sparkles, XCircle } from "lucide-react";
import { toast } from "@/lib/toast";
import { ConfirmationModal } from "@/components/ConfirmationModal";

type UserWithActions = Omit<User, "image">;

export function UserManagement({ initialUsers }: { initialUsers: UserWithActions[] }) {
    const [users, setUsers] = useState(initialUsers);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editData, setEditData] = useState<{ name: string; email: string; isAdmin: boolean; aiEnabled: boolean } | null>(null);
    const [isPending, startTransition] = useTransition();
    const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

    const handleEdit = (user: UserWithActions) => {
        setEditingId(user.id);
        setEditData({
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
            aiEnabled: user.aiEnabled ?? true,
        });
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditData(null);
    };

    const handleSave = async (userId: string) => {
        if (!editData) return;

        startTransition(async () => {
            try {
                await updateUser(userId, editData);
                setUsers(users.map(u => 
                    u.id === userId 
                        ? { ...u, ...editData, updatedAt: new Date() }
                        : u
                ));
                setEditingId(null);
                setEditData(null);
            } catch (error) {
                console.error("Failed to update user:", error);
                toast.error("Failed to update user. Please try again.");
            }
        });
    };

    const handleDeleteClick = (userId: string) => {
        setDeletingUserId(userId);
    };

    const handleDeleteConfirm = async () => {
        if (!deletingUserId) return;

        startTransition(async () => {
            try {
                await deleteUser(deletingUserId);
                setUsers(users.filter(u => u.id !== deletingUserId));
                setDeletingUserId(null);
            } catch (error) {
                console.error("Failed to delete user:", error);
                toast.error("Failed to delete user. Please try again.");
                setDeletingUserId(null);
            }
        });
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
                <h2 className="text-2xl font-bold text-slate-900">User Management</h2>
                <p className="text-slate-500 mt-1">Manage all users and their permissions</p>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Role</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">AI Enabled</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Created</th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {editingId === user.id ? (
                                        <input
                                            type="text"
                                            value={editData?.name || ""}
                                            onChange={(e) => setEditData({ ...editData!, name: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    ) : (
                                        <div className="font-medium text-slate-900">{user.name}</div>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {editingId === user.id ? (
                                        <input
                                            type="email"
                                            value={editData?.email || ""}
                                            onChange={(e) => setEditData({ ...editData!, email: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    ) : (
                                        <div className="text-slate-600">{user.email}</div>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                        user.emailVerified 
                                            ? "bg-emerald-100 text-emerald-700" 
                                            : "bg-amber-100 text-amber-700"
                                    }`}>
                                        {user.emailVerified ? "Verified" : "Unverified"}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {editingId === user.id ? (
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={editData?.isAdmin || false}
                                                onChange={(e) => setEditData({ ...editData!, isAdmin: e.target.checked })}
                                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                            />
                                            <span className="text-sm text-slate-700">Admin</span>
                                        </label>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            {user.isAdmin ? (
                                                <>
                                                    <Shield className="w-4 h-4 text-amber-600" />
                                                    <span className="text-sm font-medium text-amber-600">Admin</span>
                                                </>
                                            ) : (
                                                <>
                                                    <ShieldOff className="w-4 h-4 text-slate-400" />
                                                    <span className="text-sm text-slate-400">User</span>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {editingId === user.id ? (
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={editData?.aiEnabled ?? true}
                                                onChange={(e) => setEditData({ ...editData!, aiEnabled: e.target.checked })}
                                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                            />
                                            <span className="text-sm text-slate-700">AI Enabled</span>
                                        </label>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            {user.aiEnabled !== false ? (
                                                <>
                                                    <Sparkles className="w-4 h-4 text-purple-600" />
                                                    <span className="text-sm font-medium text-purple-600">Enabled</span>
                                                </>
                                            ) : (
                                                <>
                                                    <XCircle className="w-4 h-4 text-slate-400" />
                                                    <span className="text-sm text-slate-400">Disabled</span>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                    {new Date(user.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                    {editingId === user.id ? (
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleSave(user.id)}
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
                                                onClick={() => handleEdit(user)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(user.id)}
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
            </div>
            <ConfirmationModal
                isOpen={deletingUserId !== null}
                onClose={() => setDeletingUserId(null)}
                onConfirm={handleDeleteConfirm}
                title="Delete User"
                message="Are you sure you want to delete this user? This will also delete all their todos."
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
                isPending={isPending}
            />
        </div>
    );
}

