import prisma from "@/lib/prisma";

export default async function AdminDashboard() {
    const [userCount, topicCount, commentCount] = await Promise.all([
        prisma.user.count(),
        prisma.topic.count(),
        prisma.comment.count()
    ]);

    const stats = [
        { label: "Total Users", value: userCount, color: "text-blue-500" },
        { label: "Active Topics", value: topicCount, color: "text-gold" },
        { label: "Total Comments", value: commentCount, color: "text-green-500" }
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Dashboard Overview</h1>
                <p className="text-slate-500">Welcome back, Admin. Here is what's happening today.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat) => (
                    <div key={stat.label} className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">{stat.label}</div>
                        <div className={`text-4xl font-black ${stat.color}`}>{stat.value}</div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">Quick Actions</h3>
                    <div className="flex gap-4">
                        <a href="/admin/users" className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-200 rounded-lg text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Manage Users</a>
                        <a href="/" className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-200 rounded-lg text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">View Site</a>
                    </div>
                </div>
            </div>
        </div>
    );
}
