import Link from "next/link";
import { cn } from "@/lib/utils";

interface CreateTopicButtonProps {
    className?: string;
}

export default function CreateTopicButton({ className }: CreateTopicButtonProps) {
    return (
        <Link
            href="/new"
            className={cn(
                "h-12 px-8 flex items-center justify-center rounded-xl bg-gold hover:bg-gold-hover text-navy font-black transition-all shadow-xl shadow-gold/10 hover:shadow-gold/20 hover:scale-[1.02] active:scale-[0.98] uppercase tracking-widest text-xs",
                className
            )}
        >
            <span className="hidden sm:inline">Start a Topic</span>
            <span className="sm:hidden text-lg">+</span>
        </Link>
    );
}
