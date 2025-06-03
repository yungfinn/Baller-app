import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function AdminQuickApprove() {
  const [userId, setUserId] = useState("43019661"); // Current logged in user
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const approveMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest(`/api/admin/users/${userId}/verification`, "POST", {
        status: "approved",
        reviewNotes: "Quick approval for testing"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "User Approved",
        description: "User verification status updated to approved",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Approval Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const submitDocumentsMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest("/api/verification/upload", "POST", {
        selfieFileName: `selfie_${userId}_${Date.now()}.jpg`,
        governmentIdFileName: `id_${userId}_${Date.now()}.jpg`,
        selfieSize: 1024000,
        governmentIdSize: 2048000
      });
    },
    onSuccess: () => {
      toast({
        title: "Documents Submitted",
        description: "Test verification documents created",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-md mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Admin Verification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">User ID:</label>
              <Input
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Enter user ID"
              />
            </div>
            
            <div className="space-y-2">
              <Button
                onClick={() => submitDocumentsMutation.mutate(userId)}
                variant="outline"
                className="w-full"
                disabled={submitDocumentsMutation.isPending}
              >
                {submitDocumentsMutation.isPending ? "Creating..." : "1. Submit Test Documents"}
              </Button>
              
              <Button
                onClick={() => approveMutation.mutate(userId)}
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={approveMutation.isPending}
              >
                {approveMutation.isPending ? "Approving..." : "2. Approve Verification"}
              </Button>
            </div>
            
            <p className="text-sm text-gray-600">
              This will approve user verification so they can create events.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}