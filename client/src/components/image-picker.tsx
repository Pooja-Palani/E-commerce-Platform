import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ImagePlus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ImagePickerProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  className?: string;
}

export function ImagePicker({ value, onChange, label = "Product Image", className }: ImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image (JPEG, PNG, WebP, GIF)", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Image must be under 5MB", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || "Upload failed");
      }
      const { url } = await res.json();
      onChange(url);
    } catch (err) {
      toast({ title: "Upload failed", description: (err as Error).message, variant: "destructive" });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className={className}>
      <Label className="font-bold">{label}</Label>
      <div className="mt-2 flex items-center gap-4">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          disabled={uploading}
        />
        {value ? (
          <div className="relative">
            <img
              src={value}
              alt="Preview"
              className="h-32 w-32 rounded-xl object-cover border-2 border-border/50"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-7 w-7 rounded-full"
              onClick={() => onChange(null)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            className="h-32 w-32 rounded-xl border-2 border-dashed border-primary/30 hover:border-primary/50 hover:bg-primary/5 flex flex-col gap-2"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            <ImagePlus className="h-8 w-8 text-primary/60" />
            <span className="text-xs font-medium text-muted-foreground">
              {uploading ? "Uploading..." : "Choose from gallery"}
            </span>
          </Button>
        )}
        {!value && (
          <p className="text-xs text-muted-foreground">
            Tap to select from your photos or camera. Max 5MB.
          </p>
        )}
      </div>
    </div>
  );
}
