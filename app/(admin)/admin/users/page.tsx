import { getUsers } from "@/lib/admin-actions";
import UsersTable from "@/components/admin/UsersTable";

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
    const users = await getUsers();

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <header>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">User Management</h1>
                <p className="text-slate-500">View and manage user roles across the platform.</p>
            </header>
            <UsersTable users={users} />
        </div>
    );
}
