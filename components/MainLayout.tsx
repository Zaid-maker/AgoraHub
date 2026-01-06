import Link from 'next/link';
import { getCategories } from '@/lib/actions';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import UserNav from './UserNav';

export default async function MainLayout({ children }: { children: React.ReactNode }) {
    const categories = await getCategories();
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-[#020617] text-zinc-900 dark:text-zinc-50 selection:bg-gold/20">
            {/* Navbar */}
            <nav className="sticky top-0 z-50 w-full glass border-b border-white/10 dark:border-slate-800/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-10">
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="relative w-10 h-10 bg-[#0F172A] dark:bg-gold rounded-xl flex items-center justify-center overflow-hidden shadow-lg shadow-gold/10 group-hover:scale-105 transition-transform duration-300">
                                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent" />
                                <span className="text-white dark:text-navy font-black text-xl z-10">A</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="font-black text-xl tracking-tight leading-none uppercase dark:text-white">Agora</span>
                                <span className="text-[10px] font-bold text-gold tracking-[0.2em] uppercase mt-0.5">Forum Hub</span>
                            </div>
                        </Link>

                        <div className="hidden md:flex items-center gap-1 text-sm font-bold uppercase tracking-widest">
                            <Link href="/" className="px-4 py-2 text-slate-500 hover:text-gold transition-colors relative group">
                                Discussions
                                <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-gold scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                            </Link>
                            <Link href="#" className="px-4 py-2 text-slate-500 hover:text-gold transition-colors relative group">
                                Categories
                                <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-gold scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                            </Link>
                            <Link href="#" className="px-4 py-2 text-slate-500 hover:text-gold transition-colors relative group">
                                Members
                                <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-gold scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                            </Link>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {session ? (
                            <UserNav user={session.user} />
                        ) : (
                            <div className="flex items-center gap-2">
                                <Link
                                    href="/sign-in"
                                    className="h-11 px-6 flex items-center text-sm font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors uppercase tracking-widest"
                                >
                                    Login
                                </Link>
                                <Link
                                    href="/sign-up"
                                    className="h-11 px-6 flex items-center text-sm font-black bg-gold hover:bg-gold-hover text-navy rounded-xl transition-all shadow-lg shadow-gold/20 hover:scale-[1.02] active:scale-[0.98] uppercase tracking-widest"
                                >
                                    Join Community
                                </Link>
                            </div>
                        )}
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
