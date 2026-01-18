import Link from 'next/link';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import UserNav from './UserNav';
import CreateTopicButton from './CreateTopicButton';
import { getSubscriptionStatus } from '@/lib/actions';
import Paywall from './Paywall';

export default async function MainLayout({ children }: { children: React.ReactNode }) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    const subStatus = await getSubscriptionStatus();

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-[#020617] text-zinc-900 dark:text-zinc-50 selection:bg-gold/20">
            {!subStatus.hasAccess && session && (
                <Paywall />
            )}
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
                        <CreateTopicButton
                            className="h-10 px-4 sm:px-6 bg-slate-100 dark:bg-slate-800/50 hover:bg-gold dark:hover:bg-gold text-slate-600 dark:text-slate-400 hover:text-navy dark:hover:text-navy border border-slate-200 dark:border-slate-700 hover:border-gold dark:hover:border-gold transition-all shadow-none hover:shadow-gold/10 !text-[10px]"
                        />

                        {session ? (
                            <UserNav user={session.user} subscriptionStatus={subStatus} />
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

            <main className="max-w-7xl mx-auto px-4 py-8">
                {children}
            </main>
        </div>
    );
}
