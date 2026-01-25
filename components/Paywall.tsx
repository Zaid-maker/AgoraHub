"use client";

import PricingGrid from "./PricingGrid";

export default function Paywall() {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
            <div className="absolute inset-0 bg-[#0F172A]/90 backdrop-blur-2xl" />

            <div className="relative w-full max-w-5xl glass p-8 md:p-12 rounded-[4rem] border border-white/20 shadow-2xl animate-in fade-in zoom-in duration-500 my-8">
                <div className="text-center mb-12">
                    <div className="w-32 h-32 mx-auto mb-6 relative group flex items-center justify-center">
                        <div className="absolute inset-0 bg-gold/10 blur-2xl group-hover:blur-3xl transition-all rounded-full" />
                        <img
                            src="/logo.png"
                            alt="Agora Hub Logo"
                            className="w-full h-full object-contain relative z-10 mix-blend-screen scale-125 brightness-110 group-hover:scale-135 transition-transform duration-500"
                        />
                    </div>

                    <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight leading-none mb-4">
                        Upgrade Your <span className="text-gold text-nowrap italic">Agora Hub Status</span>
                    </h2>
                    <p className="text-slate-400 text-lg leading-relaxed italic font-medium max-w-2xl mx-auto">
                        Your 14-day trial has concluded. Join the elite rank of contributors and shape the future of the discourse.
                    </p>
                </div>

                <PricingGrid />
            </div>
        </div>
    );
}
