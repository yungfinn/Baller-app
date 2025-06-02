import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import SkillBadge from "./skill-badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { Event } from "@shared/schema";

interface GridViewProps {
  events: Event[];
  userRsvps?: any[];
  currentUserId?: string;
}

export default function GridView({ events, userRsvps = [], currentUserId }: GridViewProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const joinEventMutation = useMutation({
    mutationFn: async (eventId: number) => {
      const response = await apiRequest("POST", `/api/events/${eventId}/rsvp`, { status: "interested" });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: "Event Joined!",
        description: "You've successfully joined this event.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to join event. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getSportIcon = (sport: string) => {
    const icons: Record<string, string> = {
      basketball: "fas fa-basketball-ball",
      soccer: "fas fa-futbol",
      tennis: "fas fa-table-tennis",
      volleyball: "fas fa-volleyball-ball",
      baseball: "fas fa-baseball-ball",
      football: "fas fa-football-ball",
    };
    return icons[sport] || "fas fa-running";
  };

  const getSportImage = (sport: string) => {
    const images: Record<string, string> = {
      basketball: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=200&h=200&fit=crop",
      soccer: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=200&h=200&fit=crop",
      tennis: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=200&h=200&fit=crop",
      volleyball: "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=200&h=200&fit=crop",
      baseball: "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=200&h=200&fit=crop",
      football: "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=200&h=200&fit=crop",
    };
    return images[sport] || images.basketball;
  };

  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="fas fa-calendar text-gray-400 text-xl"></i>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No events found</h3>
        <p className="text-gray-600 mb-6">Try adjusting your filters or check back later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Nearby Events</h2>
        <Button variant="ghost" size="sm" className="text-primary font-medium">
          <i className="fas fa-map-marker-alt mr-2"></i>
          View Map
        </Button>
      </div>
      
      {events.map((event) => (
        <Card key={event.id} className="overflow-hidden border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex">
            <div className="w-24 h-24 flex-shrink-0 relative">
              <img 
                src={getSportImage(event.sportType)} 
                alt={`${event.sportType} event`} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20"></div>
              <div className="absolute top-2 right-2 text-white">
                <i className={`${getSportIcon(event.sportType)} text-sm`}></i>
              </div>
            </div>
            
            <div className="flex-1 p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{event.title}</h3>
                  <p className="text-sm text-gray-600">{event.locationName}</p>
                </div>
                <SkillBadge level={event.skillLevel} size="sm" />
              </div>
              
              <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
                <div className="flex items-center space-x-1">
                  <i className="fas fa-clock"></i>
                  <span>{format(new Date(event.eventDate), "MMM d, h:mm a")}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <i className="fas fa-users"></i>
                  <span>{event.currentPlayers}/{event.maxPlayers}</span>
                </div>
              </div>
              
              <Button 
                size="sm"
                className="w-full bg-primary hover:bg-primary/90 text-white"
                onClick={() => joinEventMutation.mutate(event.id)}
                disabled={joinEventMutation.isPending}
              >
                {joinEventMutation.isPending ? "Joining..." : "Join Event"}
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
