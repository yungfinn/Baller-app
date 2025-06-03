import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Camera, FileText, CheckCircle } from "lucide-react";

export default function UploadTest() {
  const { toast } = useToast();
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [idFile, setIdFile] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [idPreview, setIdPreview] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const uploadMutation = useMutation({
    mutationFn: async (files: { selfie: File; governmentId: File }) => {
      const formData = new FormData();
      formData.append("selfie", files.selfie);
      formData.append("governmentId", files.governmentId);
      
      const response = await fetch("/api/verification/upload-dev", {
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
      console.log("Upload successful:", data);
      setUploadSuccess(true);
      toast({
        title: "Documents Uploaded Successfully",
        description: "Your verification documents have been submitted for review.",
      });
    },
    onError: (error: any) => {
      console.error("Upload error:", error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload documents. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (file: File, type: 'selfie' | 'id') => {
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select a file smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (type === 'selfie') {
        setSelfieFile(file);
        setSelfiePreview(result);
      } else {
        setIdFile(file);
        setIdPreview(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (!selfieFile || !idFile) {
      toast({
        title: "Missing Documents",
        description: "Please upload both a selfie and government ID.",
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate({ selfie: selfieFile, governmentId: idFile });
  };

  if (uploadSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Upload Successful</h2>
            <p className="text-gray-600 mb-6">Your verification documents have been submitted for admin review.</p>
            <Button onClick={() => window.location.href = "/"} className="bg-red-600 hover:bg-red-700">
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Document Upload Test</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 text-center">
              Testing verification document upload functionality
            </p>
          </CardContent>
        </Card>

        {/* Selfie Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Camera className="w-5 h-5" />
              <span>Selfie</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
                onClick={() => document.getElementById('selfie-input')?.click()}
              >
                {selfiePreview ? (
                  <div className="space-y-2">
                    <img src={selfiePreview} alt="Selfie preview" className="w-24 h-24 object-cover rounded-lg mx-auto" />
                    <p className="text-sm text-green-600">Selfie uploaded</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Camera className="w-12 h-12 text-gray-400 mx-auto" />
                    <p className="text-sm text-gray-600">Click to upload selfie</p>
                  </div>
                )}
              </div>
              <input
                id="selfie-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file, 'selfie');
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* ID Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Government ID</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
                onClick={() => document.getElementById('id-input')?.click()}
              >
                {idPreview ? (
                  <div className="space-y-2">
                    <img src={idPreview} alt="ID preview" className="w-24 h-24 object-cover rounded-lg mx-auto" />
                    <p className="text-sm text-green-600">ID uploaded</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto" />
                    <p className="text-sm text-gray-600">Click to upload government ID</p>
                  </div>
                )}
              </div>
              <input
                id="id-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file, 'id');
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <Button 
          onClick={handleSubmit}
          disabled={!selfieFile || !idFile || uploadMutation.isPending}
          className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl disabled:opacity-50"
        >
          {uploadMutation.isPending ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Uploading...
            </div>
          ) : (
            "Test Upload"
          )}
        </Button>
      </div>
    </div>
  );
}