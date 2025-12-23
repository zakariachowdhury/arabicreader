import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import {
    getDailyUserActivity,
    getPracticeMetrics,
    getTestResults,
    getUserActivitySummary,
} from "../actions";
import {
    DailyActivityChart,
    ActiveUsersChart,
    AccuracyChart,
    TestScoresChart,
    PracticeByLessonChart,
} from "@/components/admin/ActivityCharts";
import { BarChart3, TrendingUp, Users, Target } from "lucide-react";
import { DateRangeFilter } from "@/components/admin/DateRangeFilter";

export default async function AnalyticsPage({
    searchParams,
}: {
    searchParams: { startDate?: string; endDate?: string };
}) {
    const admin = await isAdmin();

    if (!admin) {
        redirect("/");
    }

    // Default to last 30 days
    const endDate = searchParams.endDate
        ? new Date(searchParams.endDate)
        : new Date();
    const startDate = searchParams.startDate
        ? new Date(searchParams.startDate)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Fetch all analytics data
    const [dailyActivity, practiceMetrics, testResults, summary] =
        await Promise.all([
            getDailyUserActivity(startDate, endDate),
            getPracticeMetrics(undefined, startDate, endDate),
            getTestResults(undefined, startDate, endDate),
            getUserActivitySummary(undefined, startDate, endDate),
        ]);

    // Calculate average test score
    const averageTestScore =
        testResults.length > 0
            ? testResults.reduce((sum, result) => sum + result.score, 0) /
              testResults.length
            : 0;

    return (
        <main className="py-12 px-4 sm:px-6 lg:px-8 font-sans bg-white min-h-screen">
            <div className="max-w-7xl mx-auto">
                <header className="mb-10">
                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl mb-2">
                        Analytics Dashboard
                    </h1>
                    <p className="text-slate-500">
                        View user activity, practice metrics, and test results
                    </p>
                </header>

                {/* Date Range Filter */}
                <div className="mb-8">
                    <DateRangeFilter
                        defaultStartDate={startDate.toISOString().split("T")[0]}
                        defaultEndDate={endDate.toISOString().split("T")[0]}
                    />
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-blue-100 rounded-xl">
                                <BarChart3 className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-1">
                            {summary.totalWordsReviewed.toLocaleString()}
                        </h3>
                        <p className="text-sm text-slate-500">Words Reviewed</p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-emerald-100 rounded-xl">
                                <TrendingUp className="w-6 h-6 text-emerald-600" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-1">
                            {summary.averageAccuracy.toFixed(1)}%
                        </h3>
                        <p className="text-sm text-slate-500">Average Accuracy</p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-purple-100 rounded-xl">
                                <Users className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-1">
                            {summary.totalPracticeSessions.toLocaleString()}
                        </h3>
                        <p className="text-sm text-slate-500">Practice Sessions</p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-amber-100 rounded-xl">
                                <Target className="w-6 h-6 text-amber-600" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-1">
                            {summary.totalTestSessions.toLocaleString()}
                        </h3>
                        <p className="text-sm text-slate-500">Test Sessions</p>
                    </div>
                </div>

                {/* Daily Activity Chart */}
                <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 mb-8">
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">
                        Daily Activity
                    </h2>
                    <DailyActivityChart data={dailyActivity} />
                </div>

                {/* Active Users Chart */}
                <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 mb-8">
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">
                        Active Users
                    </h2>
                    <ActiveUsersChart data={dailyActivity} />
                </div>

                {/* Practice Metrics Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">
                            Practice Accuracy
                        </h2>
                        <AccuracyChart accuracy={practiceMetrics.accuracyRate} />
                        <div className="mt-4 text-center">
                            <p className="text-sm text-slate-500">
                                Total Words Practiced:{" "}
                                {practiceMetrics.totalWordsPracticed.toLocaleString()}
                            </p>
                            <p className="text-sm text-slate-500 mt-1">
                                Correct: {practiceMetrics.totalCorrect.toLocaleString()} |{" "}
                                Incorrect: {practiceMetrics.totalIncorrect.toLocaleString()}
                            </p>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">
                            Practice by Lesson
                        </h2>
                        {practiceMetrics.practiceActivityByLesson.length > 0 ? (
                            <PracticeByLessonChart
                                data={practiceMetrics.practiceActivityByLesson}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-[300px] text-slate-500">
                                No practice data available
                            </div>
                        )}
                    </div>
                </div>

                {/* Test Results Section */}
                {testResults.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 mb-8">
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">
                            Test Scores Over Time
                        </h2>
                        <TestScoresChart data={testResults} />
                        <div className="mt-4 text-center">
                            <p className="text-sm text-slate-500">
                                Average Test Score: {averageTestScore.toFixed(1)}%
                            </p>
                            <p className="text-sm text-slate-500 mt-1">
                                Total Tests: {testResults.length}
                            </p>
                        </div>
                    </div>
                )}

                {/* Detailed Stats Table */}
                <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">
                        Practice Statistics
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className="text-left py-3 px-4 text-slate-700 font-semibold">
                                        Lesson
                                    </th>
                                    <th className="text-left py-3 px-4 text-slate-700 font-semibold">
                                        Words Practiced
                                    </th>
                                    <th className="text-left py-3 px-4 text-slate-700 font-semibold">
                                        Accuracy
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {practiceMetrics.practiceActivityByLesson.length > 0 ? (
                                    practiceMetrics.practiceActivityByLesson.map(
                                        (item) => (
                                            <tr
                                                key={item.lessonId}
                                                className="border-b border-slate-100 hover:bg-slate-50"
                                            >
                                                <td className="py-3 px-4 text-slate-900">
                                                    {item.lessonTitle}
                                                </td>
                                                <td className="py-3 px-4 text-slate-600">
                                                    {item.wordsPracticed}
                                                </td>
                                                <td className="py-3 px-4 text-slate-600">
                                                    {item.accuracy.toFixed(1)}%
                                                </td>
                                            </tr>
                                        )
                                    )
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={3}
                                            className="py-8 text-center text-slate-500"
                                        >
                                            No practice data available
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </main>
    );
}

