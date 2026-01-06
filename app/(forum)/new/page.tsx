import CreateTopicForm from "@/components/CreateTopicForm";
import { getCategories } from "@/lib/actions";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function NewTopicPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/sign-in");
    }

    const categories = await getCategories();

    return (
        <div className="max-w-3xl mx-auto py-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-12">
                <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white uppercase leading-none">
                    Start a Discussion
                </h1>
                <p className="text-lg text-slate-500 dark:text-slate-400 mt-4 font-medium italic">
                    Share your thoughts, ask a question, or start a debate with the community.
                </p>
            </div>

            <div className="glass p-10 rounded-[3rem] border border-white/20 dark:border-slate-800 shadow-2xl">
                <CreateTopicForm categories={categories} />
            </div>
        </div>
    );
}
