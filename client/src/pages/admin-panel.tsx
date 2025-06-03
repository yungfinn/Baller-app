import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Clock, User, CheckCircle, XCircle, AlertCircle, Plus, Shield, Calendar } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

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

export default function AdminPanel() {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("verification");

  // Fetch verification documents with explicit credentials
  const { data: verificationData = [], isLoading: docsLoading, error: docsError } = useQuery({
    queryKey: ["verificationDocs"],
    queryFn: () => fetch('/api/admin/verification-documents', { 
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    }).then(res => {
      console.log('Admin fetch response:', res.status, res.statusText);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      return res.json();
    }),
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 0,
  });
  
  // Debug logging
  console.log('Admin panel debug:', {
    docsLoading,
    docsError: docsError?.message,
    verificationDataLength: Array.isArray(verificationData) ? verificationData.length : 'not array',
    verificationData
  });

  // Early return for loading states
  if (docsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center mx-auto mb-4">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div className="text-xl font-bold text-gray-900 mb-2">Loading Admin Panel</div>
          <div className="text-gray-600">Fetching verification data...</div>
        </div>
      </div>
    );
  }

  // Error state with detailed feedback
  if (docsError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-4 h-4 text-white" />
          </div>
          <div className="text-xl font-bold text-gray-900 mb-2">Admin Panel Error</div>
          <div className="text-gray-600 mb-4">Failed to load verification data</div>
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg mb-4">
            {docsError.message}
          </div>
          <Button onClick={() => window.location.reload()} variant="outline">
            Retry Loading
          </Button>
        </div>
      </div>
    );
  }

  // No data fallback
  if (!verificationData || verificationData.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 bg-gray-400 rounded-lg flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-4 h-4 text-white" />
          </div>
          <div className="text-xl font-bold text-gray-900 mb-2">No Pending Verifications</div>
          <div className="text-gray-600">All verification documents have been reviewed.</div>
        </div>
      </div>
    );
  }

  // Verification mutation
  const verificationMutation = useMutation({
    mutationFn: async ({ userId, status, notes }: { userId: string; status: string; notes?: string }) => {
      return apiRequest(`/api/admin/users/${userId}/verification`, "POST", {
        status, 
        reviewNotes: notes
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["verificationDocs"] });
      toast({
        title: "Verification Updated",
        description: "User verification status has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update verification status.",
        variant: "destructive",
      });
    },
  });

  const UserVerificationCard = ({ verification }: { verification: UserVerification }) => {
    const [reviewNotes, setReviewNotes] = useState("");
    
    const selfieDoc = verification.documents.find(d => d.documentType === 'selfie');
    const idDoc = verification.documents.find(d => d.documentType === 'government_id');
    
    const displayName = verification.userFirstName && verification.userLastName 
      ? `${verification.userFirstName} ${verification.userLastName}`
      : verification.userEmail?.split('@')[0] || verification.userId;

    const handleApprove = () => {
      verificationMutation.mutate({
        userId: verification.userId,
        status: "approved",
        notes: reviewNotes,
      });
      setReviewNotes("");
    };

    const handleReject = () => {
      verificationMutation.mutate({
        userId: verification.userId,
        status: "rejected",
        notes: reviewNotes,
      });
      setReviewNotes("");
    };

    return (
      <Card className="bg-gray-800 border-gray-700 text-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {verification.userProfileImage ? (
                <img 
                  src={verification.userProfileImage} 
                  alt="Profile" 
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-300" />
                </div>
              )}
              <div>
                <CardTitle className="text-white">{displayName}</CardTitle>
                <p className="text-sm text-gray-400">{verification.userEmail}</p>
              </div>
            </div>
            <Badge variant="outline" className="border-red-500 text-red-400">
              Pending
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Username */}
            <div className="text-center">
              <Label className="text-gray-300">Username</Label>
              <p className="text-white font-medium">{displayName}</p>
            </div>
            
            {/* Selfie */}
            <div className="text-center">
              <Label className="text-gray-300">Selfie</Label>
              {selfieDoc ? (
                <div className="mt-2">
                  <div className="w-16 h-16 bg-gray-600 rounded-lg mx-auto flex items-center justify-center">
                    <User className="w-8 h-8 text-gray-300" />
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-sm mt-2">Not uploaded</p>
              )}
            </div>

            {/* ID Document */}
            <div className="text-center">
              <Label className="text-gray-300">ID</Label>
              {idDoc ? (
                <div className="mt-2">
                  <div className="w-16 h-16 bg-gray-600 rounded-lg mx-auto flex items-center justify-center">
                    <Shield className="w-8 h-8 text-gray-300" />
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-sm mt-2">Not uploaded</p>
              )}
            </div>
          </div>

          {/* Status and Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-700">
            <Badge variant="outline" className="border-red-500 text-red-400">
              Pending
            </Badge>
            <div className="flex space-x-2">
              <Button
                onClick={handleApprove}
                disabled={verificationMutation.isPending}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Approve
              </Button>
              <Button
                onClick={handleReject}
                disabled={verificationMutation.isPending}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Reject
              </Button>
            </div>
          </div>

          {/* Review Notes */}
          <div>
            <Label className="text-gray-300">Review Notes (Optional)</Label>
            <Textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Add any notes about this verification..."
              className="mt-2 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">🔥</span>
            </div>
            <h1 className="text-xl font-bold text-white">Baller</h1>
          </div>
          <div className="text-sm text-gray-400">
            Admin: theyungfinn@gmail.com
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-900 min-h-screen p-4">
          <nav className="space-y-2">
            <button
              onClick={() => setSelectedTab("events")}
              className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                selectedTab === "events" 
                  ? "bg-gray-700 text-white" 
                  : "text-gray-300 hover:bg-gray-800"
              }`}
            >
              Manage Events
            </button>
            <button
              onClick={() => setSelectedTab("locations")}
              className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                selectedTab === "locations" 
                  ? "bg-gray-700 text-white" 
                  : "text-gray-300 hover:bg-gray-800"
              }`}
            >
              Approve Locations
            </button>
            <button
              onClick={() => setSelectedTab("verification")}
              className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                selectedTab === "verification" 
                  ? "bg-red-600 text-white" 
                  : "text-gray-300 hover:bg-gray-800"
              }`}
            >
              Verify Users
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {selectedTab === "verification" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Verify Users</h2>
                <Badge variant="secondary" className="bg-gray-700 text-gray-300">
                  {verificationData.length} pending
                </Badge>
              </div>

              {docsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center mx-auto mb-3 animate-pulse">
                      <AlertCircle className="w-4 h-4 text-gray-400" />
                    </div>
                    <p className="text-gray-400">Loading verifications...</p>
                  </div>
                </div>
              ) : verificationData.length === 0 ? (
                <div className="text-center py-12">
                  <Shield className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">No pending verifications</h3>
                  <p className="text-gray-400">All identity verifications have been reviewed.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {verificationData.map((verification: UserVerification) => (
                    <UserVerificationCard key={verification.userId} verification={verification} />
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedTab === "events" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Manage Events</h2>
                <Button className="bg-red-600 hover:bg-red-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Event
                </Button>
              </div>
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No events created yet</h3>
                <p className="text-gray-400">Create your first manually curated event for the beta.</p>
              </div>
            </div>
          )}

          {selectedTab === "locations" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Approve Locations</h2>
                <Badge variant="secondary" className="bg-gray-700 text-gray-300">
                  0 pending
                </Badge>
              </div>
              <div className="text-center py-12">
                <MapPin className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No location requests</h3>
                <p className="text-gray-400">Users haven't submitted any locations for review yet.</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}