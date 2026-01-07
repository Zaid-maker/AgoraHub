"use client";

import { useState } from "react";
import { createComment } from "@/lib/actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CommentFormProps {
    topicId: string;
    parentId?: string;
    placeholder?: string;
    onSuccess?: () => void;
    className?: string;
    autoFocus?: boolean;
}

export default function CommentForm({
    topicId,
    parentId,
    placeholder = "Add to the discussion...",
    onSuccess,
    className,
    autoFocus = false
}: CommentFormProps) {
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!content.trim()) return;

        setLoading(true);
        const formData = new FormData();
        formData.append("content", content);
        formData.append("topicId", topicId);
        if (parentId) formData.append("parentId", parentId);

        try {
            await createComment(formData);
            setContent("");
            toast.success("Reply posted legendarily!");
            onSuccess?.();
        } catch (error: any) {
            toast.error(error.message || "Failed to post reply");
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className={cn("space-y-4", className)}>
            <div className="relative group">
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={placeholder}
                    autoFocus={autoFocus}
                    rows={parentId ? 3 : 5}
                    className="w-full px-6 py-4 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 focus:border-gold/50 outline-none transition-all font-serif italic text-lg text-slate-700 dark:text-slate-300 placeholder:text-slate-400 resize-none shadow-sm group-hover:shadow-md"
                />
                <div className="absolute inset-0 rounded-3xl pointer-events-none border border-gold/0 group-focus-within:border-gold/20 transition-all" />
            </div>

            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={loading || !content.trim()}
                    className="h-12 px-8 bg-gold hover:bg-gold-hover text-navy font-black rounded-2xl shadow-lg shadow-gold/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 uppercase tracking-widest text-sm"
                >
                    {loading ? (
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-navy animate-bounce [animation-delay:-0.3s]" />
                            <div className="w-1.5 h-1.5 rounded-full bg-navy animate-bounce [animation-delay:-0.15s]" />
                            <div className="w-1.5 h-1.5 rounded-full bg-navy animate-bounce" />
                        </div>
                    ) : "Post Reply"}
                </button>
            </div>
        </form>
    );
}
