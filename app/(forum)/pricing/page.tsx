import PricingGrid from "@/components/PricingGrid";
import Link from "next/link";
import Image from "next/image";

export default function PricingPage() {
    return (
        <div className="max-w-5xl mx-auto py-20 px-4">
            <div className="text-center mb-16">
                <div className="w-24 h-24 mx-auto mb-8 relative group flex items-center justify-center">
                    <div className="absolute inset-0 bg-gold/10 blur-2xl group-hover:blur-3xl transition-all rounded-full" />
                    <Image
                        src="/logo.png"
                        alt="Agora Hub Logo"
                        width={96}
                        height={96}
                        priority
                        className="w-full h-full object-contain relative z-10 mix-blend-screen scale-125 brightness-110"
                    />
                </div>

                <h1 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-6">
                    Choose Your <span className="text-gold italic">Legacy</span>
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-xl max-w-2xl mx-auto font-medium leading-relaxed italic">
                    Support the forum, unlock premium features, and establish your mark as a Legend in the Agora Hub.
                </p>
            </div>

            <PricingGrid />

            <div className="mt-20 text-center">
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-4 italic">
                    Have more questions? Check our FAQ or reach out to support.
                </p>
                <div className="flex items-center justify-center gap-6">
                    <Link href="/" className="text-[10px] font-black uppercase tracking-widest text-gold hover:text-white transition-colors">
                        Back to Discussions
                    </Link>
                </div>
            </div>
        </div>
    );
}
