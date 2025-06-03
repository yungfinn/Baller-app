import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function TestAuth() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState("43019661");

  const createTestUser = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest("/api/auth/test-user", "POST", {
        id: userId,
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
        verificationStatus: "approved"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Test User Created",
        description: "User created and verified for testing",
      });
      setLocation("/create");
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const testEventCreation = useMutation({
    mutationFn: async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      return await apiRequest("/api/events", "POST", {
        title: "Test Basketball Game",
        description: "Testing event creation workflow",
        sportType: "basketball",
        skillLevel: "intermediate",
        maxPlayers: 8,
        locationName: "Local Court",
        latitude: "37.7749",
        longitude: "-122.4194",
        eventDate: tomorrow,
        eventTime: "18:00",
        notes: "Test event for verification"
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Event Created Successfully",
        description: `Event ID: ${data.id}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Event Creation Failed",
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
            <CardTitle>Authentication & Event Testing</CardTitle>
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
                onClick={() => createTestUser.mutate(userId)}
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={createTestUser.isPending}
              >
                {createTestUser.isPending ? "Creating..." : "1. Create Test User"}
              </Button>
              
              <Button
                onClick={() => testEventCreation.mutate()}
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={testEventCreation.isPending}
              >
                {testEventCreation.isPending ? "Creating..." : "2. Test Event Creation"}
              </Button>
              
              <Button
                onClick={() => setLocation("/create")}
                variant="outline"
                className="w-full"
              >
                3. Go to Create Event Form
              </Button>
            </div>
            
            <p className="text-sm text-gray-600">
              This will test the complete event creation workflow with a verified user.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}