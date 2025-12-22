"use client";

import { useState, useEffect, Suspense } from "react";
import { deleteUser, useSession, updateUser, changePassword } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, Loader2, Trash2, Shield, ArrowLeft, CheckCircle2, User, Lock, Settings as SettingsIcon } from "lucide-react";
import Link from "next/link";
import { checkIsAdmin, getOpenRouterConfig, updateOpenRouterConfig } from "./actions";

type SettingsTab = "profile" | "password" | "danger" | "admin";

function SettingsContent() {
    const { data: session, isPending } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const activeTab = (searchParams.get("tab") || "profile") as SettingsTab;

    // Profile state
    const [newName, setNewName] = useState("");
    const [isUpdatingName, setIsUpdatingName] = useState(false);
    const [updateSuccess, setUpdateSuccess] = useState(false);
    const [profileError, setProfileError] = useState<string | null>(null);

    // Password state
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [passwordSuccess, setPasswordSuccess] = useState(false);

    // Danger zone state
    const [isDeleting, setIsDeleting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [dangerError, setDangerError] = useState<string | null>(null);

    // Admin state
    const [isAdmin, setIsAdmin] = useState(false);
    const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
    const [openRouterApiKey, setOpenRouterApiKey] = useState("");
    const [supportedModels, setSupportedModels] = useState<string[]>([]);
    const [defaultModel, setDefaultModel] = useState("");
    const [newModel, setNewModel] = useState("");
    const [isLoadingConfig, setIsLoadingConfig] = useState(false);
    const [isSavingConfig, setIsSavingConfig] = useState(false);
    const [configError, setConfigError] = useState<string | null>(null);
    const [configSuccess, setConfigSuccess] = useState(false);

    // Set initial name when session loads
    useEffect(() => {
        if (session?.user?.name) {
            setNewName(session.user.name);
        }
    }, [session]);

    // Handle redirect in useEffect to avoid "update while rendering" error
    useEffect(() => {
        if (!isPending && !session) {
            router.push("/login");
        }
    }, [session, isPending, router]);

    // Check admin status
    useEffect(() => {
        async function checkAdmin() {
            if (session) {
                setIsCheckingAdmin(true);
                const result = await checkIsAdmin();
                setIsAdmin(result.isAdmin);
                setIsCheckingAdmin(false);

                // Redirect if non-admin tries to access admin tab
                if (!result.isAdmin && activeTab === "admin") {
                    router.push("/settings?tab=profile");
                    return;
                }

                // Load OpenRouter config if admin
                if (result.isAdmin) {
                    setIsLoadingConfig(true);
                    const config = await getOpenRouterConfig();
                    setOpenRouterApiKey(config.apiKey);
                    setSupportedModels(config.supportedModels);
                    setDefaultModel(config.defaultModel || "");
                    setIsLoadingConfig(false);
                }
            }
        }
        checkAdmin();
    }, [session, activeTab, router]);

    const setActiveTab = (tab: SettingsTab) => {
        // Prevent non-admins from accessing admin tab
        if (tab === "admin" && !isAdmin) {
            return;
        }
        router.push(`/settings?tab=${tab}`);
    };

    const handleUpdateName = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session || !newName || newName === session.user.name) return;

        setIsUpdatingName(true);
        setProfileError(null);
        setUpdateSuccess(false);

        const { error: updateError } = await updateUser({
            name: newName,
        });

        if (updateError) {
            setProfileError(updateError.message || "Failed to update name");
        } else {
            setUpdateSuccess(true);
            setTimeout(() => setUpdateSuccess(false), 3000);
            router.refresh();
        }
        setIsUpdatingName(false);
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError(null);
        setPasswordSuccess(false);

        // Validation
        if (!currentPassword || !newPassword || !confirmPassword) {
            setPasswordError("All fields are required");
            return;
        }

        if (newPassword.length < 8) {
            setPasswordError("New password must be at least 8 characters long");
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError("New passwords do not match");
            return;
        }

        if (currentPassword === newPassword) {
            setPasswordError("New password must be different from current password");
            return;
        }

        setIsChangingPassword(true);

        const { error: changeError } = await changePassword({
            currentPassword,
            newPassword,
        });

        if (changeError) {
            setPasswordError(changeError.message || "Failed to change password. Please check your current password.");
        } else {
            setPasswordSuccess(true);
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setTimeout(() => setPasswordSuccess(false), 3000);
        }
        setIsChangingPassword(false);
    };

    const handleDeleteAccount = async () => {
        setIsDeleting(true);
        setDangerError(null);

        const { error: deleteError } = await deleteUser();

        if (deleteError) {
            setDangerError(deleteError.message || "Failed to delete account");
            setIsDeleting(false);
            setShowConfirm(false);
        } else {
            router.push("/");
            router.refresh();
        }
    };

    const handleAddModel = () => {
        if (newModel.trim() && !supportedModels.includes(newModel.trim())) {
            setSupportedModels([...supportedModels, newModel.trim()]);
            setNewModel("");
        }
    };

    const handleRemoveModel = (model: string) => {
        setSupportedModels(supportedModels.filter((m) => m !== model));
    };

    const handleSaveOpenRouterConfig = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingConfig(true);
        setConfigError(null);
        setConfigSuccess(false);

        const result = await updateOpenRouterConfig({
            apiKey: openRouterApiKey,
            supportedModels: supportedModels,
            defaultModel: defaultModel,
        });

        if (result.error) {
            setConfigError(result.error.message);
        } else {
            setConfigSuccess(true);
            setTimeout(() => setConfigSuccess(false), 3000);
        }
        setIsSavingConfig(false);
    };

    if (isPending || !session) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
                <Loader2 className="animate-spin text-blue-600 mb-4" size={32} />
                <p className="text-slate-500 animate-pulse">
                    {!session && !isPending ? "Redirecting..." : "Loading settings..."}
                </p>
            </div>
        );
    }

    const sidebarItems = [
        { id: "profile" as SettingsTab, label: "Profile", icon: User },
        { id: "password" as SettingsTab, label: "Password", icon: Lock },
        { id: "danger" as SettingsTab, label: "Danger Zone", icon: Trash2 },
        ...(isAdmin ? [{ id: "admin" as SettingsTab, label: "Admin Settings", icon: Shield }] : []),
    ];

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="mb-6 flex items-center gap-4">
                <Link
                    href="/"
                    className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500 hover:text-slate-900"
                >
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Settings</h1>
            </div>

            <div className="flex gap-8">
                {/* Sidebar Navigation */}
                <aside className="w-64 flex-shrink-0">
                    <nav className="space-y-1">
                        {sidebarItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left rounded-lg transition-colors ${
                                        isActive
                                            ? "bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-600"
                                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                    }`}
                                >
                                    <Icon size={18} />
                                    <span className="text-sm">{item.label}</span>
                                </button>
                            );
                        })}
                    </nav>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 min-w-0">
                    {activeTab === "profile" && (
                        <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold text-slate-900 mb-2">Profile</h2>
                                <p className="text-sm text-slate-500">Manage your account details and information.</p>
                            </div>

                            <form onSubmit={handleUpdateName} className="space-y-6">
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                                        Full Name
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <User size={18} className="text-slate-400" />
                                        <input
                                            type="text"
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            placeholder={session.user.name}
                                            className="bg-transparent w-full focus:outline-none text-slate-900 font-medium placeholder:text-slate-400"
                                        />
                                    </div>
                                </div>

                                <div className="p-4 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                                        Email Address
                                    </label>
                                    <div className="flex items-center gap-3 py-1">
                                        <p className="text-slate-700 font-medium">{session.user.email}</p>
                                        <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
                                            Primary
                                        </span>
                                    </div>
                                </div>

                                {profileError && (
                                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-3">
                                        <AlertTriangle size={18} />
                                        <p>{profileError}</p>
                                    </div>
                                )}

                                <div className="flex items-center gap-4 pt-2">
                                    <button
                                        type="submit"
                                        disabled={isUpdatingName || !newName || newName === session.user.name}
                                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-200 text-white rounded-lg font-semibold transition-all shadow-sm active:scale-95 flex items-center gap-2"
                                    >
                                        {isUpdatingName ? <Loader2 className="animate-spin" size={18} /> : "Update Name"}
                                    </button>

                                    {updateSuccess && (
                                        <div className="flex items-center gap-2 text-emerald-600">
                                            <CheckCircle2 size={18} />
                                            <span className="text-sm font-semibold">Successfully updated!</span>
                                        </div>
                                    )}
                                </div>
                            </form>
                        </div>
                    )}

                    {activeTab === "password" && (
                        <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold text-slate-900 mb-2">Change Password</h2>
                                <p className="text-sm text-slate-500">Update your password to keep your account secure.</p>
                            </div>

                            <form onSubmit={handleChangePassword} className="space-y-6">
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 focus-within:ring-2 focus-within:ring-purple-500/20 focus-within:border-purple-500 transition-all">
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                                        Current Password
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <Lock size={18} className="text-slate-400" />
                                        <input
                                            type="password"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            placeholder="Enter your current password"
                                            className="bg-transparent w-full focus:outline-none text-slate-900 font-medium placeholder:text-slate-400"
                                        />
                                    </div>
                                </div>

                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 focus-within:ring-2 focus-within:ring-purple-500/20 focus-within:border-purple-500 transition-all">
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                                        New Password
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <Lock size={18} className="text-slate-400" />
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="Enter your new password (min. 8 characters)"
                                            className="bg-transparent w-full focus:outline-none text-slate-900 font-medium placeholder:text-slate-400"
                                        />
                                    </div>
                                </div>

                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 focus-within:ring-2 focus-within:ring-purple-500/20 focus-within:border-purple-500 transition-all">
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                                        Confirm New Password
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <Lock size={18} className="text-slate-400" />
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Confirm your new password"
                                            className="bg-transparent w-full focus:outline-none text-slate-900 font-medium placeholder:text-slate-400"
                                        />
                                    </div>
                                </div>

                                {passwordError && (
                                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-3">
                                        <AlertTriangle size={18} />
                                        <p>{passwordError}</p>
                                    </div>
                                )}

                                {passwordSuccess && (
                                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm flex items-center gap-3">
                                        <CheckCircle2 size={18} />
                                        <p className="font-semibold">Password changed successfully!</p>
                                    </div>
                                )}

                                <div className="flex items-center gap-4 pt-2">
                                    <button
                                        type="submit"
                                        disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                                        className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-200 text-white rounded-lg font-semibold transition-all shadow-sm active:scale-95 flex items-center gap-2"
                                    >
                                        {isChangingPassword ? (
                                            <Loader2 className="animate-spin" size={18} />
                                        ) : (
                                            "Change Password"
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {activeTab === "danger" && (
                        <div className="bg-white border border-red-200 rounded-xl p-8 shadow-sm">
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold text-red-900 mb-2">Danger Zone</h2>
                                <p className="text-sm text-red-600/80">Irreversible actions for your account.</p>
                            </div>

                            <div className="p-6 bg-red-50 border border-red-200 rounded-xl">
                                <h3 className="font-bold text-slate-900 mb-2">Delete Account</h3>
                                <p className="text-sm text-slate-600 mb-6">
                                    Once you delete your account, there is no going back. All your todos and personal
                                    information will be permanently removed from our servers.
                                </p>

                                {!showConfirm ? (
                                    <button
                                        onClick={() => setShowConfirm(true)}
                                        className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all shadow-sm active:scale-95"
                                    >
                                        Delete My Account
                                    </button>
                                ) : (
                                    <div className="p-6 bg-white rounded-xl border border-red-300">
                                        <div className="flex items-start gap-4 mb-6">
                                            <div className="mt-1 text-red-600">
                                                <AlertTriangle size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-red-900 mb-1">Are you absolutely sure?</h4>
                                                <p className="text-sm text-red-700/80">
                                                    This action is permanent and cannot be undone. You will lose access to
                                                    all your tasks.
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-4">
                                            <button
                                                onClick={handleDeleteAccount}
                                                disabled={isDeleting}
                                                className="flex-1 px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-200 text-white rounded-lg font-semibold transition-all shadow-sm flex items-center justify-center gap-2"
                                            >
                                                {isDeleting ? (
                                                    <Loader2 className="animate-spin" size={18} />
                                                ) : (
                                                    "Yes, Delete Everything"
                                                )}
                                            </button>
                                            <button
                                                onClick={() => setShowConfirm(false)}
                                                disabled={isDeleting}
                                                className="flex-1 px-6 py-2.5 bg-slate-200 hover:bg-slate-300 disabled:bg-slate-100 text-slate-700 rounded-lg font-semibold transition-all"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {dangerError && (
                                    <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded-xl text-red-700 text-sm flex items-center gap-3">
                                        <AlertTriangle size={18} />
                                        <p>{dangerError}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === "admin" && (
                        <>
                            {isCheckingAdmin ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="animate-spin text-blue-600" size={32} />
                                </div>
                            ) : isAdmin ? (
                        <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
                            <div className="mb-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <Shield className="text-amber-600" size={24} />
                                    <h2 className="text-2xl font-bold text-slate-900">Admin Settings</h2>
                                </div>
                                <p className="text-sm text-slate-500">Configure OpenRouter API settings for the application.</p>
                            </div>

                            {isLoadingConfig ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="animate-spin text-blue-600" size={32} />
                                </div>
                            ) : (
                                <form onSubmit={handleSaveOpenRouterConfig} className="space-y-6">
                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                                            OpenRouter API Key
                                        </label>
                                        <div className="flex items-center gap-3">
                                            <SettingsIcon size={18} className="text-slate-400" />
                                            <input
                                                type="password"
                                                value={openRouterApiKey}
                                                onChange={(e) => setOpenRouterApiKey(e.target.value)}
                                                placeholder="sk-or-v1-..."
                                                className="bg-transparent w-full focus:outline-none text-slate-900 font-medium placeholder:text-slate-400"
                                            />
                                        </div>
                                        <p className="text-xs text-slate-400 mt-2 ml-7">
                                            Your OpenRouter API key. Keep this secure.
                                        </p>
                                    </div>

                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                                            Supported Models
                                        </label>
                                        <p className="text-xs text-slate-400 mb-4">
                                            List of model IDs that users can select (e.g., openai/gpt-4, anthropic/claude-3-opus)
                                        </p>

                                        <div className="space-y-3">
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={newModel}
                                                    onChange={(e) => setNewModel(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") {
                                                            e.preventDefault();
                                                            handleAddModel();
                                                        }
                                                    }}
                                                    placeholder="e.g., openai/gpt-4"
                                                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleAddModel}
                                                    disabled={!newModel.trim() || supportedModels.includes(newModel.trim())}
                                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-200 text-white rounded-lg font-semibold transition-all text-sm"
                                                >
                                                    Add
                                                </button>
                                            </div>

                                            {supportedModels.length > 0 && (
                                                <div className="flex flex-wrap gap-2">
                                                    {[...supportedModels].sort().map((model) => (
                                                        <div
                                                            key={model}
                                                            className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-sm"
                                                        >
                                                            <span className="text-blue-900 font-medium">{model}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveModel(model)}
                                                                className="text-blue-600 hover:text-blue-800 transition-colors"
                                                                title="Remove model"
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {supportedModels.length === 0 && (
                                                <p className="text-sm text-slate-400 italic">No models added yet. Add models above.</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                                            Default Model
                                        </label>
                                        <p className="text-xs text-slate-400 mb-4">
                                            Select the default model that will be used when no specific model is chosen.
                                        </p>

                                        {supportedModels.length > 0 ? (
                                            <select
                                                value={defaultModel}
                                                onChange={(e) => setDefaultModel(e.target.value)}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 bg-white"
                                            >
                                                <option value="">-- Select Default Model --</option>
                                                {[...supportedModels].sort().map((model) => (
                                                    <option key={model} value={model}>
                                                        {model}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <p className="text-sm text-slate-400 italic">
                                                Add supported models above before selecting a default model.
                                            </p>
                                        )}
                                    </div>

                                    {configError && (
                                        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-3">
                                            <AlertTriangle size={18} />
                                            <p>{configError}</p>
                                        </div>
                                    )}

                                    {configSuccess && (
                                        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm flex items-center gap-3">
                                            <CheckCircle2 size={18} />
                                            <p className="font-semibold">OpenRouter configuration saved successfully!</p>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-4 pt-2">
                                        <button
                                            type="submit"
                                            disabled={isSavingConfig || !openRouterApiKey.trim()}
                                            className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-200 text-white rounded-lg font-semibold transition-all shadow-sm active:scale-95 flex items-center gap-2"
                                        >
                                            {isSavingConfig ? (
                                                <>
                                                    <Loader2 className="animate-spin" size={18} />
                                                    Saving...
                                                </>
                                            ) : (
                                                "Save Configuration"
                                            )}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                            ) : (
                                <div className="bg-white border border-red-200 rounded-xl p-8 shadow-sm">
                                    <div className="flex items-center gap-3 text-red-600 mb-4">
                                        <AlertTriangle size={24} />
                                        <h2 className="text-2xl font-bold">Access Denied</h2>
                                    </div>
                                    <p className="text-slate-600">
                                        You do not have permission to access admin settings. This section is restricted to administrators only.
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </main>
            </div>
        </div>
    );
}

export default function SettingsPage() {
    return (
        <Suspense
            fallback={
                <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
                    <Loader2 className="animate-spin text-blue-600 mb-4" size={32} />
                    <p className="text-slate-500 animate-pulse">Loading settings...</p>
                </div>
            }
        >
            <SettingsContent />
        </Suspense>
    );
}
