import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Clock, User, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Location, VerificationDocument } from "@shared/schema";

export default function AdminPanel() {
  const [selectedTab, setSelectedTab] = useState("locations");

  // Fetch pending locations
  const { data: locations = [], isLoading: locationsLoading } = useQuery({
    queryKey: ["/api/admin/locations", { status: "pending" }],
  });

  // Fetch verification documents
  const { data: verificationDocs = [], isLoading: docsLoading } = useQuery({
    queryKey: ["/api/admin/verification-documents"],
  });

  // Location approval mutation
  const locationMutation = useMutation({
    mutationFn: async ({ locationId, status, notes }: { locationId: number; status: string; notes?: string }) => {
      return apiRequest(`/api/admin/locations/${locationId}/review`, {
        method: "POST",
        body: JSON.stringify({ status, reviewNotes: notes }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/locations"] });
    },
  });

  // Verification document approval mutation
  const verificationMutation = useMutation({
    mutationFn: async ({ userId, status, notes }: { userId: string; status: string; notes?: string }) => {
      return apiRequest(`/api/admin/users/${userId}/verification`, {
        method: "POST",
        body: JSON.stringify({ status, reviewNotes: notes }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/verification-documents"] });
    },
  });

  const LocationReviewCard = ({ location }: { location: Location }) => {
    const [reviewNotes, setReviewNotes] = useState("");

    const handleApprove = () => {
      locationMutation.mutate({
        locationId: location.id,
        status: "approved",
        notes: reviewNotes,
      });
      setReviewNotes("");
    };

    const handleReject = () => {
      locationMutation.mutate({
        locationId: location.id,
        status: "rejected", 
        notes: reviewNotes,
      });
      setReviewNotes("");
    };

    return (
      <Card className="mb-4">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">{location.name}</CardTitle>
              <p className="text-sm text-gray-600 mt-1">{location.address}</p>
            </div>
            <Badge variant="outline" className="ml-2">
              {location.locationType?.charAt(0).toUpperCase() + location.locationType?.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Location Details */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span>{location.city}, {location.state}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span>{new Date(location.createdAt!).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-400" />
                <span>Submitted by user</span>
              </div>
            </div>

            {/* Description */}
            {location.description && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Description:</p>
                <p className="text-sm text-gray-600">{location.description}</p>
              </div>
            )}

            {/* Safety Features */}
            {location.safetyFeatures && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Safety Features:</p>
                <p className="text-sm text-gray-600">{location.safetyFeatures}</p>
              </div>
            )}

            {/* Review Notes */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Review Notes (optional)
              </label>
              <Textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add any notes about this location review..."
                className="h-20"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <Button
                onClick={handleApprove}
                disabled={locationMutation.isPending}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve
              </Button>
              <Button
                onClick={handleReject}
                disabled={locationMutation.isPending}
                variant="destructive"
                className="flex-1"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const VerificationReviewCard = ({ doc }: { doc: VerificationDocument }) => {
    const [reviewNotes, setReviewNotes] = useState("");

    const handleApprove = () => {
      verificationMutation.mutate({
        userId: doc.userId,
        status: "verified",
        notes: reviewNotes,
      });
      setReviewNotes("");
    };

    const handleReject = () => {
      verificationMutation.mutate({
        userId: doc.userId,
        status: "rejected",
        notes: reviewNotes,
      });
      setReviewNotes("");
    };

    return (
      <Card className="mb-4">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">Identity Verification</CardTitle>
              <p className="text-sm text-gray-600 mt-1">User ID: {doc.userId}</p>
            </div>
            <Badge variant="outline" className="ml-2">
              {doc.documentType?.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Document Details */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span>{new Date(doc.createdAt!).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-gray-400" />
                <span className="capitalize">{doc.status}</span>
              </div>
            </div>

            {/* Document Preview */}
            {doc.fileUrl && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Document:</p>
                <img 
                  src={doc.fileUrl} 
                  alt="Verification document" 
                  className="max-w-full h-40 object-contain border rounded-lg"
                />
              </div>
            )}

            {/* Review Notes */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Review Notes (optional)
              </label>
              <Textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add any notes about this verification review..."
                className="h-20"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <Button
                onClick={handleApprove}
                disabled={verificationMutation.isPending}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Verify
              </Button>
              <Button
                onClick={handleReject}
                disabled={verificationMutation.isPending}
                variant="destructive"
                className="flex-1"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-primary to-primary/80 rounded-lg flex items-center justify-center">
              <i className="fas fa-shield-alt text-white text-sm"></i>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="locations">
              Location Reviews ({locations.length})
            </TabsTrigger>
            <TabsTrigger value="verifications">
              Identity Verifications ({verificationDocs.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="locations" className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Pending Location Reviews</h2>
                <Badge variant="secondary">{locations.length} pending</Badge>
              </div>

              {locationsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center mx-auto mb-3 animate-pulse">
                      <MapPin className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-gray-600">Loading locations...</p>
                  </div>
                </div>
              ) : locations.length === 0 ? (
                <div className="text-center py-12">
                  <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No pending reviews</h3>
                  <p className="text-gray-600">All location submissions have been reviewed.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {locations.map((location: Location) => (
                    <LocationReviewCard key={location.id} location={location} />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="verifications" className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Pending Identity Verifications</h2>
                <Badge variant="secondary">{verificationDocs.length} pending</Badge>
              </div>

              {docsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center mx-auto mb-3 animate-pulse">
                      <AlertCircle className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-gray-600">Loading verifications...</p>
                  </div>
                </div>
              ) : verificationDocs.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No pending verifications</h3>
                  <p className="text-gray-600">All identity verifications have been reviewed.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {verificationDocs.map((doc: VerificationDocument) => (
                    <VerificationReviewCard key={doc.id} doc={doc} />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}