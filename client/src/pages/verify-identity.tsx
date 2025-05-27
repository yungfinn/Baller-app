import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera, Upload, Shield, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface VerificationStep {
  id: string;
  title: string;
  description: string;
  icon: any;
  documentType: string;
  completed: boolean;
}

export default function VerifyIdentity() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeStep, setActiveStep] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Fetch user's verification documents
  const { data: documents = [] } = useQuery({
    queryKey: ["/api/verification/documents"],
  });

  // Create verification steps based on documents
  const verificationSteps: VerificationStep[] = [
    {
      id: "selfie",
      title: "Take a selfie",
      description: "Take a clear photo of yourself for identity verification",
      icon: Camera,
      documentType: "selfie",
      completed: documents.some((doc: any) => doc.documentType === "selfie"),
    },
    {
      id: "id_upload",
      title: "Upload ID",
      description: "Upload your government-issued photo ID (front and back)",
      icon: Upload,
      documentType: "id_front",
      completed: documents.some((doc: any) => doc.documentType === "id_front"),
    },
  ];

  const uploadMutation = useMutation({
    mutationFn: async (data: { file: File; documentType: string }) => {
      const formData = new FormData();
      formData.append("file", data.file);
      
      // For now, we'll simulate file upload with a data URL
      // In production, you'd upload to a secure file storage service
      const fileUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(data.file);
      });

      return apiRequest("/api/verification/upload", {
        method: "POST",
        body: JSON.stringify({
          documentType: data.documentType,
          fileName: data.file.name,
          fileUrl: fileUrl,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/verification/documents"] });
      setActiveStep(null);
      toast({
        title: "Document uploaded successfully",
        description: "Your verification document has been submitted for review.",
      });
    },
    onError: (error) => {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: "Please try again or contact support if the issue persists.",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = async (file: File, documentType: string) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      await uploadMutation.mutateAsync({ file, documentType });
    } finally {
      setUploading(false);
    }
  };

  const handleCameraCapture = (documentType: string) => {
    if (cameraInputRef.current) {
      cameraInputRef.current.accept = "image/*";
      cameraInputRef.current.capture = "user";
      cameraInputRef.current.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          handleFileUpload(file, documentType);
        }
      };
      cameraInputRef.current.click();
    }
  };

  const handleFileSelect = (documentType: string) => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = "image/*";
      fileInputRef.current.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          handleFileUpload(file, documentType);
        }
      };
      fileInputRef.current.click();
    }
  };

  const getVerificationStatus = () => {
    if (!user) return "unverified";
    return user.verificationStatus || "unverified";
  };

  const getStatusBadge = () => {
    const status = getVerificationStatus();
    switch (status) {
      case "verified":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Verified
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Pending Review
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <Shield className="w-3 h-3 mr-1" />
            Unverified
          </Badge>
        );
    }
  };

  const allStepsCompleted = verificationSteps.every(step => step.completed);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center space-x-3">
            <button onClick={() => setLocation("/profile")} className="text-gray-600">
              <i className="fas fa-arrow-left text-lg"></i>
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-baller text-gray-900">Identity Verification</h1>
            </div>
            {getStatusBadge()}
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Baller Logo and Welcome */}
        <div className="text-center space-y-4 py-6">
          <div className="inline-flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
              <i className="fas fa-basketball text-white text-sm"></i>
            </div>
            <span className="text-2xl font-baller text-red-500 tracking-tight">BALLER</span>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">Verify your identity</h2>
            <p className="text-gray-600">
              Verify your identity to create a trusted community and unlock all features.
            </p>
          </div>
        </div>

        {/* Verification Steps */}
        <div className="space-y-4">
          {verificationSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Card 
                key={step.id}
                className={`cursor-pointer transition-all ${
                  step.completed 
                    ? "border-green-200 bg-green-50" 
                    : activeStep === step.id 
                    ? "border-red-200 bg-red-50" 
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => !step.completed && setActiveStep(activeStep === step.id ? null : step.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      step.completed 
                        ? "bg-green-100 text-green-600" 
                        : "bg-gray-100 text-gray-600"
                    }`}>
                      {step.completed ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : (
                        <Icon className="w-6 h-6" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{step.title}</h3>
                      <p className="text-sm text-gray-600">{step.description}</p>
                    </div>
                    
                    {step.completed && (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    )}
                  </div>
                  
                  {/* Upload Options */}
                  {activeStep === step.id && !step.completed && (
                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                      {step.documentType === "selfie" ? (
                        <div className="space-y-2">
                          <Button
                            onClick={() => handleCameraCapture(step.documentType)}
                            disabled={uploading}
                            className="w-full bg-red-500 hover:bg-red-600 text-white"
                          >
                            <Camera className="w-4 h-4 mr-2" />
                            {uploading ? "Uploading..." : "Take Photo"}
                          </Button>
                          <Button
                            onClick={() => handleFileSelect(step.documentType)}
                            disabled={uploading}
                            variant="outline"
                            className="w-full"
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Upload from Gallery
                          </Button>
                        </div>
                      ) : (
                        <Button
                          onClick={() => handleFileSelect(step.documentType)}
                          disabled={uploading}
                          className="w-full bg-red-500 hover:bg-red-600 text-white"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          {uploading ? "Uploading..." : "Upload ID Document"}
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Security Notice */}
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">
            Your information will be securely stored and only used for verification purposes.
          </p>
        </div>

        {/* Completion Message */}
        {allStepsCompleted && getVerificationStatus() === "unverified" && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4 text-center space-y-3">
              <Clock className="w-8 h-8 text-blue-600 mx-auto" />
              <div>
                <h3 className="font-semibold text-blue-900">Verification Submitted</h3>
                <p className="text-sm text-blue-700">
                  Your documents are being reviewed. You'll be notified once verification is complete.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*"
      />
      <input
        ref={cameraInputRef}
        type="file"
        className="hidden"
        accept="image/*"
        capture="user"
      />
    </div>
  );
}