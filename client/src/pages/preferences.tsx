import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertUserPreferencesSchema, type InsertUserPreferences } from "@shared/schema";

export default function Preferences() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertUserPreferences>({
    resolver: zodResolver(insertUserPreferencesSchema),
    defaultValues: {
      genderIdentity: user?.genderIdentity || "",
      sportsInterests: user?.sportsInterests || [],
      skillLevel: user?.skillLevel || "",
      searchRadius: user?.searchRadius || 25,
    },
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: async (data: InsertUserPreferences) => {
      const response = await apiRequest("PUT", "/api/user/preferences", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Preferences Updated",
        description: "Your preferences have been saved successfully.",
      });
      setLocation("/");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update preferences. Please try again.",
        variant: "destructive",
      });
    },
  });

  const sportsOptions = [
    { id: "basketball", label: "Basketball" },
    { id: "soccer", label: "Soccer" },
    { id: "tennis", label: "Tennis" },
    { id: "volleyball", label: "Volleyball" },
    { id: "baseball", label: "Baseball" },
    { id: "football", label: "Football" },
    { id: "hockey", label: "Hockey" },
    { id: "golf", label: "Golf" },
  ];

  const onSubmit = (data: InsertUserPreferences) => {
    updatePreferencesMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center space-x-3">
            <button onClick={() => setLocation("/")} className="text-gray-600">
              <i className="fas fa-arrow-left text-lg"></i>
            </button>
            <h1 className="text-xl font-bold text-gray-900">Preferences</h1>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto p-4 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">Set Your Preferences</h2>
          <p className="text-gray-600">Help us find the perfect games for you</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Gender Identity */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Gender Identity</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="genderIdentity"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender identity" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="non-binary">Non-binary</SelectItem>
                            <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Sports Interests */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Sports of Interest</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="sportsInterests"
                  render={({ field }) => (
                    <FormItem>
                      <div className="grid grid-cols-2 gap-3">
                        {sportsOptions.map((sport) => (
                          <FormItem
                            key={sport.id}
                            className="flex flex-row items-start space-x-3 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(sport.id)}
                                onCheckedChange={(checked) => {
                                  const currentSports = field.value || [];
                                  if (checked) {
                                    field.onChange([...currentSports, sport.id]);
                                  } else {
                                    field.onChange(currentSports.filter((s) => s !== sport.id));
                                  }
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {sport.label}
                            </FormLabel>
                          </FormItem>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Skill Level */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Skill Level</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="skillLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your skill level" />
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
              </CardContent>
            </Card>

            {/* Search Radius */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Search Radius</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="searchRadius"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {field.value} miles
                      </FormLabel>
                      <FormControl>
                        <Slider
                          min={5}
                          max={100}
                          step={5}
                          value={[field.value || 25]}
                          onValueChange={(values) => field.onChange(values[0])}
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Button 
              type="submit" 
              className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl"
              disabled={updatePreferencesMutation.isPending}
            >
              {updatePreferencesMutation.isPending ? "Saving..." : "Save Preferences"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
