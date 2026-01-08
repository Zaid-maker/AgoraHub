"use client";

import { useState } from "react";
import { toast } from "sonner";
import { updateUserRole } from "@/lib/admin-actions";

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    image: string | null;
    createdAt: Date;
    username: string | null;
}

export default function UsersTable({ users }: { users: User[] }) {
    const [loadingId, setLoadingId] = useState<string | null>(null);

    const handleRoleChange = async (userId: string, newRole: string) => {
        setLoadingId(userId);
        try {
            await updateUserRole(userId, newRole);
            toast.success("Role updated successfully");
        } catch (error) {
            toast.error("Failed to update role");
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
                            <th className="px-6 py-4">User</th>
                            <th className="px-6 py-4">Role</th>
                            <th className="px-6 py-4">Joined</th>
                            <th className="px-6 py-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                            {user.image ? (
                                                <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold">
                                                    {user.name[0]}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-900 dark:text-white">{user.name}</div>
                                            <div className="text-sm text-slate-500">{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold capitalize
                                        ${user.role === 'admin' ? 'bg-gold/10 text-gold' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}
                                    `}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                                    {new Date(user.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4">
                                    <select
                                        disabled={loadingId === user.id}
                                        value={user.role}
                                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-300 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-gold/50"
                                    >
                                        <option value="user">User</option>
                                        <option value="admin">Admin</option>
                                        <option value="banned">Banned</option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
