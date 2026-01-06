import { getCategories } from "@/lib/actions";

interface SidebarWrapperProps {
    children: React.ReactNode;
}

export default async function SidebarWrapper({ children }: SidebarWrapperProps) {
    const categories = await getCategories();

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Sidebar */}
            <aside className="hidden lg:block lg:col-span-3 space-y-6">
                <div className="space-y-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 px-3">Top Categories</h3>
                    <div className="space-y-1">
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg hover:bg-white dark:hover:bg-charcoal transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700 group-hover:bg-gold transition-colors" />
                                    <span className="text-slate-600 dark:text-slate-400 group-hover:text-navy dark:group-hover:text-white">{cat.name}</span>
                                </div>
                                <span className="text-xs text-zinc-400 font-normal">
                                    {cat._count.topics}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="lg:col-span-9">
                {children}
            </main>
        </div>
    );
}
