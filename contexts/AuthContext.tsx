import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { User, Session } from '@supabase/supabase-js';
import { User as AppUser } from '../types';


interface AuthContextType {
    session: Session | null;
    user: AppUser | null;
    signOut: () => Promise<void>;
    loading: boolean;
    updateProfile: (data: Partial<AppUser>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    signOut: async () => { },
    loading: true,
    updateProfile: async () => { },
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<AppUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session?.user) {
                fetchProfile(session.user);
            } else {
                setLoading(false);
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session?.user) {
                fetchProfile(session.user);
            } else {
                setUser(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchProfile = async (authUser: User) => {
        try {
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', authUser.id)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Error fetching profile:', error);
            }

            setUser(mapUser(authUser, profile));
        } catch (error) {
            console.error('Error in fetchProfile:', error);
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    const updateProfile = async (updates: Partial<AppUser>) => {
        if (!user || !session?.user) return;

        try {
            // 1. Update local state
            const newUser = { ...user, ...updates };
            setUser(newUser);

            // 2. Update Supabase Profile
            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: session.user.id,
                    display_name: updates.name,
                    handle: updates.handle,
                    bio: updates.bio,
                    avatar_url: updates.avatar,
                    cover_image_url: updates.coverImage,
                    cover_position: updates.coverPosition, // Save position
                    updated_at: new Date().toISOString(),
                });

            if (error) throw error;

            // 3. Also update Auth Metadata (optional but good as backup)
            await supabase.auth.updateUser({
                data: {
                    name: updates.name,
                    handle: updates.handle,
                    bio: updates.bio,
                    avatar_url: updates.avatar,
                    cover_image: updates.coverImage
                }
            });

        } catch (error) {
            console.error('Error updating profile:', error);
            throw error;
        }
    };

    const mapUser = (authUser: User, profile: any): AppUser => {
        // Prefer profile data, fallback to metadata, then defaults
        const meta = authUser.user_metadata;

        return {
            id: authUser.id,
            name: profile?.display_name || meta.name || authUser.email?.split('@')[0] || 'Nome',
            avatar: profile?.avatar_url || meta.avatar_url || 'https://picsum.photos/seed/me/150/150',
            handle: profile?.handle || meta.handle || `@${authUser.email?.split('@')[0] || 'usuario'}`,
            coverImage: profile?.cover_image_url || meta.cover_image || 'https://picsum.photos/seed/cover/800/250',
            coverPosition: profile?.cover_position || '50% 50%', // Map position
            bio: profile?.bio || meta.bio || 'Novo no GuardaFlix',
        };
    };

    return (
        <AuthContext.Provider value={{ session, user, signOut, loading, updateProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
