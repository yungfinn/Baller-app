import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Calendar, MapPin, Users, Clock, Trophy, Star, Activity, MessageCircle, Crown, TrendingUp, Edit3, X, Send } from "lucide-react";
import BottomNavigation from "@/components/bottom-navigation";
import SkillBadge from "@/components/skill-badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function MyEvents() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("dashboard");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Event management mutations
  const cancelEventMutation = useMutation({
    mutationFn: async (eventId: number) => {
      const response = await apiRequest("PUT", `/api/events/${eventId}`, { isCanceled: true });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events/host"] });
      toast({
        title: "Event Canceled",
        description: "Your event has been canceled successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to cancel event. Please try again.",
        variant: "destructive",
      });
    },
  });

  const { data: hostedEvents = [], isLoading: isLoadingHosted } = useQuery({
    queryKey: ["/api/events/host/" + user?.id],
    enabled: !!user?.id,
  });

  const { data: rsvps = [], isLoading: isLoadingRsvps } = useQuery({
    queryKey: ["/api/user/rsvps"],
  });

  const isLoading = isLoadingHosted || isLoadingRsvps;

  // Calculate user stats
  const joinedEvents = rsvps.map((rsvp: any) => rsvp.event).filter(Boolean);
  const allEvents = [...hostedEvents, ...joinedEvents];
  const upcomingEvents = allEvents.filter((event: any) => 
    new Date(event.eventDate) > new Date()
  );
  const completedEvents = allEvents.filter((event: any) => 
    new Date(event.eventDate) < new Date()
  );

  const stats = {
    totalHosted: hostedEvents.length,
    totalJoined: joinedEvents.length,
    upcoming: upcomingEvents.length,
    completed: completedEvents.length,
    attendanceRate: completedEvents.length > 0 ? Math.round((completedEvents.length / (completedEvents.length + 2)) * 100) : 0, // Mock calculation
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button onClick={() => setLocation("/")} className="text-gray-600">
                <i className="fas fa-arrow-left text-lg"></i>
              </button>
              <h1 className="text-xl font-bold text-gray-900">My Dashboard</h1>
            </div>
            {user?.isVerified && (
              <Badge variant="outline" className="text-accent border-accent">
                <Crown className="w-3 h-3 mr-1" />
                Verified
              </Badge>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto p-4 pb-24 space-y-6">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <i className="fas fa-calendar text-gray-400 text-xl"></i>
            </div>
            <p className="text-gray-600">Loading events...</p>
          </div>
        ) : (
          <>
            {/* Hosted Events */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Events I'm Hosting</h2>
                <Button 
                  onClick={() => setLocation("/create-event")}
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-white"
                >
                  <i className="fas fa-plus mr-2"></i>
                  New
                </Button>
              </div>

              {hostedEvents.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                      <i className="fas fa-calendar-plus text-gray-400"></i>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">No events yet</h3>
                    <p className="text-gray-600 text-sm mb-4">Create your first event to bring people together</p>
                    <Button 
                      onClick={() => setLocation("/create-event")}
                      className="bg-primary hover:bg-primary/90 text-white"
                    >
                      Create Event
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {hostedEvents.map((event: any) => (
                    <Card key={event.id} className="border border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-gray-900">{event.title}</h3>
                            <p className="text-sm text-gray-600">{event.locationName}</p>
                          </div>
                          <SkillBadge level={event.skillLevel} />
                        </div>
                        
                        <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
                          <div className="flex items-center space-x-1">
                            <i className="fas fa-clock"></i>
                            <span>
                              {format(new Date(event.eventDate), "MMM d, h:mm a")}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <i className="fas fa-users"></i>
                            <span>{event.currentPlayers}/{event.maxPlayers}</span>
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline" className="flex-1">
                            <i className="fas fa-edit mr-2"></i>
                            Edit
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1">
                            <i className="fas fa-users mr-2"></i>
                            View RSVPs
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>

            {/* Events I'm Joining */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Events I'm Joining</h2>

              {rsvps.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                      <i className="fas fa-heart text-gray-400"></i>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">No events joined</h3>
                    <p className="text-gray-600 text-sm mb-4">Discover and join events in your area</p>
                    <Button 
                      onClick={() => setLocation("/")}
                      className="bg-primary hover:bg-primary/90 text-white"
                    >
                      Discover Events
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {rsvps.map((rsvp: any) => (
                    <Card key={rsvp.id} className="border border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-gray-900">{rsvp.event?.title}</h3>
                            <p className="text-sm text-gray-600">{rsvp.event?.locationName}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              rsvp.status === 'joined' 
                                ? 'bg-accent/10 text-accent' 
                                : 'bg-warning/10 text-warning'
                            }`}>
                              {rsvp.status}
                            </span>
                            <SkillBadge level={rsvp.event?.skillLevel} />
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <i className="fas fa-clock"></i>
                            <span>
                              {format(new Date(rsvp.event?.eventDate), "MMM d, h:mm a")}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <i className="fas fa-users"></i>
                            <span>{rsvp.event?.currentPlayers}/{rsvp.event?.maxPlayers}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      <BottomNavigation activePage="my-events" />
    </div>
  );
}
