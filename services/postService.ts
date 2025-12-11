import { supabase } from './supabase';
import { Post } from '../types';

export const PostService = {
    async savePost(userId: string, post: Post) {
        const { error } = await supabase
            .from('saved_posts')
            .insert({
                user_id: userId,
                post_data: post
            });

        if (error) throw error;
    },

    async unsavePost(userId: string, postId: string) {
        // Since we store JSON, we need to find the record where post_data->>'id' equals postId
        // However, Supabase RLS policies are row-based.
        // Efficient way: store original_post_id as a separate column? Or just query JSON.
        // For now, query JSON.

        // First find the record ID
        const { data, error: findError } = await supabase
            .from('saved_posts')
            .select('id')
            .eq('user_id', userId)
            .eq('post_data->>id', postId)
            .single();

        if (findError) {
            console.error("Error finding saved post to delete", findError);
            return;
        }

        if (data) {
            const { error } = await supabase
                .from('saved_posts')
                .delete()
                .eq('id', data.id);

            if (error) throw error;
        }
    },

    async getSavedPosts(userId: string): Promise<Post[]> {
        const { data, error } = await supabase
            .from('saved_posts')
            .select('post_data')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching saved posts:', error);
            return [];
        }

        return data.map((item: any) => item.post_data as Post);
    },

    // --- New Realtime Post Methods ---

    async getFeedPosts(): Promise<Post[]> {
        const { data: posts, error } = await supabase
            .from('posts')
            .select(`
                *,
                user:profiles(id, display_name, handle, avatar_url),
                comments:comments(id, content, created_at, user:profiles(id, display_name, handle, avatar_url)),
                likes_count:post_likes(count)
            `)
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) {
            console.error('Error fetching feed:', error);
            return [];
        }

        const { data: userLikes } = await supabase.from('post_likes').select('post_id');
        const likedPostIds = new Set(userLikes?.map(l => l.post_id) || []);

        return posts.map((post: any) => ({
            id: post.id,
            user: {
                id: post.user?.id,
                name: post.user?.display_name || 'Usuário',
                handle: post.user?.handle || '@usuario',
                avatar: post.user?.avatar_url || 'https://picsum.photos/150/150'
            },
            content: post.content,
            image: post.image_url,
            sentiment: post.sentiment,
            likes: post.likes_count?.[0]?.count || 0,
            comments: post.comments?.map((c: any) => ({
                id: c.id,
                content: c.content,
                timestamp: new Date(c.created_at).toLocaleDateString(), // Simplification
                user: {
                    id: c.user?.id,
                    name: c.user?.display_name,
                    avatar: c.user?.avatar_url
                }
            })) || [],
            timestamp: new Date(post.created_at).toLocaleDateString(),
            isLiked: likedPostIds.has(post.id)
        }));
    },

    async createPost(userId: string, content: string, imageUrl?: string, sentiment?: string): Promise<void> {
        const { error } = await supabase.from('posts').insert({
            user_id: userId,
            content,
            image_url: imageUrl,
            sentiment
        });
        if (error) throw error;
    },

    async toggleLike(postId: string, userId: string, isCurrentlyLiked: boolean): Promise<void> {
        if (isCurrentlyLiked) {
            await supabase.from('post_likes').delete().match({ post_id: postId, user_id: userId });
        } else {
            await supabase.from('post_likes').insert({ post_id: postId, user_id: userId });
        }
    },

    async addComment(postId: string, userId: string, content: string): Promise<void> {
        const { error } = await supabase.from('comments').insert({
            post_id: postId,
            user_id: userId,
            content
        });
        if (error) throw error;
    }
};
