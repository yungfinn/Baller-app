import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, Camera, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function IdentityVerification() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [idFile, setIdFile] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string>("");
  const [idPreview, setIdPreview] = useState<string>("");

  const uploadMutation = useMutation({
    mutationFn: async (files: { selfie: File; governmentId: File }) => {
      console.log("Uploading files:", files.selfie, files.governmentId);
      
      // Create FormData for actual file upload
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Documents Uploaded",
        description: "Your identity verification is being reviewed. You'll be notified when approved.",
      });
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload documents. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (file: File, type: 'selfie' | 'id') => {
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
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

  const getVerificationStatus = () => {
    if (user?.verificationStatus === 'verified') {
      return { color: 'green', text: 'Verified', icon: CheckCircle };
    }
    if (user?.verificationStatus === 'pending') {
      return { color: 'yellow', text: 'Under Review', icon: AlertCircle };
    }
    if (user?.verificationStatus === 'rejected') {
      return { color: 'red', text: 'Rejected', icon: AlertCircle };
    }
    return { color: 'gray', text: 'Not Submitted', icon: Upload };
  };

  const status = getVerificationStatus();
  const StatusIcon = status.icon;

  if (user?.verificationStatus === 'verified') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Identity Verified</h2>
            <p className="text-gray-600 mb-6">Your identity has been successfully verified. You now have full access to the platform.</p>
            <Button onClick={() => setLocation("/")} className="bg-red-600 hover:bg-red-700">
              Continue to App
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button onClick={() => setLocation("/")} className="text-gray-600">
                <i className="fas fa-arrow-left text-lg"></i>
              </button>
              <h1 className="text-xl font-bold text-gray-900">Identity Verification</h1>
            </div>
            <Badge 
              variant="secondary" 
              className={`bg-${status.color}-100 text-${status.color}-800`}
            >
              <StatusIcon className="w-3 h-3 mr-1" />
              {status.text}
            </Badge>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="w-5 h-5" />
              <span>Required Documents</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                For community safety, all users must verify their identity before accessing events. 
                This helps ensure a trusted environment for everyone.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">We need:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Clear selfie photo</li>
                <li>• Government-issued photo ID (driver's license, passport, etc.)</li>
                <li>• Files must be under 10MB each</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Selfie Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Camera className="w-5 h-5" />
              <span>Selfie Photo</span>
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
        <div className="pb-20">
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
              "Submit for Review"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}