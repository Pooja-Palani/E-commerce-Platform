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

export function useCreatePost(communityId: string) {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (data: { title: string; content: string }) => {
            const url = buildUrl(api.communities.posts.create.path, { id: communityId });
            const res = await fetch(url, {
                method: api.communities.posts.create.method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
                credentials: "include",
            });
      if (!res.ok) {
        const message = await getErrorMessage(res, "Failed to create post");
        throw new Error(message);
      }
            return api.communities.posts.create.responses[201].parse(await res.json());
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [api.communities.posts.list.path, { communityId }] });
            toast({ title: "Post published" });
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
