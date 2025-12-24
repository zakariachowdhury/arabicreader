import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles, MessageSquare, Zap } from "lucide-react";
import { getBooksWithStats } from "@/app/actions";
import { BooksSection } from "@/components/BooksSection";

export async function LandingPage() {
    const books = await getBooksWithStats();

    return (
        <div className="bg-white">
            {/* Hero Section */}
            <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32 flex flex-col items-center text-center">
                <h1 className="text-5xl sm:text-7xl font-extrabold text-slate-900 tracking-tight mb-8 max-w-4xl leading-[1.1]">
                    Master Arabic with <br /><span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">AI-powered</span> reading.
                </h1>
                <p className="text-xl text-slate-500 max-w-2xl mb-10 leading-relaxed font-light">
                    {process.env.NEXT_PUBLIC_APP_NAME || "Arabic Reader"} combines beautiful design with intelligent AI assistance. Read Arabic books, learn vocabulary, and track your progress with personalized guidance.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                    <Link href="/signup" className="px-8 py-4 bg-blue-600 text-white rounded-2xl text-lg font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-500/25 group">
                        Start for free
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link href="/login" className="px-8 py-4 bg-white text-slate-900 rounded-2xl text-lg font-bold hover:bg-slate-50 transition-all border border-slate-200 flex items-center justify-center shadow-lg shadow-slate-200/20">
                        Start Reading
                    </Link>
                </div>
            </header>

            {/* AI Assistant Section */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    {/* Left side - Image */}
                    <div className="relative w-full aspect-square rounded-3xl overflow-hidden border border-slate-200 shadow-xl">
                        <Image 
                            src="/ai-assistant.png" 
                            alt="AI Assistant" 
                            fill
                            className="object-cover"
                            priority
                        />
                    </div>

                    {/* Right side - Content */}
                    <div>
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full mb-6">
                            <Sparkles className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-semibold text-blue-700">AI-Powered Learning</span>
                        </div>
                        <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-6 tracking-tight">
                            Your Personal Arabic Learning Assistant
                        </h2>
                        <p className="text-lg text-slate-600 mb-8 leading-relaxed font-light">
                            Get instant help with vocabulary, grammar, and reading comprehension. Our AI assistant understands context and provides personalized guidance to accelerate your learning journey.
                        </p>
                        
                        <div className="space-y-4 mb-8">
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                    <MessageSquare className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 mb-1">Ask Questions</h3>
                                    <p className="text-slate-600 text-sm">Get instant answers about Arabic vocabulary, grammar, and context.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                    <Zap className="w-6 h-6 text-purple-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 mb-1">Smart Navigation</h3>
                                    <p className="text-slate-600 text-sm">Quickly jump to lessons, vocabulary, and practice exercises.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                                    <Sparkles className="w-6 h-6 text-emerald-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 mb-1">Personalized Guidance</h3>
                                    <p className="text-slate-600 text-sm">Receive tailored practice suggestions based on your progress.</p>
                                </div>
                            </div>
                        </div>

                        <Link href="/signup" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg shadow-blue-500/25">
                            Try AI Assistant
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Books Section */}
            <section className="bg-gradient-to-br from-blue-50 via-purple-50 to-blue-50 py-24 border-t border-slate-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-6 tracking-tight">
                            Available Books
                        </h2>
                        <p className="text-slate-600 max-w-2xl mx-auto text-lg font-light leading-relaxed">
                            Explore our collection of Arabic books, each organized into structured units and lessons to help you learn effectively.
                        </p>
                    </div>

                    <BooksSection books={books} />
                </div>
            </section>

            {/* CTA Section */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
                <div className="bg-blue-600 rounded-[3rem] p-8 sm:p-20 text-center relative overflow-hidden shadow-2xl shadow-blue-500/30">
                    <div className="relative z-10">
                        <h2 className="text-3xl sm:text-5xl font-bold text-white mb-6 tracking-tight">Ready to master Arabic?</h2>
                        <p className="text-blue-100 text-lg mb-10 max-w-xl mx-auto font-light leading-relaxed">
                            Join learners who are improving their Arabic reading skills with {process.env.NEXT_PUBLIC_APP_NAME || "Arabic Reader"}.
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
