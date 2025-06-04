import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertEventSchema, type InsertEvent } from "@shared/schema";
import BottomNavigation from "@/components/bottom-navigation";
import LocationPicker from "@/components/location-picker";
import { useAuth } from "@/hooks/useAuth";

export default function CreateEvent() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isLoading } = useAuth();
  const [selectedLocation, setSelectedLocation] = useState<{
    name: string;
    address: string;
    latitude: string;
    longitude: string;
  } | null>(null);

  const form = useForm<InsertEvent>({
    resolver: zodResolver(insertEventSchema),
    defaultValues: {
      title: "",
      description: "",
      sportType: "",
      skillLevel: "",
      maxPlayers: 8,
      locationName: "",
      latitude: "37.7749", // Default to San Francisco coordinates
      longitude: "-122.4194",
      eventDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] as any,
      eventTime: "",
      notes: "",
    },
  });

  const createEventMutation = useMutation({
    mutationFn: async (data: InsertEvent) => {
      console.log("=== MUTATION START ===");
      console.log("Mutation function called with data:", data);
      try {
        const response = await apiRequest("/api/events/test", "POST", data);
        console.log("API response success:", response);
        return response;
      } catch (error) {
        console.error("API request failed:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("=== MUTATION SUCCESS ===");
      console.log("Success callback triggered with data:", data);
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: "Event Created",
        description: "Your event has been created successfully.",
      });
      console.log("About to redirect to /event-created");
      setLocation("/event-created");
      console.log("Redirect called");
    },
    onError: (error: any) => {
      console.log("=== MUTATION ERROR ===");
      console.log("Event creation error:", error);
      
      // Check if it's a premium access error
      if (error.message?.includes("Premium access") || error.message?.includes("rep points")) {
        toast({
          title: "Premium Feature Required",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Event Creation Failed",
          description: error.message || "Please check your details and try again.",
          variant: "destructive",
        });
      }
    },
  });

  const handleLocationSelect = (location: {
    name: string;
    address: string;
    latitude: string;
    longitude: string;
  }) => {
    setSelectedLocation(location);
    form.setValue("locationName", location.name);
    form.setValue("latitude", location.latitude);
    form.setValue("longitude", location.longitude);
  };

  const onSubmit = (data: InsertEvent) => {
    console.log("=== FORM SUBMISSION START ===");
    console.log("Form submitted with data:", data);
    console.log("Form errors:", form.formState.errors);
    console.log("Form is valid:", form.formState.isValid);
    
    // Check if all required fields are filled
    if (!data.title || !data.sportType || !data.skillLevel || !data.locationName || !data.eventDate || !data.eventTime) {
      console.log("Missing required fields");
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    
    // Convert date and time to proper timestamp
    const eventDateTime = new Date(`${data.eventDate}T${data.eventTime}`);
    console.log("Event DateTime:", eventDateTime);
    
    createEventMutation.mutate({
      ...data,
      eventDate: eventDateTime,
    });
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if user is verified
  if (!user || user.verificationStatus !== 'approved') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-100">
          <div className="max-w-md mx-auto px-4 py-3">
            <div className="flex items-center space-x-3">
              <button onClick={() => setLocation("/")} className="text-gray-600">
                <i className="fas fa-arrow-left text-lg"></i>
              </button>
              <h1 className="text-xl font-baller text-gray-900">Create Event</h1>
            </div>
          </div>
        </header>

        <div className="max-w-md mx-auto p-6">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-xl text-red-600">Verification Required</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-gray-600">
                You must complete identity verification before creating events. This helps keep our community safe.
              </p>
              <div className="space-y-2">
                <p className="text-sm text-gray-500">Current status: {user?.verificationStatus || 'Not started'}</p>
                {user?.verificationStatus === 'pending' && (
                  <p className="text-sm text-blue-600">Your documents are under review</p>
                )}
                {user?.verificationStatus === 'rejected' && (
                  <p className="text-sm text-red-600">Please resubmit your documents</p>
                )}
              </div>
              <Button 
                onClick={() => setLocation("/identity-verification")}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                {user?.verificationStatus === 'pending' ? 'Check Status' : 'Start Verification'}
              </Button>
            </CardContent>
          </Card>
        </div>

        <BottomNavigation activePage="create" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center space-x-3">
            <button onClick={() => setLocation("/")} className="text-gray-600">
              <i className="fas fa-arrow-left text-lg"></i>
            </button>
            <h1 className="text-xl font-baller text-gray-900">Create Event</h1>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto p-4 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-baller text-gray-900">Host a Game</h2>
          <p className="text-gray-600">Bring people together for sports</p>
        </div>

        <Form {...form}>
          <form onSubmit={(e) => {
            e.preventDefault();
            console.log("Form onSubmit triggered");
            form.handleSubmit(onSubmit)(e);
          }} className="space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Event Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Pickup Basketball" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sportType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sport</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select sport" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="basketball">Basketball</SelectItem>
                            <SelectItem value="soccer">Soccer</SelectItem>
                            <SelectItem value="tennis">Tennis</SelectItem>
                            <SelectItem value="volleyball">Volleyball</SelectItem>
                            <SelectItem value="baseball">Baseball</SelectItem>
                            <SelectItem value="football">Football</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="skillLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Skill Level</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select skill level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="beginner">Beginner</SelectItem>
                            <SelectItem value="recreational">Recreational</SelectItem>
                            <SelectItem value="collegiate">Collegiate</SelectItem>
                            <SelectItem value="professional">Professional</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxPlayers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Players</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="2" 
                          max="50" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Location & Time */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">When & Where</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="locationName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Golden Gate Park Basketball Court"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Enter the name and location of your event
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="eventDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="eventTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Additional Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Additional Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Tell people about your event..."
                          rows={3}
                          value={field.value || ""}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="e.g., Bring water, parking available..."
                          rows={2}
                          value={field.value || ""}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="pb-20 space-y-3">
              <Button 
                type="submit" 
                className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl disabled:opacity-50"
                disabled={createEventMutation.isPending}
              >
                {createEventMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating Event...
                  </div>
                ) : (
                  "Create Event"
                )}
              </Button>
              

            </div>
          </form>
        </Form>
      </div>

      <BottomNavigation activePage="create" />
    </div>
  );
}
