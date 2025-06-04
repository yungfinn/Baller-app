import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function CreateDemo() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);

  const createTestEvent = async () => {
    setIsCreating(true);
    console.log("=== DEMO EVENT CREATION START ===");
    
    try {
      const eventData = {
        title: "Demo Basketball Game",
        description: "A demonstration basketball pickup game",
        sportType: "basketball",
        skillLevel: "intermediate",
        maxPlayers: 8,
        locationName: "Demo Court",
        latitude: "37.7749",
        longitude: "-122.4194",
        eventDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        eventTime: "18:00",
        notes: "Demo event for testing workflow"
      };

      console.log("Sending event data:", eventData);

      const response = await fetch("/api/events/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("=== EVENT CREATED SUCCESSFULLY ===");
      console.log("Created event:", result);

      toast({
        title: "Demo Event Created!",
        description: `Basketball game "${result.title}" created with ID ${result.id}`,
      });

      // Show the complete workflow sequence
      setTimeout(() => {
        console.log("=== REDIRECTING TO DISCOVER ===");
        setLocation("/discover");
      }, 2000);

    } catch (error) {
      console.error("=== EVENT CREATION FAILED ===", error);
      toast({
        title: "Creation Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="mx-auto max-w-2xl">
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Event Creation Demo
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Demonstrates the complete workflow from event creation to discovery
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Demo Event Details:</h3>
              <ul className="text-blue-800 space-y-1">
                <li>• Title: Demo Basketball Game</li>
                <li>• Sport: Basketball</li>
                <li>• Skill Level: Intermediate</li>
                <li>• Max Players: 8</li>
                <li>• Location: Demo Court</li>
                <li>• Time: Tomorrow at 6:00 PM</li>
              </ul>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-2">Workflow Steps:</h3>
              <ol className="text-green-800 space-y-1">
                <li>1. Submit event data to backend API</li>
                <li>2. Store event in database</li>
                <li>3. Award rep points to host</li>
                <li>4. Show success notification</li>
                <li>5. Redirect to discovery page</li>
                <li>6. Event appears for other users to join</li>
              </ol>
            </div>

            <Button 
              onClick={createTestEvent}
              disabled={isCreating}
              className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-3"
            >
              {isCreating ? "Creating Demo Event..." : "Create Demo Event"}
            </Button>

            <p className="text-center text-gray-500 text-sm">
              Check browser console for detailed workflow logs
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}