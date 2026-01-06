import Link from 'next/link';
import { getCategories } from '@/lib/actions';

export default async function MainLayout({ children }: { children: React.ReactNode }) {
    const categories = await getCategories();

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 selection:bg-zinc-200 dark:selection:bg-zinc-800">
            {/* Navbar */}
            <nav className="sticky top-0 z-50 w-full glass border-b">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-zinc-900 dark:bg-zinc-100 rounded-lg flex items-center justify-center">
                            <span className="text-white dark:text-black font-bold text-lg">A</span>
                        </div>
                        <span className="font-bold text-xl tracking-tight">Agora Hub</span>
                    </Link>

                    <div className="hidden md:flex items-center gap-6">
                        <Link href="/" className="text-sm font-medium hover:text-zinc-500 transition-colors">Discussions</Link>
                        <Link href="#" className="text-sm font-medium hover:text-zinc-500 transition-colors">Categories</Link>
                        <Link href="#" className="text-sm font-medium hover:text-zinc-500 transition-colors">Users</Link>
                    </div>

                    <div className="flex items-center gap-3">
                        <button className="h-9 px-4 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-600 dark:text-slate-400">
                            Sign In
                        </button>
                        <button className="h-9 px-5 text-sm font-bold bg-gold hover:bg-gold-hover text-navy rounded-full transition-all shadow-sm">
                            Join Agora
                        </button>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Sidebar */}
                <aside className="hidden lg:block lg:col-span-3 space-y-6">
                    <div className="space-y-4">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 px-3">Top Categories</h3>
                        <div className="space-y-1">
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg hover:bg-white dark:hover:bg-charcoal transition-colors group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700 group-hover:bg-gold transition-colors" />
                                        <span className="text-slate-600 dark:text-slate-400 group-hover:text-navy dark:group-hover:text-white">{cat.name}</span>
                                    </div>
                                    <span className="text-xs text-zinc-400 font-normal">
                                        {cat._count.topics}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="lg:col-span-9">
                    {children}
                </main>
            </div>
        </div>
    );
}
