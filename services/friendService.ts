import { supabase } from './supabase';

export const FriendService = {
    async searchUsers(query: string, currentUserId: string) {
        let queryBuilder = supabase
            .from('profiles')
            .select('*')
            .neq('id', currentUserId);

        if (query) {
            queryBuilder = queryBuilder.or(`display_name.ilike.%${query}%,handle.ilike.%${query}%`);
        }

        const { data, error } = await queryBuilder.limit(20);

        if (error) {
            console.error('Error searching users:', error);
            return [];
        }

        return data.map(profile => ({
            id: profile.id,
            name: profile.display_name || 'Usuário',
            handle: profile.handle || '@usuario',
            avatar: profile.avatar_url || 'https://picsum.photos/seed/default/150/150',
            job: profile.bio || 'Cinéfilo',
            mutual: 0, // Placeholder
        }));
    },

    async getFriends(currentUserId: string) {
        const { data, error } = await supabase
            .from('relationships')
            .select(`
        following_id,
        profiles:following_id (
          id,
          display_name,
          handle,
          avatar_url,
          bio
        )
      `)
            .eq('follower_id', currentUserId);

        if (error) {
            console.error('Error getting friends:', error);
            return [];
        }

        return data.map((item: any) => ({
            id: item.profiles.id,
            name: item.profiles.display_name || 'Usuário',
            handle: item.profiles.handle || '@usuario',
            avatar: item.profiles.avatar_url || 'https://picsum.photos/seed/default/150/150',
            job: item.profiles.bio || 'Cinéfilo',
            mutual: 0,
        }));
    },

    async getFollowersCount(userId: string) {
        const { count, error } = await supabase
            .from('relationships')
            .select('*', { count: 'exact', head: true })
            .eq('following_id', userId);

        if (error) {
            console.error('Error getting followers count:', error);
            return 0;
        }
        return count || 0;
    },

    async followUser(currentUserId: string, targetUserId: string) {
        const { error } = await supabase
            .from('relationships')
            .insert({ follower_id: currentUserId, following_id: targetUserId });

        if (error) throw error;
    },

    async unfollowUser(currentUserId: string, targetUserId: string) {
        const { error } = await supabase
            .from('relationships')
            .delete()
            .match({ follower_id: currentUserId, following_id: targetUserId });

        if (error) throw error;
    },

    async checkIsFollowing(currentUserId: string, targetUserId: string) {
        const { data, error } = await supabase
            .from('relationships')
            .select('*')
            .match({ follower_id: currentUserId, following_id: targetUserId })
            .single();

        if (error && error.code !== 'PGRST116') return false;
        return !!data;
    },

    async getSuggestions(currentUserId: string) {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .neq('id', currentUserId)
            .limit(20);

        if (error) {
            console.error('Error getting suggestions:', error);
            return [];
        }

        const friends = await this.getFriends(currentUserId);
        const friendIds = new Set(friends.map((f: any) => f.id));

        const suggestions = data
            .filter((profile: any) => !friendIds.has(profile.id))
            .slice(0, 3)
            .map((profile: any) => ({
                id: profile.id,
                name: profile.display_name || 'Usuário',
                avatar: profile.avatar_url || 'https://picsum.photos/seed/default/50/50',
                info: 'Sugestão para você',
                isFollowing: false
            }));

        return suggestions;
    }
};
