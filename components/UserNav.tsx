"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

import Link from "next/link";

interface UserNavProps {
    user: {
        id: string;
        name: string;
        email: string;
        image?: string | null;
        username?: string | null;
    };
}

export default function UserNav({ user }: UserNavProps) {
    const router = useRouter();

    const handleSignOut = async () => {
        await authClient.signOut({
            fetchOptions: {
                onSuccess: () => {
                    router.push("/");
                    router.refresh();
                },
            },
        });
    };

    return (
        <div className="flex items-center gap-4">
            <Link
                href={`/profile/${user.username || user.id}`}
                className="flex items-center gap-3 pl-2 pr-4 py-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 group hover:border-gold/50 hover:bg-white dark:hover:bg-slate-800 transition-all cursor-pointer shadow-sm hover:shadow-md"
            >
                <div className="w-8 h-8 rounded-xl overflow-hidden shadow-inner ring-2 ring-gold/10 group-hover:ring-gold/30 transition-all">
                    <img
                        src={user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
                        alt={user.name}
                        className="w-full h-full object-cover"
                    />
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-widest text-slate-500 font-black leading-none mb-1 group-hover:text-gold transition-colors">My Profile</span>
                    <span className="text-sm font-black truncate max-w-[120px] dark:text-white leading-none capitalize">{user.name}</span>
                </div>
            </Link>

            <button
                onClick={handleSignOut}
                className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-all group"
                title="Sign Out"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
            </button>
        </div>
    );
}
