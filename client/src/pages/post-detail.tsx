import { useParams } from "wouter";
import { Layout } from "@/components/layout";
import { usePost, useComments, useCreateComment } from "@/hooks/use-forum";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { User as UserIcon, Clock, Send, MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";

const commentSchema = z.object({
    content: z.string().min(1, "Comment cannot be empty"),
});

export default function PostDetail() {
    const { id } = useParams();
    const { data: post, isLoading: postLoading } = usePost(id || "");
    const { data: comments, isLoading: commentsLoading } = useComments(id || "");
    const createCommentMutation = useCreateComment(id || "");

    const form = useForm<z.infer<typeof commentSchema>>({
        resolver: zodResolver(commentSchema),
        defaultValues: {
            content: "",
        },
    });

    const onSubmit = async (values: z.infer<typeof commentSchema>) => {
        await createCommentMutation.mutateAsync(values);
        form.reset();
    };

    if (postLoading || commentsLoading) return <Layout><LoadingSpinner /></Layout>;
    if (!post) return <Layout><div className="text-center py-24">Post not found</div></Layout>;

    return (
        <Layout>
            <div className="max-w-4xl mx-auto space-y-8">
                <Card className="border-none shadow-none bg-transparent">
                    <CardHeader className="px-0">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                            <UserIcon size={16} />
                            <span className="font-semibold text-foreground">User {post.authorId.slice(0, 8)}...</span>
                            <span>•</span>
                            <Clock size={16} />
                            <span>{formatDistanceToNow(new Date(post.createdAt))} ago</span>
                        </div>
                        <CardTitle className="text-4xl font-extrabold tracking-tight leading-tight">
                            {post.title}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-0 pt-4">
                        <div className="prose prose-neutral dark:prose-invert max-w-none text-lg leading-relaxed text-foreground/90 whitespace-pre-wrap">
                            {post.content}
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-6 pt-10 border-t">
                    <div className="flex items-center gap-2 mb-2">
                        <MessageCircle className="text-primary w-5 h-5" />
                        <h2 className="text-2xl font-bold tracking-tight">
                            Comments {comments ? `(${comments.length})` : ""}
                        </h2>
                    </div>

                    <Card className="border-border/50 shadow-sm overflow-hidden bg-muted/5">
                        <CardContent className="pt-6">
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="content"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Add a comment..."
                                                        className="min-h-[100px] border-border/50 focus:ring-primary/20 bg-background"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="flex justify-end">
                                        <Button type="submit" className="gap-2 px-6" disabled={createCommentMutation.isPending}>
                                            <Send size={16} />
                                            {createCommentMutation.isPending ? "Posting..." : "Post Comment"}
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>

                    <div className="space-y-4 mt-8">
                        {comments && comments.length > 0 ? (
                            comments.map((comment) => (
                                <div key={comment.id} className="flex gap-4 p-5 rounded-2xl bg-muted/20 border border-border/30 hover:bg-muted/30 transition-colors">
                                    <div className="flex-shrink-0">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                            <UserIcon size={20} />
                                        </div>
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-bold text-foreground">User {comment.authorId.slice(0, 8)}...</span>
                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Clock size={12} />
                                                {formatDistanceToNow(new Date(comment.createdAt))} ago
                                            </span>
                                        </div>
                                        <p className="text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap">
                                            {comment.content}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12 text-muted-foreground bg-muted/5 rounded-2xl border border-dashed border-border/50">
                                No comments yet. Be the first to reply!
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
}
