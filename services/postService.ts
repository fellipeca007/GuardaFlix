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
    }
};
