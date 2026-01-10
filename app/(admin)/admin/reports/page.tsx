import { getReports } from "@/lib/admin-actions";
import ReportsTable from "@/components/admin/ReportsTable";

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
    const reports = await getReports();

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <header>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Reports</h1>
                <p className="text-slate-500">Review and moderate reported content from users.</p>
            </header>
            <ReportsTable reports={reports} />
        </div>
    );
}
