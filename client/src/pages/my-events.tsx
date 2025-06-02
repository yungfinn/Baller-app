import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Clock, Edit3, MessageCircle } from "lucide-react";
import BottomNavigation from "@/components/bottom-navigation";
import SkillBadge from "@/components/skill-badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, isValid } from "date-fns";

export default function MyEvents() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: hostedEvents = [], isLoading: isLoadingHosted } = useQuery({
    queryKey: [`/api/events/host/${user?.id}`],
    enabled: !!user?.id,
  });

  const { data: userRsvps = [], isLoading: isLoadingRsvps } = useQuery({
    queryKey: ["/api/user/rsvps"],
  });

  const isLoading = isLoadingHosted || isLoadingRsvps;

  // Safe data handling
  const safeHostedEvents = Array.isArray(hostedEvents) ? hostedEvents : [];
  const safeRsvps = Array.isArray(userRsvps) ? userRsvps : [];

  const formatEventDate = (dateString: string | null) => {
    if (!dateString) return "Date TBD";
    const date = new Date(dateString);
    return isValid(date) ? format(date, "MMM d, h:mm a") : "Date TBD";
  };

  const formatEventDateLong = (dateString: string | null) => {
    if (!dateString) return "Date TBD";
    const date = new Date(dateString);
    return isValid(date) ? format(date, "EEEE, MMMM d, yyyy") : "Date TBD";
  };

  const formatEventTime = (dateString: string | null) => {
    if (!dateString) return "Time TBD";
    const date = new Date(dateString);
    return isValid(date) ? format(date, "h:mm a") : "Time TBD";
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
            <h1 className="text-xl font-bold text-gray-900">My Events</h1>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto p-4 pb-24 space-y-6">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Calendar className="w-6 h-6 text-gray-400" />
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

              {safeHostedEvents.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Calendar className="w-6 h-6 text-gray-400" />
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
                  {safeHostedEvents.map((event: any) => (
                    <Card key={event.id} className="border border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <button 
                              className="text-left hover:text-blue-600 transition-colors"
                              onClick={() => {
                                toast({
                                  title: event.title,
                                  description: `${event.sportType} event at ${event.locationName}`,
                                });
                              }}
                            >
                              <h3 className="font-semibold text-gray-900 hover:text-blue-600">
                                {event.title || "Untitled Event"}
                              </h3>
                            </button>
                            <p className="text-sm text-gray-600">{event.locationName || "Location TBD"}</p>
                          </div>
                          <SkillBadge level={event.skillLevel || "beginner"} />
                        </div>
                        
                        <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatEventDate(event.eventDate)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Users className="w-3 h-3" />
                            <span>{event.currentPlayers || 0}/{event.maxPlayers || 0}</span>
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => {
                              toast({
                                title: "Edit Event",
                                description: "Event editing will be available in the next update.",
                              });
                            }}
                          >
                            <Edit3 className="w-3 h-3 mr-2" />
                            Edit
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => setLocation(`/event/${event.id}/chat`)}
                          >
                            <MessageCircle className="w-3 h-3 mr-2" />
                            Chat
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

              {safeRsvps.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Users className="w-6 h-6 text-gray-400" />
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
                  {safeRsvps.map((rsvp: any) => {
                    const event = rsvp.event || {};
                    return (
                      <Card key={rsvp.id} className="border border-gray-200">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                {event.title || "Event"}
                              </h3>
                              <p className="text-sm text-gray-600">{event.locationName || "Location TBD"}</p>
                            </div>
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              {rsvp.status || "Joined"}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
                            <div className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>{formatEventDate(event.eventDate)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Users className="w-3 h-3" />
                              <span>{event.currentPlayers || 0}/{event.maxPlayers || 0}</span>
                            </div>
                          </div>

                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="w-full"
                            onClick={() => setLocation(`/event/${event.id}/chat`)}
                          >
                            <MessageCircle className="w-3 h-3 mr-2" />
                            Event Chat
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
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