import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { MapPin, Camera, ArrowLeft, CheckCircle } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertLocationSchema, type InsertLocation } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export default function SubmitLocation() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<InsertLocation>({
    resolver: zodResolver(insertLocationSchema),
    defaultValues: {
      name: "",
      address: "",
      latitude: "",
      longitude: "",
      locationType: "",
      photoUrl: "",
      description: "",
      submittedBy: user?.id || "",
      isPublicSpace: false,
      requiresPermit: false,
      maxCapacity: undefined,
      amenities: [],
      operatingHours: "",
      contactInfo: "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: InsertLocation & { photo?: File }) => {
      const { photo, ...locationData } = data;
      
      let photoUrl = "";
      if (photo) {
        // Simulate photo upload - in production, upload to secure storage
        photoUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(photo);
        });
      }

      return apiRequest({
        method: "POST",
        url: "/api/locations",
        body: {
          ...locationData,
          photoUrl,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
      toast({
        title: "Location submitted successfully!",
        description: "Your location is under review and will be available once approved.",
      });
      setLocation("/profile");
    },
    onError: (error) => {
      console.error("Submission error:", error);
      toast({
        title: "Submission failed",
        description: "Please try again or contact support if the issue persists.",
        variant: "destructive",
      });
    },
  });

  const handleGetCurrentLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCoordinates({ lat: latitude, lng: longitude });
          form.setValue("latitude", latitude.toString());
          form.setValue("longitude", longitude.toString());
          toast({
            title: "Location detected",
            description: "Your current location has been set on the map.",
          });
        },
        (error) => {
          console.error("Geolocation error:", error);
          toast({
            title: "Location access denied",
            description: "Please enter your location manually or enable location services.",
            variant: "destructive",
          });
        }
      );
    } else {
      toast({
        title: "Geolocation not supported",
        description: "Please enter your location manually.",
        variant: "destructive",
      });
    }
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file (JPG, PNG, etc.)",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }

      setPhotoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = (data: InsertLocation) => {
    if (!coordinates) {
      toast({
        title: "Location required",
        description: "Please set your location on the map or use current location.",
        variant: "destructive",
      });
      return;
    }

    submitMutation.mutate({ 
      ...data, 
      submittedBy: user?.id || "",
      photo: photoFile || undefined 
    });
  };

  const locationTypes = [
    { value: "public_park", label: "Public Park" },
    { value: "school", label: "School/University" },
    { value: "gym", label: "Gym/Fitness Center" },
    { value: "court", label: "Sports Court" },
    { value: "field", label: "Sports Field" },
    { value: "other", label: "Other" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center space-x-3">
            <button onClick={() => setLocation("/profile")} className="text-gray-600">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-baller text-gray-900">Submit a Location</h1>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto p-4 space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Map Placeholder */}
            <Card>
              <CardContent className="p-0">
                <div className="h-48 bg-gradient-to-br from-green-100 to-green-200 relative flex items-center justify-center">
                  {coordinates ? (
                    <div className="text-center">
                      <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-green-800">Location Set</p>
                      <p className="text-xs text-green-600">
                        {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <MapPin className="w-12 h-12 text-red-500 mx-auto mb-3" />
                      <Button
                        type="button"
                        onClick={handleGetCurrentLocation}
                        className="bg-red-500 hover:bg-red-600 text-white"
                      >
                        <MapPin className="w-4 h-4 mr-2" />
                        Use Current Location
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Location Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium text-gray-900">Location Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Location Name"
                      className="h-12 text-base"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Address */}
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium text-gray-900">Address</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Full address"
                      className="h-12 text-base"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Location Type */}
            <FormField
              control={form.control}
              name="locationType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium text-gray-900">Location Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {locationTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Photo Upload */}
            <div className="space-y-2">
              <Label className="text-base font-medium text-gray-900">Photo (optional)</Label>
              <Card className="cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => fileInputRef.current?.click()}>
                <CardContent className="p-6">
                  {photoPreview ? (
                    <div className="space-y-3">
                      <img 
                        src={photoPreview} 
                        alt="Location preview" 
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <p className="text-sm text-gray-600 text-center">Click to change photo</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-base font-medium text-gray-600">Upload Photo</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>

            {/* Public Space Confirmation */}
            <FormField
              control={form.control}
              name="isPublicSpace"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm font-medium text-gray-900">
                      I confirm this is a public space available for free use
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={submitMutation.isPending}
              className="w-full h-12 bg-red-500 hover:bg-red-600 text-white text-base font-medium"
            >
              {submitMutation.isPending ? "Submitting..." : "Submit"}
            </Button>
          </form>
        </Form>

        {/* Info Note */}
        <div className="text-center text-sm text-gray-500 space-y-1">
          <p>Your submission will be reviewed by our team.</p>
          <p>Approved locations will be available for event creation.</p>
        </div>
      </div>
    </div>
  );
}