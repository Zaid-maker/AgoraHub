"use client";

import { useState } from "react";
import { updateProfile } from "@/lib/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface EditProfileModalProps {
    user: {
        id: string;
        name: string;
        username?: string | null;
        bio?: string | null;
    };
    onClose: () => void;
}

export default function EditProfileModal({ user, onClose }: EditProfileModalProps) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);

        try {
            await updateProfile(formData);
            toast.success("Profile updated legendarily!");
            router.refresh();
            onClose();
        } catch (error: any) {
            toast.error(error.message || "Failed to update profile");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-navy/60 backdrop-blur-md" onClick={onClose} />

            <div className="relative w-full max-w-xl glass p-10 rounded-[3rem] border border-white/20 dark:border-slate-800 shadow-2xl animate-in fade-in zoom-in duration-300">
                <div className="mb-8">
                    <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase leading-none">
                        Refine Your Legend
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium italic">
                        Update your identity within the Agora community.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="text-xs font-black text-gold uppercase tracking-widest block mb-2">Display Name</label>
                        <input
                            name="name"
                            defaultValue={user.name}
                            required
                            className="w-full h-14 px-6 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-transparent focus:border-gold/50 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all font-bold text-slate-900 dark:text-white"
                            placeholder="Your full name"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-black text-gold uppercase tracking-widest block mb-2">Unique Username</label>
                        <div className="relative">
                            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold">@</span>
                            <input
                                name="username"
                                defaultValue={user.username || ""}
                                className="w-full h-14 pl-11 pr-6 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-transparent focus:border-gold/50 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all font-bold text-slate-900 dark:text-white"
                                placeholder="unique-id"
                            />
                        </div>
                        <p className="text-[10px] text-slate-500 mt-2 italic font-medium px-2">Used for your public profile link: /profile/username</p>
                    </div>

                    <div>
                        <label className="text-xs font-black text-gold uppercase tracking-widest block mb-2">Your Story (Bio)</label>
                        <textarea
                            name="bio"
                            defaultValue={user.bio || ""}
                            rows={4}
                            className="w-full px-6 py-4 rounded-3xl bg-slate-100 dark:bg-slate-800 border-2 border-transparent focus:border-gold/50 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all font-bold text-slate-900 dark:text-white resize-none"
                            placeholder="Share your expertise, interests, or hub philosophy..."
                        />
                    </div>

                    <div className="flex items-center gap-4 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 h-14 rounded-2xl border-2 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-[2] h-14 rounded-2xl bg-gold text-navy font-black uppercase tracking-widest hover:bg-gold-hover shadow-lg shadow-gold/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-navy animate-bounce [animation-delay:-0.3s]" />
                                    <div className="w-2 h-2 rounded-full bg-navy animate-bounce [animation-delay:-0.15s]" />
                                    <div className="w-2 h-2 rounded-full bg-navy animate-bounce" />
                                </div>
                            ) : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
