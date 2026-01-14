import { getUserProfile } from "@/lib/actions";
import { notFound } from "next/navigation";
import TopicCard from "@/components/TopicCard";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { cn } from "@/lib/utils";
import ProfileActions from "@/components/ProfileActions";

interface ProfilePageProps {
    params: Promise<{ username: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
    const { username } = await params;
    const profile = await getUserProfile(username);
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!profile) {
        notFound();
    }

    const joinedDate = new Date(profile.createdAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric"
    });

    const isOwnProfile = session?.user.id === profile.id;

    return (
        <div className="max-w-5xl mx-auto py-10">
            {/* Profile Header */}
            <div className="relative mb-20">
                <div className="h-64 rounded-[3rem] bg-gradient-to-r from-navy to-zinc-900 border border-white/5 overflow-hidden shadow-2xl relative">
                    {profile.bannerImage ? (
                        <>
                            <img
                                src={profile.bannerImage}
                                alt="Profile Banner"
                                className="w-full h-full object-cover transition-opacity duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-navy/60 via-transparent to-transparent" />
                        </>
                    ) : (
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
                    )}
                </div>

                <div className="absolute -bottom-16 left-12 flex items-end gap-8">
                    <div className="relative group">
                        <div className="w-32 h-32 rounded-[2.5rem] bg-zinc-100 dark:bg-zinc-800 border-[6px] border-slate-50 dark:border-navy overflow-hidden shadow-2xl">
                            <img
                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.name}`}
                                alt={profile.name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        {isOwnProfile && (
                            <div className="absolute top-0 right-0 p-2 bg-gold text-navy rounded-full shadow-lg border-2 border-slate-50 dark:border-navy transform translate-x-2 -translate-y-2">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                            </div>
                        )}
                    </div>

                    <div className="mb-4">
                        <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white uppercase leading-none">
                            {profile.name}
                        </h1>
                        <p className="text-gold font-bold tracking-widest text-xs uppercase mt-2">
                            @{profile.username || profile.id.substring(0, 8)}
                        </p>
                    </div>
                </div>

                {isOwnProfile && <ProfileActions user={profile} />}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Sidebar Stats */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="glass p-8 rounded-[2.5rem] border border-white/20 dark:border-slate-800 shadow-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
                        <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-6">Identity Card</h3>

                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] font-black text-gold uppercase tracking-widest block mb-1">Bio</label>
                                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium italic">
                                    {profile.bio || "No bio yet. This hub member is still carving their legend."}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-3xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Joined</span>
                                    <span className="text-sm font-bold text-slate-900 dark:text-white">{joinedDate}</span>
                                </div>
                                <div className="p-4 rounded-3xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Reputation</span>
                                    <span className="text-sm font-bold text-gold">
                                        {(() => {
                                            const posts = profile.topicCount + profile.commentCount;
                                            if (posts === 0) return "Novice";
                                            if (posts <= 5) return "Initiate";
                                            if (posts <= 15) return "Pioneer";
                                            if (posts <= 50) return "Legionnaire";
                                            if (posts <= 150) return "Centurion";
                                            return "Legend";
                                        })()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="glass p-8 rounded-[2.5rem] border border-white/20 dark:border-slate-800 shadow-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
                        <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-6">Engagement Metrics</h3>

                        <div className="grid grid-cols-2 gap-8 text-center">
                            <div>
                                <span className="text-3xl font-black text-slate-900 dark:text-white block mb-1">{profile.topicCount}</span>
                                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Discussions</span>
                            </div>
                            <div>
                                <span className="text-3xl font-black text-slate-900 dark:text-white block mb-1">{profile.commentCount}</span>
                                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Comments</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Activity Feed */}
                <div className="lg:col-span-8">
                    <div className="flex items-center gap-8 mb-8 border-b border-slate-200 dark:border-slate-800 pb-4">
                        <button className="text-sm font-black text-navy dark:text-white uppercase tracking-widest border-b-2 border-gold pb-4 -mb-[18px]">
                            Discussions ({profile.topicCount})
                        </button>
                        <button className="text-sm font-bold text-slate-400 hover:text-navy dark:hover:text-white uppercase tracking-widest transition-colors pb-4">
                            Comments ({profile.commentCount})
                        </button>
                    </div>

                    <div className="space-y-4">
                        {profile.topics.length > 0 ? (
                            profile.topics.map((topic) => (
                                <TopicCard
                                    key={topic.id}
                                    id={topic.id}
                                    title={topic.title}
                                    excerpt={topic.content.substring(0, 150) + "..."}
                                    author={profile.name}
                                    authorId={profile.id}
                                    category={topic.category.name}
                                    replies={topic._count.comments}
                                    timeAgo={new Date(topic.createdAt).toLocaleDateString()}
                                    avatar={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.name}`}
                                    voteCount={topic.voteCount}
                                    userVote={topic.votes.find(v => v.userId === session?.user.id)?.value || 0}
                                />
                            ))
                        ) : (
                            <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-800">
                                <p className="text-slate-500 font-medium font-serif italic">This hub member hasn't started any debates yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
