import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/lib/api-error";

export function useForumPosts(communityId: string) {
    return useQuery({
        queryKey: [api.communities.posts.list.path, { communityId }],
        queryFn: async () => {
            const url = buildUrl(api.communities.posts.list.path, { id: communityId });
            const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        const message = await getErrorMessage(res, "Failed to fetch posts");
        throw new Error(message);
      }
            return api.communities.posts.list.responses[200].parse(await res.json());
        },
        enabled: !!communityId,
    });
}

export function usePost(postId: string) {
    return useQuery({
        queryKey: [api.posts.get.path, { postId }],
        queryFn: async () => {
            const url = buildUrl(api.posts.get.path, { id: postId });
            const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        const message = await getErrorMessage(res, "Failed to fetch post");
        throw new Error(message);
      }
            return api.posts.get.responses[200].parse(await res.json());
        },
        enabled: !!postId,
    });
}

export function useComments(postId: string) {
    return useQuery({
        queryKey: [api.posts.comments.list.path, { postId }],
        queryFn: async () => {
            const url = buildUrl(api.posts.comments.list.path, { id: postId });
            const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        const message = await getErrorMessage(res, "Failed to fetch comments");
        throw new Error(message);
      }
            return api.posts.comments.list.responses[200].parse(await res.json());
        },
        enabled: !!postId,
    });
}

type PostWithAuthor = {
    id: string;
    communityId: string;
    authorId: string;
    title: string;
    content: string;
    imageUrl: string | null;
    listingId: string | null;
    createdAt: string;
    author: { fullName: string; email: string | null; phone: string | null };
    listing: { id: string; title: string; description: string; listingType: string; price: number; buyNowEnabled: boolean; imageUrl: string | null } | null;
};

export function useCreatePost(
    communityId: string,
    currentUser: { id: string; fullName: string; email: string | null; phone: string | null }
) {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (data: { title: string; content?: string; listingId?: string; imageUrl?: string; _listing?: PostWithAuthor["listing"] }) => {
            const { _listing, ...payload } = data;
            const url = buildUrl(api.communities.posts.create.path, { id: communityId });
            const res = await fetch(url, {
                method: api.communities.posts.create.method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
                credentials: "include",
            });
      if (!res.ok) {
        const message = await getErrorMessage(res, "Failed to create post");
        throw new Error(message);
      }
            return api.communities.posts.create.responses[201].parse(await res.json());
        },
        onSuccess: (newPost, variables) => {
            const queryKey = [api.communities.posts.list.path, { communityId }];
            const createdAt = typeof newPost.createdAt === "string"
                ? newPost.createdAt
                : (newPost.createdAt as Date)?.toISOString?.() ?? new Date().toISOString();
            const optimisticPost: PostWithAuthor = {
                id: newPost.id,
                communityId: newPost.communityId,
                authorId: newPost.authorId,
                title: newPost.title,
                content: newPost.content,
                imageUrl: (newPost as any).imageUrl ?? null,
                listingId: newPost.listingId ?? null,
                createdAt,
                author: {
                    fullName: currentUser.fullName,
                    email: currentUser.email,
                    phone: currentUser.phone,
                },
                listing: variables._listing ?? null,
            };
            queryClient.setQueryData(queryKey, (prev: PostWithAuthor[] | undefined) => [
                ...(prev || []),
                optimisticPost,
            ]);
            queryClient.invalidateQueries({ queryKey });
            toast({ title: "Message sent" });
        },
    });
}

export function useCreateComment(postId: string) {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (data: { content: string }) => {
            const url = buildUrl(api.posts.comments.create.path, { id: postId });
            const res = await fetch(url, {
                method: api.posts.comments.create.method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
                credentials: "include",
            });
      if (!res.ok) {
        const message = await getErrorMessage(res, "Failed to add comment");
        throw new Error(message);
      }
            return api.posts.comments.create.responses[201].parse(await res.json());
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [api.posts.comments.list.path, { postId }] });
            toast({ title: "Comment added" });
        },
    });
}
