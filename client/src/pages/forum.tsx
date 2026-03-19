import { useState, useRef, useEffect } from "react";
import { Layout } from "@/components/layout";
import { useAuthStore } from "@/store/use-auth";
import { useForumPosts, useCreatePost } from "@/hooks/use-forum";
import { useListings } from "@/hooks/use-listings";
import { useCommunities } from "@/hooks/use-communities";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Send, User as UserIcon, ShoppingBag, Wrench, Mail, Phone, ImagePlus, Smile, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";

export default function Forum() {
    const { toast } = useToast();
    const user = useAuthStore(s => s.user!);
    const { data: communities } = useCommunities();
    const { data: listings } = useListings();
    const currentCommunity = communities?.find(c => c.id === user.communityId);
    const { data: posts, isLoading } = useForumPosts(user.communityId || "");
    const createPostMutation = useCreatePost(user.communityId || "", {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
    });
    const [message, setMessage] = useState("");
    const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
    const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
    const [imageUploading, setImageUploading] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [nextAllowedAt, setNextAllowedAt] = useState<number>(0);
    const scrollRef = useRef<HTMLDivElement>(null);
    const cooldownRemaining = Math.max(0, Math.ceil((nextAllowedAt - Date.now()) / 1000));

    useEffect(() => {
        if (!nextAllowedAt) return;
        if (Date.now() >= nextAllowedAt) return;
        const timer = window.setInterval(() => {
            if (Date.now() >= nextAllowedAt) {
                setNextAllowedAt(0);
            }
        }, 500);
        return () => window.clearInterval(timer);
    }, [nextAllowedAt]);

    const myListings = listings?.filter(
        l => l.sellerId === user.id && l.status === "ACTIVE" && l.communityId === user.communityId
    ) || [];

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [posts?.length]);

    const uploadAdImage = async (file: File) => {
        setImageUploading(true);
        try {
            const fd = new FormData();
            fd.append("image", file);
            const res = await fetch("/api/upload", {
                method: "POST",
                body: fd,
                credentials: "include",
            });
            if (!res.ok) throw new Error("Upload failed");
            const data = await res.json();
            setSelectedImageUrl(data.url);
        } catch {
            toast({ title: "Image upload failed", description: "Please try another image.", variant: "destructive" });
        } finally {
            setImageUploading(false);
        }
    };

    const handleSend = async () => {
        if (cooldownRemaining > 0) {
            toast({ title: "Please wait", description: `You can post again in ${cooldownRemaining}s.` });
            return;
        }

        const typedContent = message.trim();
        const content = typedContent || (selectedListingId ? "Shared a listing" : selectedImageUrl ? "Shared an image" : "");
        if (!content && !selectedImageUrl && !selectedListingId) return;
        const title = selectedListingId
            ? (listings?.find(l => l.id === selectedListingId)?.title || "Shared listing")
            : selectedImageUrl
                ? "Image"
                : "Message";
        const sharedListing = selectedListingId ? listings?.find(l => l.id === selectedListingId) : null;
        await createPostMutation.mutateAsync({
            title,
            content,
            ...(selectedListingId && { listingId: selectedListingId }),
            ...(selectedImageUrl && { imageUrl: selectedImageUrl }),
            ...(sharedListing && {
                _listing: {
                    id: sharedListing.id,
                    title: sharedListing.title,
                    description: sharedListing.description,
                    listingType: sharedListing.listingType,
                    price: sharedListing.price,
                    buyNowEnabled: sharedListing.buyNowEnabled,
                    imageUrl: sharedListing.imageUrl ?? null,
                },
            }),
        });
        setMessage("");
        setSelectedListingId(null);
        setSelectedImageUrl(null);
        setShowEmojiPicker(false);
        setNextAllowedAt(Date.now() + 30_000);
    };

    if (isLoading) return <Layout><LoadingSpinner /></Layout>;

    if (createPostMutation.isError) {
        toast({
            title: "Post failed",
            description: createPostMutation.error.message,
            variant: "destructive"
        });
    }

    return (
        <Layout>
            <div className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl mx-auto">
                <div className="mb-4">
                    <h1 className="text-3xl font-bold tracking-tight">Community Ads</h1>
                    <p className="text-muted-foreground">
                        View and post ads in {currentCommunity?.name || "your community"} — share services and products
                    </p>
                </div>

                <Card className="flex-1 flex flex-col min-h-0 border-border/50 shadow-sm overflow-hidden">
                    <CardContent className="flex-1 flex flex-col p-0 min-h-0 overflow-hidden">
                        {posts && posts.length > 0 ? (
                            <div className="flex-1 min-h-0 overflow-y-auto p-4">
                                <div className="space-y-4 pb-4">
                                    {posts.map((post) => (
                                        <ChatMessage key={post.id} post={post} currentUserId={user.id} />
                                    ))}
                                    <div ref={scrollRef} />
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 min-h-0 flex flex-col items-center justify-center py-24 text-center border-b border-dashed border-border/50">
                                <MessageSquare className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
                                <h3 className="text-lg font-semibold">No ads yet</h3>
                                <p className="text-muted-foreground max-w-sm mt-1">
                                    Be the first to post an ad. Share your products or services with the community.
                                </p>
                            </div>
                        )}

                        <div className="p-4 border-t border-border/50 bg-muted/20">
                            <div className="flex gap-2">
                                <div className="flex-1 flex flex-col gap-2">
                                    {myListings.length > 0 && (
                                        <Select value={selectedListingId ?? ""} onValueChange={v => setSelectedListingId(v || null)}>
                                            <SelectTrigger className="h-9 text-sm">
                                                <SelectValue placeholder="Share a product or service..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {myListings.map(l => (
                                                    <SelectItem key={l.id} value={l.id}>
                                                        <span className="flex items-center gap-2">
                                                            {l.listingType === "PRODUCT" ? <ShoppingBag className="w-3.5 h-3.5" /> : <Wrench className="w-3.5 h-3.5" />}
                                                            {l.title}
                                                        </span>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                    {selectedImageUrl && (
                                        <div className="relative w-fit">
                                            <img src={selectedImageUrl} alt="Selected upload" className="h-24 w-24 rounded-lg object-cover border" />
                                            <button
                                                type="button"
                                                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center"
                                                onClick={() => setSelectedImageUrl(null)}
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    )}
                                    <Input
                                        placeholder={cooldownRemaining > 0 ? `Wait ${cooldownRemaining}s before next ad...` : "Type your ad message..."}
                                        value={message}
                                        onChange={e => setMessage(e.target.value)}
                                        onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
                                        className="flex-1"
                                        disabled={cooldownRemaining > 0}
                                    />
                                </div>
                                <div className="flex items-end gap-2">
                                    <label className="h-10 w-10 rounded-md border bg-background hover:bg-muted flex items-center justify-center cursor-pointer">
                                        <ImagePlus className="w-4 h-4" />
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            disabled={cooldownRemaining > 0 || imageUploading}
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;
                                                await uploadAdImage(file);
                                            }}
                                        />
                                    </label>
                                    <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                                        <PopoverTrigger asChild>
                                            <button
                                                type="button"
                                                className="h-10 w-10 rounded-md border bg-background hover:bg-muted flex items-center justify-center"
                                                disabled={cooldownRemaining > 0}
                                            >
                                                <Smile className="w-4 h-4" />
                                            </button>
                                        </PopoverTrigger>
                                        <PopoverContent align="end" side="top" className="w-56 p-2">
                                            <div className="mb-2 px-1 text-[11px] font-medium text-muted-foreground">Pick an emoji</div>
                                            <div className="grid grid-cols-4 gap-1.5">
                                                {["😀", "😂", "😍", "🙏", "🔥", "🎉", "✅", "👍", "💡", "🏠", "🛒", "📢"].map((emoji) => (
                                                    <button
                                                        key={emoji}
                                                        type="button"
                                                        className="h-10 w-10 rounded-md hover:bg-muted transition-colors text-2xl leading-none flex items-center justify-center"
                                                        onClick={() => {
                                                            setMessage((m) => `${m}${emoji}`);
                                                            setShowEmojiPicker(false);
                                                        }}
                                                    >
                                                        <span className="leading-none">{emoji}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <Button
                                    onClick={handleSend}
                                    disabled={
                                        createPostMutation.isPending ||
                                        imageUploading ||
                                        cooldownRemaining > 0 ||
                                        (!message.trim() && !selectedListingId && !selectedImageUrl)
                                    }
                                    className="shrink-0"
                                >
                                    <Send className="w-4 h-4" />
                                </Button>
                            </div>
                            <p className="mt-2 text-[11px] text-muted-foreground">
                                {cooldownRemaining > 0
                                    ? `Posting is limited to 1 ad every 30 seconds. You can post again in ${cooldownRemaining}s.`
                                    : "You can post text, emojis, images, or a listing. Limit: 1 ad every 30 seconds."}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
}

function ChatMessage({
    post,
    currentUserId,
}: {
    post: {
        id: string;
        authorId: string;
        title: string;
        content: string;
        imageUrl: string | null;
        listingId: string | null;
        createdAt: string;
        author: { fullName: string; email: string | null; phone: string | null };
        listing: {
            id: string;
            title: string;
            description: string;
            listingType: string;
            price: number;
            buyNowEnabled: boolean;
            imageUrl: string | null;
        } | null;
    };
    currentUserId: string;
}) {
    const isOwn = post.authorId === currentUserId;
    const { fullName, email, phone } = post.author;

    return (
        <div className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}>
            <Popover>
                <PopoverTrigger asChild>
                    <button className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors cursor-pointer">
                        <UserIcon size={20} />
                    </button>
                </PopoverTrigger>
                <PopoverContent className="w-64" align={isOwn ? "end" : "start"}>
                    <div className="space-y-2">
                        <p className="font-bold text-sm">{fullName}</p>
                        {email && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Mail className="w-3.5 h-3.5 shrink-0" />
                                <a href={`mailto:${email}`} className="hover:text-primary truncate">{email}</a>
                            </div>
                        )}
                        {phone && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Phone className="w-3.5 h-3.5 shrink-0" />
                                <a href={`tel:${phone}`} className="hover:text-primary">{phone}</a>
                            </div>
                        )}
                        {!email && !phone && <p className="text-sm text-muted-foreground">No contact details</p>}
                    </div>
                </PopoverContent>
            </Popover>

            <div className={`flex-1 max-w-[85%] ${isOwn ? "items-end" : ""}`}>
                <div className={`rounded-2xl px-4 py-2.5 ${isOwn ? "bg-primary text-primary-foreground ml-auto" : "bg-muted/50"}`}>
                    <p className="text-xs font-medium opacity-90 mb-1">
                        {post.author.fullName} · {formatDistanceToNow(new Date(post.createdAt))} ago
                    </p>
                    {post.content && post.content !== "Shared a listing" && (
                        <p className="text-sm whitespace-pre-wrap">{post.content}</p>
                    )}
                    {post.imageUrl && (
                        <a href={post.imageUrl} target="_blank" rel="noreferrer">
                            <img src={post.imageUrl} alt="Shared ad" className="mt-2 max-h-64 rounded-xl border object-cover" />
                        </a>
                    )}
                    {post.listing && (
                        <Link href={`/listings/${post.listing.id}`}>
                            <div className="mt-2 p-3 rounded-xl bg-background/20 hover:bg-background/30 transition-colors cursor-pointer border border-background/20">
                                <div className="flex gap-3">
                                    {post.listing.imageUrl ? (
                                        <img src={post.listing.imageUrl} alt="" className="w-14 h-14 rounded-lg object-cover" />
                                    ) : (
                                        <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center">
                                            {post.listing.listingType === "PRODUCT" ? <ShoppingBag className="w-6 h-6 text-muted-foreground" /> : <Wrench className="w-6 h-6 text-muted-foreground" />}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm line-clamp-1">{post.listing.title}</p>
                                        <p className="text-xs opacity-80 line-clamp-2">{post.listing.description}</p>
                                        <p className="text-sm font-bold mt-1">
                                            {post.listing.buyNowEnabled ? `₹${post.listing.price}` : "Price on request"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}
