import Link from "next/link";
import { CheckCircle2, Zap, Shield, ArrowRight, Sparkles, Bot, MessageSquare, Wand2, FolderKanban, Users, Settings, Lock, Mail, Palette, Star, Trash2, Edit2, Plus, Eye, EyeOff, RefreshCw } from "lucide-react";

export function LandingPage() {
    return (
        <div className="bg-white">
            {/* Hero Section */}
            <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32 flex flex-col items-center text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider mb-8 border border-blue-200">
                    <Sparkles size={14} />
                    <span>Now with AI Assistant</span>
                </div>
                <h1 className="text-5xl sm:text-7xl font-extrabold text-slate-900 tracking-tight mb-8 max-w-4xl leading-[1.1]">
                    Manage tasks with <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">AI-powered</span> simplicity.
                </h1>
                <p className="text-xl text-slate-500 max-w-2xl mb-10 leading-relaxed font-light">
                    {process.env.NEXT_PUBLIC_APP_NAME || "TaskFlow"} combines beautiful design with intelligent AI assistance. Just tell the AI what you need, and watch your tasks get organized automatically.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                    <Link href="/signup" className="px-8 py-4 bg-blue-600 text-white rounded-2xl text-lg font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-500/25 group">
                        Start for free
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link href="/login" className="px-8 py-4 bg-white text-slate-900 rounded-2xl text-lg font-bold hover:bg-slate-50 transition-all border border-slate-200 flex items-center justify-center shadow-lg shadow-slate-200/20">
                        View Demo
                    </Link>
                </div>
            </header>

            {/* AI Assistant Feature Section */}
            <section className="bg-gradient-to-br from-blue-50 via-purple-50 to-blue-50 py-24 border-t border-slate-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full text-sm font-bold mb-6">
                            <Sparkles size={18} />
                            <span>AI-Powered Task Management</span>
                        </div>
                        <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-6 tracking-tight">
                            Your AI Assistant is Always Ready
                        </h2>
                        <p className="text-slate-600 max-w-2xl mx-auto text-lg font-light leading-relaxed">
                            Simply describe what you want to do in natural language. The AI understands context, manages multiple tasks at once, and learns from your conversation history.
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl shadow-blue-500/10 hover:shadow-blue-500/20 transition-all">
                            <div className="flex items-start gap-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                                    <MessageSquare className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-2">Natural Language Commands</h3>
                                    <p className="text-slate-600 font-light leading-relaxed mb-4">
                                        Talk to your AI assistant like you would to a colleague. No need to learn complex commands or interfaces.
                                    </p>
                                    <div className="space-y-2 text-sm text-slate-500">
                                        <p className="flex items-center gap-2">
                                            <span className="text-blue-600">•</span> "Add tasks: Buy groceries, Call mom, Finish report"
                                        </p>
                                        <p className="flex items-center gap-2">
                                            <span className="text-blue-600">•</span> "Complete the first two tasks"
                                        </p>
                                        <p className="flex items-center gap-2">
                                            <span className="text-blue-600">•</span> "Mark task 5 as done and delete all completed tasks"
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl shadow-blue-500/10 hover:shadow-blue-500/20 transition-all">
                            <div className="flex items-start gap-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                                    <Wand2 className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-2">Smart Context Understanding</h3>
                                    <p className="text-slate-600 font-light leading-relaxed mb-4">
                                        The AI remembers your conversation and understands references. Say "complete that task" and it knows exactly what you mean.
                                    </p>
                                    <div className="space-y-2 text-sm text-slate-500">
                                        <p className="flex items-center gap-2">
                                            <span className="text-purple-600">•</span> Remembers previous messages
                                        </p>
                                        <p className="flex items-center gap-2">
                                            <span className="text-purple-600">•</span> Understands "first", "second", "last" references
                                        </p>
                                        <p className="flex items-center gap-2">
                                            <span className="text-purple-600">•</span> Handles multiple actions in one request
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden shadow-2xl">
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <Bot className="w-8 h-8" />
                                <h3 className="text-2xl font-bold">What Can Your AI Assistant Do?</h3>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                <div className="flex items-center gap-3">
                                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                                    <span className="text-blue-50">Add multiple tasks at once</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                                    <span className="text-blue-50">Edit task descriptions</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                                    <span className="text-blue-50">Mark tasks as complete</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                                    <span className="text-blue-50">Reactivate completed tasks</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                                    <span className="text-blue-50">Delete tasks selectively</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                                    <span className="text-blue-50">Answer questions about your tasks</span>
                                </div>
                            </div>
                            <p className="text-blue-100 text-sm font-light">
                                All accessible through a floating chat button that follows you throughout the app. Choose from multiple AI models to find the one that works best for you.
                            </p>
                        </div>
                        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-white/10 rounded-full blur-[80px]"></div>
                        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-64 h-64 bg-white/10 rounded-full blur-[80px]"></div>
                    </div>
                </div>
            </section>

            {/* Comprehensive Features Section */}
            <section className="bg-white py-24 border-t border-slate-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-6 tracking-tight">Everything you need to stay organized</h2>
                        <p className="text-slate-500 max-w-2xl mx-auto text-lg font-light leading-relaxed">
                            Powerful features designed to help you manage your tasks efficiently and stay productive without the clutter.
                        </p>
                    </div>

                    {/* Task Management Features */}
                    <div className="mb-20">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                                <CheckCircle2 className="w-6 h-6 text-blue-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900">Task Management</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-6 rounded-2xl border border-blue-200/50 hover:shadow-lg transition-all">
                                <div className="flex items-center gap-3 mb-3">
                                    <Plus className="w-5 h-5 text-blue-600" />
                                    <h4 className="font-bold text-slate-900">Quick Add</h4>
                                </div>
                                <p className="text-sm text-slate-600 font-light">
                                    Instantly add new tasks with a simple form. Assign them to groups or keep them uncategorized.
                                </p>
                            </div>
                            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-6 rounded-2xl border border-emerald-200/50 hover:shadow-lg transition-all">
                                <div className="flex items-center gap-3 mb-3">
                                    <Edit2 className="w-5 h-5 text-emerald-600" />
                                    <h4 className="font-bold text-slate-900">Edit & Update</h4>
                                </div>
                                <p className="text-sm text-slate-600 font-light">
                                    Modify task descriptions anytime. Keep your tasks up-to-date as priorities change.
                                </p>
                            </div>
                            <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 p-6 rounded-2xl border border-purple-200/50 hover:shadow-lg transition-all">
                                <div className="flex items-center gap-3 mb-3">
                                    <CheckCircle2 className="w-5 h-5 text-purple-600" />
                                    <h4 className="font-bold text-slate-900">Complete & Reactivate</h4>
                                </div>
                                <p className="text-sm text-slate-600 font-light">
                                    Mark tasks as done with one click. Reactivate completed tasks if needed.
                                </p>
                            </div>
                            <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 p-6 rounded-2xl border border-amber-200/50 hover:shadow-lg transition-all">
                                <div className="flex items-center gap-3 mb-3">
                                    <Eye className="w-5 h-5 text-amber-600" />
                                    <h4 className="font-bold text-slate-900">Organized Views</h4>
                                </div>
                                <p className="text-sm text-slate-600 font-light">
                                    Separate views for active and completed tasks. See what needs attention at a glance.
                                </p>
                            </div>
                            <div className="bg-gradient-to-br from-red-50 to-red-100/50 p-6 rounded-2xl border border-red-200/50 hover:shadow-lg transition-all">
                                <div className="flex items-center gap-3 mb-3">
                                    <Trash2 className="w-5 h-5 text-red-600" />
                                    <h4 className="font-bold text-slate-900">Smart Deletion</h4>
                                </div>
                                <p className="text-sm text-slate-600 font-light">
                                    Remove tasks you no longer need. Clean up your list and stay focused.
                                </p>
                            </div>
                            <div className="bg-gradient-to-br from-cyan-50 to-cyan-100/50 p-6 rounded-2xl border border-cyan-200/50 hover:shadow-lg transition-all">
                                <div className="flex items-center gap-3 mb-3">
                                    <RefreshCw className="w-5 h-5 text-cyan-600" />
                                    <h4 className="font-bold text-slate-900">Real-time Sync</h4>
                                </div>
                                <p className="text-sm text-slate-600 font-light">
                                    All changes sync instantly. Your tasks are always up-to-date across all devices.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Group Organization Features */}
                    <div className="mb-20">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                                <FolderKanban className="w-6 h-6 text-purple-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900">Group Organization</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-lg hover:shadow-xl transition-all">
                                <div className="flex items-center gap-3 mb-3">
                                    <Palette className="w-5 h-5 text-purple-600" />
                                    <h4 className="font-bold text-slate-900">Color-Coded Groups</h4>
                                </div>
                                <p className="text-sm text-slate-600 font-light mb-3">
                                    Create custom groups with your favorite colors. Visual organization makes it easy to find what you need.
                                </p>
                                <div className="flex gap-2">
                                    <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                                    <div className="w-4 h-4 rounded-full bg-green-500"></div>
                                    <div className="w-4 h-4 rounded-full bg-amber-500"></div>
                                    <div className="w-4 h-4 rounded-full bg-red-500"></div>
                                    <div className="w-4 h-4 rounded-full bg-purple-500"></div>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-lg hover:shadow-xl transition-all">
                                <div className="flex items-center gap-3 mb-3">
                                    <Star className="w-5 h-5 text-amber-600" />
                                    <h4 className="font-bold text-slate-900">Default Groups</h4>
                                </div>
                                <p className="text-sm text-slate-600 font-light">
                                    Set a default group for quick task creation. New tasks automatically join your preferred group.
                                </p>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-lg hover:shadow-xl transition-all">
                                <div className="flex items-center gap-3 mb-3">
                                    <Edit2 className="w-5 h-5 text-blue-600" />
                                    <h4 className="font-bold text-slate-900">Custom Descriptions</h4>
                                </div>
                                <p className="text-sm text-slate-600 font-light">
                                    Add descriptions to your groups. Keep context and purpose clear for each category.
                                </p>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-lg hover:shadow-xl transition-all">
                                <div className="flex items-center gap-3 mb-3">
                                    <Eye className="w-5 h-5 text-emerald-600" />
                                    <h4 className="font-bold text-slate-900">Task Counts</h4>
                                </div>
                                <p className="text-sm text-slate-600 font-light">
                                    See how many tasks are in each group at a glance. Track your progress visually.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Authentication & Security Features */}
                    <div className="mb-20">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                                <Shield className="w-6 h-6 text-emerald-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900">Security & Authentication</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-6 rounded-2xl border border-emerald-200/50 hover:shadow-lg transition-all">
                                <div className="flex items-center gap-3 mb-3">
                                    <Lock className="w-5 h-5 text-emerald-600" />
                                    <h4 className="font-bold text-slate-900">Secure Authentication</h4>
                                </div>
                                <p className="text-sm text-slate-600 font-light">
                                    Built with Better Auth for enterprise-grade security. Your account is protected with industry-standard encryption.
                                </p>
                            </div>
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-6 rounded-2xl border border-blue-200/50 hover:shadow-lg transition-all">
                                <div className="flex items-center gap-3 mb-3">
                                    <Mail className="w-5 h-5 text-blue-600" />
                                    <h4 className="font-bold text-slate-900">Email Verification</h4>
                                </div>
                                <p className="text-sm text-slate-600 font-light">
                                    Verify your email address to ensure account security. Resend verification emails anytime.
                                </p>
                            </div>
                            <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 p-6 rounded-2xl border border-purple-200/50 hover:shadow-lg transition-all">
                                <div className="flex items-center gap-3 mb-3">
                                    <RefreshCw className="w-5 h-5 text-purple-600" />
                                    <h4 className="font-bold text-slate-900">Password Reset</h4>
                                </div>
                                <p className="text-sm text-slate-600 font-light">
                                    Forgot your password? Reset it securely via email. Change your password anytime in settings.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* User Experience Features */}
                    <div className="mb-20">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                                <Zap className="w-6 h-6 text-amber-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900">User Experience</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-lg hover:shadow-xl transition-all">
                                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                                    <Zap className="w-6 h-6" />
                                </div>
                                <h4 className="font-bold text-slate-900 mb-2">Lightning Fast</h4>
                                <p className="text-sm text-slate-600 font-light">
                                    Zero latency. Instant task updates. Built with Next.js for optimal performance.
                                </p>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-lg hover:shadow-xl transition-all">
                                <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-4">
                                    <Settings className="w-6 h-6" />
                                </div>
                                <h4 className="font-bold text-slate-900 mb-2">Customizable</h4>
                                <p className="text-sm text-slate-600 font-light">
                                    Update your profile, change passwords, and manage your account settings easily.
                                </p>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-lg hover:shadow-xl transition-all">
                                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
                                    <Eye className="w-6 h-6" />
                                </div>
                                <h4 className="font-bold text-slate-900 mb-2">Clean Interface</h4>
                                <p className="text-sm text-slate-600 font-light">
                                    Minimalist design that focuses on your tasks. No distractions, just productivity.
                                </p>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-lg hover:shadow-xl transition-all">
                                <div className="w-12 h-12 bg-cyan-50 text-cyan-600 rounded-xl flex items-center justify-center mb-4">
                                    <RefreshCw className="w-6 h-6" />
                                </div>
                                <h4 className="font-bold text-slate-900 mb-2">Responsive Design</h4>
                                <p className="text-sm text-slate-600 font-light">
                                    Works beautifully on desktop, tablet, and mobile. Access your tasks anywhere.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Platform Features */}
                    <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-3xl p-8 sm:p-12 border border-slate-200">
                        <div className="text-center mb-8">
                            <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">Built for Modern Workflows</h3>
                            <p className="text-slate-600 max-w-2xl mx-auto font-light">
                                Powered by cutting-edge technology to deliver the best experience possible.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                                    <Zap className="w-8 h-8 text-blue-600" />
                                </div>
                                <h4 className="font-bold text-slate-900 mb-1">Next.js 16</h4>
                                <p className="text-xs text-slate-500">Latest framework</p>
                            </div>
                            <div className="text-center">
                                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                                    <Shield className="w-8 h-8 text-emerald-600" />
                                </div>
                                <h4 className="font-bold text-slate-900 mb-1">Better Auth</h4>
                                <p className="text-xs text-slate-500">Enterprise security</p>
                            </div>
                            <div className="text-center">
                                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                                    <Bot className="w-8 h-8 text-purple-600" />
                                </div>
                                <h4 className="font-bold text-slate-900 mb-1">OpenRouter</h4>
                                <p className="text-xs text-slate-500">AI integration</p>
                            </div>
                            <div className="text-center">
                                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                                    <RefreshCw className="w-8 h-8 text-cyan-600" />
                                </div>
                                <h4 className="font-bold text-slate-900 mb-1">Real-time</h4>
                                <p className="text-xs text-slate-500">Instant updates</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
                <div className="bg-blue-600 rounded-[3rem] p-8 sm:p-20 text-center relative overflow-hidden shadow-2xl shadow-blue-500/30">
                    <div className="relative z-10">
                        <h2 className="text-3xl sm:text-5xl font-bold text-white mb-6 tracking-tight">Ready to clear your backlog?</h2>
                        <p className="text-blue-100 text-lg mb-10 max-w-xl mx-auto font-light leading-relaxed">
                            Join thousands of users who have transformed their productivity with {process.env.NEXT_PUBLIC_APP_NAME || "TaskFlow"}.
                        </p>
                        <Link href="/signup" className="inline-flex px-10 py-4 bg-white text-blue-600 rounded-2xl text-lg font-bold hover:bg-slate-50 transition-all shadow-xl">
                            Get Started for Free
                        </Link>
                    </div>
                    {/* Decorative background elements */}
                    <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-80 h-80 bg-blue-400 rounded-full opacity-20 blur-[100px]"></div>
                    <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-80 h-80 bg-blue-800 rounded-full opacity-20 blur-[100px]"></div>
                </div>
            </section>
        </div>
    );
}
