import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Flag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@shared/routes";

const REPORT_REASONS = [
  { value: "INAPPROPRIATE_CONTENT", label: "Inappropriate content" },
  { value: "MISLEADING_DESCRIPTION", label: "Misleading description" },
  { value: "FAKE_OR_SPAM", label: "Fake or spam" },
  { value: "QUALITY_ISSUE", label: "Quality issue" },
  { value: "SCAM_OR_FRAUD", label: "Scam or fraud" },
  { value: "OTHER", label: "Other" },
] as const;

type ReportListingDialogProps = {
  listingId: string;
  listingTitle: string;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
};

export function ReportListingDialog({
  listingId,
  listingTitle,
  trigger,
  onSuccess,
}: ReportListingDialogProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>("");
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!reason) {
      toast({ title: "Please select a reason", variant: "destructive" });
      return;
    }
    if (reason === "OTHER" && !details.trim()) {
      toast({ title: "Please provide details for 'Other'", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(api.reports.create.path, {
        method: api.reports.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          reason,
          details: reason === "OTHER" ? details.trim() : null,
        }),
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to submit report");
      }
      toast({ title: "Report submitted", description: "Thank you. The community manager will review it." });
      setOpen(false);
      setReason("");
      setDetails("");
      onSuccess?.();
    } catch (err) {
      toast({ title: "Failed to report", description: (err as Error).message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive gap-1.5 h-8">
            <Flag className="w-3.5 h-3.5" />
            Report
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Report listing</DialogTitle>
          <DialogDescription>
            Report &quot;{listingTitle}&quot;. Your report will be reviewed by the community manager.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Reason for report</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {REPORT_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Additional details {reason === "OTHER" && "(required)"}</Label>
            <Textarea
              placeholder={
                reason === "OTHER"
                  ? "Please describe why you are reporting this listing..."
                  : "Optional: provide more context"
              }
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
