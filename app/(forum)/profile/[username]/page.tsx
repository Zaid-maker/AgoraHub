import { getUserProfile, getSubscriptionStatus } from "@/lib/actions";
import { notFound } from "next/navigation";
import TopicCard from "@/components/TopicCard";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { cn } from "@/lib/utils";
import ProfileActions from "@/components/ProfileActions";
import Link from "next/link";

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
    const subStatus = await getSubscriptionStatus();

    return (
        <div className="max-w-5xl mx-auto py-10 px-4">
            {isOwnProfile && !subStatus.isActive && (
                <Link
                    href="/pricing"
                    className="mb-8 group relative flex flex-col md:flex-row items-center justify-between p-6 rounded-[2rem] bg-gradient-to-r from-gold/20 via-gold/5 entries-to-transparent border border-gold/30 overflow-hidden transition-all hover:bg-gold/30 shadow-xl shadow-gold/5"
                >
                    <div className="flex items-center gap-6 relative z-10">
                        <div className="w-12 h-12 bg-gold/20 rounded-2xl flex items-center justify-center text-gold shadow-inner border border-gold/20 flex-shrink-0">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div>
                            <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase leading-none mb-1">
                                {subStatus.isTrial ? `Trial Ending in ${subStatus.daysLeft} Days` : "Your Trial Has Expired"}
                            </h4>
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest italic">
                                {subStatus.isTrial
                                    ? "Upgrade to a lifetime or yearly legend status to keep your streak alive."
                                    : "Reactivate your account to continue participating in the hub."
                                }
                            </p>
                        </div>
                    </div>
                    <div className="mt-4 md:mt-0 flex items-center gap-2 bg-gold text-navy px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg group-hover:scale-105 transition-transform">
                        Upgrade Now
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </div>
                    <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-gold/10 to-transparent pointer-events-none" />
                </Link>
            )}

            {/* Profile Header */}
            <div className="relative mb-20">
                <div className="h-64 rounded-[3rem] bg-navy/20 border border-white/10 overflow-hidden relative shadow-2xl">
                    {profile.bannerImage ? (
                        <>
                            <img
                                src={profile.bannerImage}
                                alt="Profile Banner"
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent" />
                        </>
                    ) : (
                        <div className="absolute inset-0 bg-gradient-to-r from-navy to-slate-900">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
                        </div>
                    )}
                </div>

                <div className="absolute -bottom-16 left-6 md:left-12 flex items-end gap-6 md:gap-8">
                    <div className="relative group">
                        <div className="w-32 h-32 rounded-[2.5rem] bg-zinc-100 dark:bg-zinc-800 border-[6px] border-slate-50 dark:border-[#020617] overflow-hidden shadow-2xl relative">
                            <img
                                src={profile.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.name}`}
                                alt={profile.name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        {isOwnProfile && (
                            <div className="absolute top-0 right-0 p-2 bg-gold text-navy rounded-full shadow-lg border-4 border-slate-50 dark:border-[#020617] transform translate-x-2 -translate-y-2">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                            </div>
                        )}
                    </div>

                    <div className="mb-4">
                        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white uppercase leading-none">
                            {profile.name}
                        </h1>
                        <p className="text-gold font-bold tracking-widest text-[10px] md:text-xs uppercase mt-2">
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
                                    avatar={profile.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.name}`}
                                    voteCount={topic.voteCount}
                                    userVote={topic.votes.find(v => v.userId === session?.user.id)?.value || 0}
                                    moderated={topic.moderated}
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
