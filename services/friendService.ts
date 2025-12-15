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
        profiles:profiles!relationships_following_id_fkey (
          id,
          display_name,
          handle,
          avatar_url,
          bio
        )
      `)
            .eq('follower_id', currentUserId)
            .eq('status', 'accepted'); // Only accepted friends

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
            .eq('following_id', userId)
            .eq('status', 'accepted'); // Only accepted followers

        if (error) {
            console.error('Error getting followers count:', error);
            return 0;
        }
        return count || 0;
    },

    async followUser(currentUserId: string, targetUserId: string) {
        // Create request with 'pending' status
        const { error } = await supabase
            .from('relationships')
            .insert({
                follower_id: currentUserId,
                following_id: targetUserId,
                status: 'pending'
            });

        if (error) throw error;
    },

    async unfollowUser(currentUserId: string, targetUserId: string) {
        const { error } = await supabase
            .from('relationships')
            .delete()
            .match({ follower_id: currentUserId, following_id: targetUserId });

        if (error) throw error;
    },

    async checkIsFollowing(currentUserId: string, targetUserId: string): Promise<string> {
        const { data, error } = await supabase
            .from('relationships')
            .select('status')
            .match({ follower_id: currentUserId, following_id: targetUserId })
            .single();

        if (error || !data) return 'none';
        return data.status || 'none';
    },

    async getPendingRequests(currentUserId: string) {
        // Who wants to follow ME? So I am the following_id, they are follower_id
        const { data, error } = await supabase
            .from('relationships')
            .select(`
                follower_id,
                created_at,
                profiles:profiles!relationships_follower_id_fkey (
                    id,
                    display_name,
                    handle,
                    avatar_url
                )
            `)
            .eq('following_id', currentUserId)
            .eq('status', 'pending');

        if (error) {
            console.error("Error fetching requests", error);
            return [];
        }

        return data.map((item: any) => ({
            id: item.profiles.id,
            name: item.profiles.display_name,
            handle: item.profiles.handle,
            avatar: item.profiles.avatar_url,
            timestamp: item.created_at
        }));
    },

    async acceptRequest(currentUserId: string, requesterId: string) {
        // I am accepting THEIR request. I am following_id, they are follower_id.
        const { error } = await supabase
            .from('relationships')
            .update({ status: 'accepted' })
            .match({ following_id: currentUserId, follower_id: requesterId });

        if (error) throw error;
    },

    async rejectRequest(currentUserId: string, requesterId: string) {
        const { error } = await supabase
            .from('relationships')
            .delete()
            .match({ following_id: currentUserId, follower_id: requesterId });

        if (error) throw error;
    },

    async getSuggestions(currentUserId: string) {
        // Get all users except current user
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .neq('id', currentUserId)
            .limit(100); // Increased limit to show more users

        if (error) {
            console.error('Error getting suggestions:', error);
            return [];
        }

        // Filter out people I already follow (pending or accepted)
        const { data: myRelationships } = await supabase
            .from('relationships')
            .select('following_id')
            .eq('follower_id', currentUserId);

        const followedIds = new Set(myRelationships?.map(r => r.following_id) || []);

        // Return all users that are not already friends (no slice limit)
        const suggestions = data
            .filter((profile: any) => !followedIds.has(profile.id))
            .map((profile: any) => ({
                id: profile.id,
                name: profile.display_name || 'Usuário',
                avatar: profile.avatar_url || 'https://picsum.photos/seed/default/50/50',
                info: 'Sugestão',
                isFollowing: false
            }));

        return suggestions;
    }
};
