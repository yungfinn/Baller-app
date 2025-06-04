import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertEventSchema, type InsertEvent } from "@shared/schema";

export default function TestCreateEvent() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertEvent>({
    resolver: zodResolver(insertEventSchema),
    defaultValues: {
      title: "",
      description: "",
      sportType: "",
      skillLevel: "",
      maxPlayers: 8,
      locationName: "",
      latitude: "37.7749",
      longitude: "-122.4194",
      eventDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] as any,
      eventTime: "",
      notes: "",
    },
  });

  const createEventMutation = useMutation({
    mutationFn: async (data: InsertEvent) => {
      console.log("=== FORM SUBMISSION START ===");
      console.log("Form data being submitted:", data);
      
      const response = await apiRequest("/api/events/test", "POST", data);
      console.log("API Response:", response);
      return response;
    },
    onSuccess: (data) => {
      console.log("=== EVENT CREATION SUCCESS ===");
      console.log("Event created:", data);
      
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: "Event Created Successfully",
        description: `Your ${data.sportType} event "${data.title}" has been created.`,
      });
      
      console.log("Redirecting to discover page...");
      setLocation("/discover");
    },
    onError: (error: any) => {
      console.log("=== EVENT CREATION ERROR ===");
      console.error("Error creating event:", error);
      
      toast({
        title: "Event Creation Failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertEvent) => {
    console.log("=== FORM VALIDATION PASSED ===");
    console.log("Validated form data:", data);
    console.log("Form errors:", form.formState.errors);
    
    createEventMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="mx-auto max-w-2xl">
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Test Create Event
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Title *</FormLabel>
                      <FormControl>
                        <Input placeholder="Basketball pickup game" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe your event..."
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="sportType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sport *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select sport" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="basketball">Basketball</SelectItem>
                            <SelectItem value="soccer">Soccer</SelectItem>
                            <SelectItem value="tennis">Tennis</SelectItem>
                            <SelectItem value="volleyball">Volleyball</SelectItem>
                            <SelectItem value="baseball">Baseball</SelectItem>
                            <SelectItem value="football">Football</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="skillLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Skill Level *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="beginner">Beginner</SelectItem>
                            <SelectItem value="intermediate">Intermediate</SelectItem>
                            <SelectItem value="advanced">Advanced</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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

                <FormField
                  control={form.control}
                  name="locationName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Local Basketball Court" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="eventDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
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
                        <FormLabel>Time *</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Any special requirements or notes..."
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={createEventMutation.isPending}
                >
                  {createEventMutation.isPending ? "Creating Event..." : "Test Create Event"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}