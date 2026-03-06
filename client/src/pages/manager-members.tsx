import { useState } from "react";
import { Layout } from "@/components/layout";
import { useCommunityMembers, useRemoveMemberFromCommunity, useInviteByEmail, useInviteLink } from "@/hooks/use-communities";
import { useUsers } from "@/hooks/use-users";
import { useAuthStore } from "@/store/use-auth";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UsersIcon, Shield, Trash2, UserPlus, Link2, Copy, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ManagerMembers() {
  const currentUser = useAuthStore(s => s.user!);
  const communityId = currentUser.communityId ?? "";
  const { data: members, isLoading } = useCommunityMembers(communityId);
  const { data: allUsers } = useUsers();
  const removeMember = useRemoveMemberFromCommunity(communityId);
  const inviteByEmail = useInviteByEmail(communityId);
  const { data: inviteLinkData, refetch: refetchInviteLink } = useInviteLink(communityId);
  const { toast } = useToast();

  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLinkDialogOpen, setInviteLinkDialogOpen] = useState(false);

  const communityMembers = (members && members.length > 0)
    ? members
    : (allUsers?.filter(u => u.communityId === communityId && u.status === "ACTIVE") ?? []);

  const handleCopyInviteLink = async () => {
    let link = inviteLinkData?.inviteLink;
    if (!link) {
      const result = await refetchInviteLink();
      link = result.data?.inviteLink;
    }
    if (link) {
      await navigator.clipboard.writeText(link);
      toast({ title: "Copied", description: "Invite link copied to clipboard. Share via WhatsApp, email, etc." });
    } else {
      toast({ title: "Unable to get link", variant: "destructive" });
    }
  };

  const handleInviteByEmail = async () => {
    if (!inviteEmail.trim()) return;
    await inviteByEmail.mutateAsync(inviteEmail.trim());
    setInviteEmail("");
    setInviteDialogOpen(false);
  };

  if (isLoading) return <Layout><LoadingSpinner /></Layout>;
  if (!communityId) return <Layout><div className="p-8 text-center text-muted-foreground">No community assigned.</div></Layout>;

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Community Members</h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">View and manage all active residents in your community. Invite by email or share the app link.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setInviteDialogOpen(true)} className="gap-2">
            <UserPlus className="w-4 h-4" />
            Invite by email
          </Button>
          <Button variant="outline" onClick={() => { setInviteLinkDialogOpen(true); refetchInviteLink(); }} className="gap-2">
            <Link2 className="w-4 h-4" />
            Copy app invite link
          </Button>
        </div>

        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-4 border-b border-border/50 bg-slate-50/50 rounded-t-xl">
            <CardTitle className="flex items-center gap-2 text-lg text-slate-800">
              <UsersIcon className="w-5 h-5 text-indigo-600" /> Active Members ({communityMembers.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {communityMembers.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-slate-500 font-medium">No active members found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Name</th>
                      <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Email</th>
                      <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Role</th>
                      <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Joined</th>
                      <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {communityMembers.map(user => (
                      <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-900 flex items-center gap-2">
                          {user.fullName}
                          {user.role === 'COMMUNITY_MANAGER' && (
                            <Shield className="w-4 h-4 text-indigo-500" />
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-medium">{user.email}</td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className={`font-bold text-[10px] tracking-wider uppercase ${user.role === 'COMMUNITY_MANAGER' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                            {user.role.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-slate-500">{new Date(user.createdAt!).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-right">
                          {user.role !== "COMMUNITY_MANAGER" && user.id !== currentUser.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8"
                              onClick={() => removeMember.mutate(user.id)}
                              disabled={removeMember.isPending}
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-1" /> Remove
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite by email</DialogTitle>
            <DialogDescription>
              If the user is already on the app, they'll get a notification to accept. If not, use the invite link instead.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Input
              placeholder="email@example.com"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
            <div className="flex gap-2">
              <Button onClick={handleInviteByEmail} disabled={!inviteEmail.trim() || inviteByEmail.isPending}>
                {inviteByEmail.isPending ? "Sending..." : "Send invite"}
              </Button>
              <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={inviteLinkDialogOpen} onOpenChange={setInviteLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Copy app invite link</DialogTitle>
            <DialogDescription>
              Share this link with people who haven't joined the app yet. When they sign up using this link, they'll automatically join {inviteLinkData?.communityName || "your community"}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="flex gap-2">
              <Input readOnly value={inviteLinkData?.inviteLink || ""} className="font-mono text-sm" />
              <Button variant="outline" size="icon" onClick={handleCopyInviteLink} title="Copy">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <Button onClick={handleCopyInviteLink} className="w-full gap-2">
              <Copy className="w-4 h-4" />
              Copy & share via WhatsApp / email
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
