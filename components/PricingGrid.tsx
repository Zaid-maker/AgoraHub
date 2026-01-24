"use client";

import { createCheckout } from "@/lib/actions";
import { useState } from "react";
import { toast } from "sonner";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const TIERS = [
    {
        name: "Monthly Citizen",
        price: "$9",
        interval: "/mo",
        id: "3c4b166e-7335-4a99-852c-0e4c332aa4ce",
        description: "Standard entry for active participants.",
        buttonText: "Join Monthly"
    },
    {
        name: "Elite Yearly",
        price: "$89",
        interval: "/yr",
        id: "774234db-a026-430b-b842-b31b65252910",
        description: "Best value. Save ~20% over monthly.",
        buttonText: "Go Elite",
        featured: true
    },
    {
        name: "Legacy Founder",
        price: "$299",
        interval: "",
        id: "6061302d-cdc7-4a82-b5c2-9645ac2e6c4e",
        description: "Lifetime access. The true legend's mark.",
        buttonText: "Claim Legacy"
    }
];

export default function PricingGrid() {
    const [loadingId, setLoadingId] = useState<string | null>(null);

    const handleUpgrade = async (productId: string) => {
        setLoadingId(productId);
        try {
            const checkoutUrl = await createCheckout(productId);
            if (!checkoutUrl) {
                toast.error("Failed to start checkout. Please try again.");
                console.error("createCheckout returned an empty URL for product:", productId);
                setLoadingId(null);
                return;
            }
            window.location.href = checkoutUrl;
        } catch (err: any) {
            toast.error(err.message || "Failed to start checkout. Check your console for details.");
            console.error(err);
            setLoadingId(null);
        }
    };

    return (
        <div className="w-full">
            <div className="grid md:grid-cols-3 gap-6 mb-12">
                {TIERS.map((tier) => (
                    <div
                        key={tier.name}
                        className={cn(
                            "group relative flex flex-col p-8 rounded-[2.5rem] border transition-all duration-300 bg-white/5",
                            tier.featured
                                ? "border-gold shadow-[0_0_40px_rgba(234,179,8,0.1)] scale-105 z-10"
                                : "border-white/10 hover:border-white/25"
                        )}
                    >
                        {tier.featured && (
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gold text-navy text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg whitespace-nowrap">
                                Legend Recommended
                            </div>
                        )}

                        <div className="mb-6">
                            <h3 className="text-xs font-black text-gold uppercase tracking-[0.2em] mb-4">{tier.name}</h3>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-black text-white">{tier.price}</span>
                                <span className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">{tier.interval}</span>
                            </div>
                        </div>

                        <p className="text-slate-400 text-sm font-medium leading-relaxed mb-8 flex-grow">
                            {tier.description}
                        </p>

                        <button
                            onClick={() => handleUpgrade(tier.id)}
                            disabled={loadingId !== null}
                            className={cn(
                                "w-full h-14 rounded-2xl font-black text-sm uppercase tracking-[0.2em] transition-all transform active:scale-[0.98] disabled:opacity-50 relative overflow-hidden",
                                tier.featured
                                    ? "bg-gold text-navy hover:bg-white"
                                    : "bg-white/10 text-white hover:bg-white hover:text-navy border border-white/10"
                            )}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                            <span className="relative z-10">
                                {loadingId === tier.id ? "Preparing..." : tier.buttonText}
                            </span>
                        </button>
                    </div>
                ))}
            </div>

            <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-[10px] text-slate-500 uppercase font-black tracking-widest">
                <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gold" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Secure payments by Polar.sh
                </span>
                <span className="hidden md:block w-1 h-1 bg-slate-700 rounded-full" />
                <span>Cancel any time</span>
            </div>
        </div>
    );
}
