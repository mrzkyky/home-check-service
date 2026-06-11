"use client";

import { useState, useRef } from "react";
import { UploadCloud, FileImage, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FileUploadProps {
  label: string;
  onUploadSuccess: (url: string) => void;
}

export function FileUpload({ label, onUploadSuccess }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview immediately
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      // Assuming your next config rewrites /api to backend 8000 or using full URL
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      const res = await fetch(`${apiUrl}/upload/`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Upload failed");
      }

      const data = await res.json();
      onUploadSuccess(data.url);
      setPreviewUrl(data.url); // update preview with actual remote URL
    } catch (error) {
      console.error(error);
      alert("Failed to upload image. Please try again.");
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    // Optionally call an onRemove callback if needed
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      
      {!previewUrl ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-border/50 rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
        >
          {isUploading ? (
            <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
          ) : (
            <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />
          )}
          <p className="text-sm font-medium">
            {isUploading ? "Uploading..." : "Click to upload"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</p>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
            disabled={isUploading}
          />
        </div>
      ) : (
        <div className="relative border border-border/50 rounded-lg overflow-hidden group h-40">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={previewUrl} 
            alt="Preview" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Button variant="destructive" size="sm" onClick={handleRemove}>
              <X className="h-4 w-4 mr-2" /> Remove
            </Button>
          </div>
          {isUploading && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
