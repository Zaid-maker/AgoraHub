import SidebarWrapper from "@/components/SidebarWrapper";
import TopicCard from "@/components/TopicCard";
import { getTopics } from "@/lib/actions";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const topics = await getTopics();

  return (
    <SidebarWrapper>
      <div className="space-y-8">
        <div className="flex flex-col mb-12">
          <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white uppercase leading-none">
            Recent Discussions
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 mt-4 font-medium italic">
            Stay up to date with the latest debates and thoughts from the community.
          </p>
        </div>

        <div className="space-y-4">
          {topics.length > 0 ? (
            topics.map((t) => (
              <TopicCard
                key={t.id}
                id={t.id}
                title={t.title}
                excerpt={t.content.substring(0, 150) + (t.content.length > 150 ? '...' : '')}
                author={t.author.name}
                authorId={t.authorId}
                category={t.category.name}
                replies={t._count.comments}
                timeAgo={new Date(t.createdAt).toLocaleDateString()}
                avatar={`https://api.dicebear.com/7.x/avataaars/svg?seed=${t.author.name}`}
                voteCount={t.voteCount}
                userVote={t.userVote}
              />
            ))
          ) : (
            <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-800">
              <p className="text-slate-500 font-medium font-serif italic">No discussions yet. Be the first to start a legend.</p>
            </div>
          )}
        </div>
      </div>
    </SidebarWrapper>
  );
}
