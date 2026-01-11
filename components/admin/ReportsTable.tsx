"use client";

import { useState } from "react";
import { toast } from "sonner";
import { updateReportStatus } from "@/lib/admin-actions";
import Link from "next/link";

interface Report {
    id: string;
    reason: string;
    createdAt: Date;
    status: string;
    reporter: {
        name: string;
        email: string;
        username: string | null;
    };
    topic?: {
        id: string;
        title: string;
    } | null;
    comment?: {
        id: string;
        content: string;
    } | null;
}

export default function ReportsTable({ reports }: { reports: Report[] }) {
    const [localReports, setLocalReports] = useState<Report[]>(reports);
    const [loadingId, setLoadingId] = useState<string | null>(null);

    const handleStatusChange = async (reportId: string, newStatus: string) => {
        const previousReports = [...localReports];
        
        // Optimistic update
        setLocalReports(prev => prev.map(r => r.id === reportId ? { ...r, status: newStatus } : r));
        setLoadingId(reportId);

        try {
            await updateReportStatus(reportId, newStatus);
            toast.success("Report status updated");
        } catch (error) {
            // Rollback on error
            setLocalReports(previousReports);
            toast.error("Failed to update status");
        } finally {
            setLoadingId(null);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-left bg-slate-50 dark:bg-slate-900/50">
                    <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-xs uppercase font-bold text-slate-500">
                            <th className="px-6 py-4">Target Content</th>
                            <th className="px-6 py-4">Reporter</th>
                            <th className="px-6 py-4">Reason</th>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                        {localReports.map((report) => (
                            <tr key={report.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="px-6 py-4">
                                    {report.topic ? (
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-indigo-500 uppercase">Topic</span>
                                            <Link
                                                href={`/topic/${report.topic.id}`}
                                                className="font-bold text-slate-900 dark:text-white hover:underline"
                                            >
                                                {report.topic.title}
                                            </Link>
                                        </div>
                                    ) : report.comment ? (
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-emerald-500 uppercase">Comment</span>
                                            <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2">
                                                {report.comment.content}
                                            </p>
                                        </div>
                                    ) : (
                                        <span className="text-slate-400">Deleted Content</span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-bold text-slate-900 dark:text-white">{report.reporter.name}</div>
                                    <div className="text-xs text-slate-500">{report.reporter.email}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <p className="text-sm text-slate-600 dark:text-slate-400 italic">
                                        "{report.reason}"
                                    </p>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                                    {new Date(report.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold capitalize
                                        ${report.status === 'pending' ? 'bg-amber-100 text-amber-600' :
                                            report.status === 'resolved' ? 'bg-emerald-100 text-emerald-600' :
                                                'bg-slate-100 dark:bg-slate-800 text-slate-500'}
                                    `}>
                                        {report.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <select
                                        disabled={loadingId === report.id}
                                        value={report.status}
                                        onChange={(e) => handleStatusChange(report.id, e.target.value)}
                                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-300 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-gold/50"
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="resolved">Resolved</option>
                                        <option value="dismissed">Dismissed</option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {localReports.length === 0 && (
                    <div className="p-12 text-center">
                        <p className="text-slate-500 font-medium">No reports found.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
