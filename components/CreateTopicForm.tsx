"use client";

import { useState } from "react";
import { createTopic } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Category {
    id: string;
    name: string;
}

export default function CreateTopicForm({ categories }: { categories: Category[] }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError("");

        const formData = new FormData(e.currentTarget);

        try {
            const result = await createTopic(formData);
            if (result) {
                toast.success("Discussion Launched!", {
                    description: "Your new topic is now live on the hub."
                });
                router.push(`/topic/${result.id}`);
                router.refresh();
            }
        } catch (err: any) {
            setError(err.message || "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm rounded-2xl font-medium">
                    {error}
                </div>
            )}

            <div className="space-y-3">
                <label className="text-xs font-black text-slate-500 dark:text-slate-400 ml-1 uppercase tracking-[0.2em]">Discussion Title</label>
                <input
                    name="title"
                    required
                    className="w-full h-14 px-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gold transition-all text-lg font-bold text-slate-900 dark:text-white placeholder:text-slate-400 shadow-inner"
                    placeholder="Give your discussion a compelling title..."
                />
            </div>

            <div className="space-y-3">
                <label className="text-xs font-black text-slate-500 dark:text-slate-400 ml-1 uppercase tracking-[0.2em]">Select Category</label>
                <div className="relative">
                    <select
                        name="categoryId"
                        required
                        className="w-full h-14 px-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gold transition-all text-slate-700 dark:text-slate-300 appearance-none cursor-pointer font-bold shadow-inner"
                    >
                        <option value="" disabled selected>Which area does this belong to?</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                <label className="text-xs font-black text-slate-500 dark:text-slate-400 ml-1 uppercase tracking-[0.2em]">Content</label>
                <textarea
                    name="content"
                    required
                    rows={12}
                    className="w-full p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] focus:outline-none focus:ring-2 focus:ring-gold transition-all text-slate-800 dark:text-slate-200 text-lg leading-relaxed placeholder:text-slate-400 resize-none shadow-inner"
                    placeholder="Elaborate on your topic. Feel free to be detailed..."
                />
            </div>

            <div className="flex items-center justify-between pt-6">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-6 h-12 font-bold text-slate-400 hover:text-navy dark:hover:text-white transition-colors uppercase tracking-widest text-xs"
                >
                    Discard Changes
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="px-12 h-16 bg-gold hover:bg-gold-hover text-navy font-black rounded-2xl shadow-2xl shadow-gold/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 uppercase tracking-[0.1em] text-sm"
                >
                    {loading ? "Publishing..." : "Launch Discussion"}
                </button>
            </div>
        </form>
    );
}
