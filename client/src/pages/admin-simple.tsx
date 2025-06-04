import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, Shield, User } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

interface UserVerification {
  userId: string;
  userEmail: string;
  userFirstName: string;
  userLastName: string;
  userProfileImage: string;
  documents: {
    id: number;
    documentType: string;
    fileName: string;
    fileUrl: string;
    reviewStatus: string;
    uploadedAt: string;
  }[];
}

export default function AdminSimple() {
  const [reviewNotes, setReviewNotes] = useState("");

  const { data: verificationData = [], isLoading, error } = useQuery({
    queryKey: ["verificationDocs"],
    queryFn: async () => {
      const response = await fetch('/api/admin/verification-documents');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response.json();
    },
    retry: false,
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ userId, status, notes }: { userId: string; status: string; notes: string }) => {
      const response = await fetch(`/api/admin/users/${userId}/verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reviewNotes: notes }),
      });
      if (!response.ok) throw new Error('Review failed');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["verificationDocs"] });
      setReviewNotes("");
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Shield className="w-8 h-8 text-blue-600 mx-auto mb-4" />
          <div className="text-xl font-bold">Loading Admin Panel</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <XCircle className="w-8 h-8 text-red-600 mx-auto mb-4" />
          <div className="text-xl font-bold">Error Loading Data</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Panel</h1>
          <p className="text-gray-600">Review and approve user verification documents</p>
        </div>

        <div className="space-y-6">
          {verificationData.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold">No Pending Reviews</h3>
                <p className="text-gray-600">All verification documents have been processed</p>
              </CardContent>
            </Card>
          ) : (
            verificationData.map((userVerification: UserVerification) => (
              <Card key={userVerification.userId} className="overflow-hidden">
                <CardHeader className="bg-gray-50">
                  <CardTitle className="flex items-center gap-3">
                    <User className="w-5 h-5" />
                    <div>
                      <div className="font-semibold">
                        {userVerification.userFirstName || 'No First Name'} {userVerification.userLastName || 'No Last Name'}
                      </div>
                      <div className="text-sm text-gray-600 font-normal">
                        <strong>Email:</strong> {userVerification.userEmail}
                      </div>
                      <div className="text-xs text-gray-500 font-normal">
                        <strong>User ID:</strong> {userVerification.userId}
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {userVerification.documents.map((doc) => (
                      <div key={doc.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline">
                            {doc.documentType.replace('_', ' ').toUpperCase()}
                          </Badge>
                          <Badge variant="secondary">{doc.reviewStatus}</Badge>
                        </div>
                        
                        {/* Image Preview */}
                        <div className="mb-3">
                          <img 
                            src={doc.fileUrl} 
                            alt={`${doc.documentType} document`}
                            className="w-full max-w-48 h-auto rounded border object-cover"
                            onLoad={(e) => {
                              console.log("Image loaded successfully:", doc.fileUrl);
                            }}
                            onError={(e) => {
                              console.error("Image failed to load:", doc.fileUrl);
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                          <div className="hidden text-sm text-gray-500 italic">
                            Image preview not available - Path: {doc.fileUrl}
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2">
                          <strong>File:</strong> {doc.fileName || 'No filename'}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Uploaded:</strong> {new Date(doc.uploadedAt).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          <strong>Path:</strong> {doc.fileUrl}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Review Notes</label>
                      <Textarea
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        placeholder="Add notes about the verification review..."
                        rows={3}
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={() => reviewMutation.mutate({
                          userId: userVerification.userId,
                          status: 'approved',
                          notes: reviewNotes
                        })}
                        disabled={reviewMutation.isPending}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => reviewMutation.mutate({
                          userId: userVerification.userId,
                          status: 'rejected',
                          notes: reviewNotes
                        })}
                        disabled={reviewMutation.isPending}
                        variant="destructive"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}