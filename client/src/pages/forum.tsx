import { useState } from "react";
import { Layout } from "@/components/layout";
import { useAuthStore } from "@/store/use-auth";
import { useForumPosts, useCreatePost } from "@/hooks/use-forum";
import { useCommunities } from "@/hooks/use-communities";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Plus, User as UserIcon, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Link } from "wouter";

const postSchema = z.object({
    title: z.string().min(1, "Title is required"),
    content: z.string().min(1, "Content is required"),
});

export default function Forum() {
    const user = useAuthStore(s => s.user!);
    const { data: communities } = useCommunities();
    const currentCommunity = communities?.find(c => c.id === user.communityId);
    const { data: posts, isLoading } = useForumPosts(user.communityId || "");
    const createPostMutation = useCreatePost(user.communityId || "");
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const form = useForm<z.infer<typeof postSchema>>({
        resolver: zodResolver(postSchema),
        defaultValues: {
            title: "",
            content: "",
        },
    });

    const onSubmit = async (values: z.infer<typeof postSchema>) => {
        await createPostMutation.mutateAsync(values);
        form.reset();
        setIsDialogOpen(false);
    };

    if (isLoading) return <Layout><LoadingSpinner /></Layout>;

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Community Forum</h1>
                        <p className="text-muted-foreground">
                            Discussions for {currentCommunity?.name || "your community"}
                        </p>
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <Plus size={18} />
                                New Post
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-width-[525px]">
                            <DialogHeader>
                                <DialogTitle>Create New Post</DialogTitle>
                            </DialogHeader>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="title"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Title</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Enter post title..." {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="content"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Content</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="What's on your mind?"
                                                        className="min-h-[150px]"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Button type="submit" className="w-full" disabled={createPostMutation.isPending}>
                                        {createPostMutation.isPending ? "Publishing..." : "Publish Post"}
                                    </Button>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="grid gap-6">
                    {posts && posts.length > 0 ? (
                        posts.map((post) => (
                            <Card key={post.id} className="hover:border-primary/50 transition-colors shadow-sm overflow-hidden border-border/50">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                                        <UserIcon size={14} />
                                        <span className="font-medium">User {post.authorId.slice(0, 8)}...</span>
                                        <span>•</span>
                                        <Clock size={14} />
                                        <span>{formatDistanceToNow(new Date(post.createdAt))} ago</span>
                                    </div>
                                    <CardTitle className="text-xl">
                                        <Link href={`/forum/post/${post.id}`} className="hover:text-primary transition-colors">
                                            {post.title}
                                        </Link>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground line-clamp-3 overflow-hidden text-sm leading-relaxed">
                                        {post.content}
                                    </p>
                                </CardContent>
                                <CardFooter className="pt-2 border-t bg-muted/5">
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                        <div className="flex items-center gap-1.5 hover:text-primary cursor-pointer transition-colors font-medium">
                                            <MessageSquare size={14} />
                                            <span>Comments</span>
                                        </div>
                                    </div>
                                </CardFooter>
                            </Card>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-24 text-center border rounded-2xl bg-muted/10 border-dashed">
                            <MessageSquare className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
                            <h3 className="text-lg font-semibold">No posts yet</h3>
                            <p className="text-muted-foreground max-w-sm mt-1">Be the first to start a conversation in your community!</p>
                            <Button variant="outline" className="mt-6" onClick={() => setIsDialogOpen(true)}>
                                Start a Discussion
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
