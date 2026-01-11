"use client";

import { useState } from "react";
import { toast } from "sonner";
import { reportTopic, reportComment } from "@/lib/actions";

interface ReportModalProps {
    targetId: string;
    type: "topic" | "comment";
    trigger?: React.ReactNode;
}

export default function ReportModal({ targetId, type, trigger }: ReportModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [reason, setReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reason.trim()) return;

        setIsSubmitting(true);
        try {
            let result;
            if (type === "topic") {
                result = await reportTopic(targetId, reason);
            } else {
                result = await reportComment(targetId, reason);
            }

            if (result?.alreadyReported) {
                toast.info("You have already reported this content", {
                    description: "Our moderators are already reviewing it."
                });
            } else {
                toast.success("Report submitted successfully");
            }

            setIsOpen(false);
            setReason("");
        } catch (error: any) {
            toast.error(error.message || "Failed to submit report");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <div onClick={() => setIsOpen(true)}>
                {trigger || (
                    <button className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors uppercase tracking-widest">
                        Report
                    </button>
                )}
            </div>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
                        <div className="p-8">
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Report Content</h2>
                            <p className="text-slate-500 mb-6 font-medium">Please provide a reason for reporting this {type}.</p>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <textarea
                                        autoFocus
                                        required
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        placeholder="Explain why this content should be reviewed..."
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-red-500/50 text-slate-900 dark:text-white placeholder:text-slate-400 font-medium transition-all"
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsOpen(false)}
                                        className="flex-1 h-12 rounded-2xl font-bold uppercase tracking-widest text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || !reason.trim()}
                                        className="flex-3 h-12 bg-red-500 hover:bg-red-600 text-white font-black rounded-2xl uppercase tracking-widest text-xs transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100"
                                    >
                                        {isSubmitting ? "Submitting..." : "Submit Report"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
