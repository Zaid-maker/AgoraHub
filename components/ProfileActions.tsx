"use client";

import { useState } from "react";
import EditProfileModal from "./EditProfileModal";

interface ProfileActionsProps {
    user: {
        id: string;
        name: string;
        username?: string | null;
        bio?: string | null;
        bannerImage?: string | null;
    };
}

export default function ProfileActions({ user }: ProfileActionsProps) {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    return (
        <>
            <div className="absolute top-1/2 right-4 -translate-y-1/2">
                <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="h-12 px-8 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white rounded-2xl font-bold transition-all text-sm uppercase tracking-widest shadow-xl"
                >
                    Edit Profile
                </button>
            </div>

            {isEditModalOpen && (
                <EditProfileModal
                    user={user}
                    onClose={() => setIsEditModalOpen(false)}
                />
            )}
        </>
    );
}
