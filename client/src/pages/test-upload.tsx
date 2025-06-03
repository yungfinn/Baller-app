import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export default function TestUpload() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("selfie", file);
      formData.append("governmentId", file); // Use same file for both for testing
      
      const response = await fetch("/api/verification/upload", {
        method: "POST",
        credentials: "include",
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Upload failed");
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Upload Successful",
        description: "Test upload completed successfully",
      });
      console.log("Upload response:", data);
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Upload test failed",
        variant: "destructive",
      });
      console.error("Upload error:", error);
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a file first",
        variant: "destructive",
      });
      return;
    }
    uploadMutation.mutate(selectedFile);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <Button onClick={() => setLocation("/")} className="mb-4">
          ← Back
        </Button>
        
        <Card>
          <CardHeader>
            <CardTitle>Document Upload Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">
                User: {user?.email || "Not authenticated"}
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Status: {user?.verificationStatus || "Unknown"}
              </p>
            </div>
            
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="mb-2"
              />
              {selectedFile && (
                <p className="text-sm text-green-600">
                  Selected: {selectedFile.name}
                </p>
              )}
            </div>
            
            <Button 
              onClick={handleUpload}
              disabled={!selectedFile || uploadMutation.isPending}
              className="w-full"
            >
              {uploadMutation.isPending ? "Uploading..." : "Test Upload"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}