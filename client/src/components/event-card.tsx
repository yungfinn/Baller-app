import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import SkillBadge from "./skill-badge";
import { format, formatDistanceToNow, isPast, isFuture } from "date-fns";
import type { Event } from "@shared/schema";

interface EventCardProps {
  event: Event;
  onJoin?: () => void;
  onSkip?: () => void;
  showActions?: boolean;
  className?: string;
  isUserJoined?: boolean;
  currentUserId?: string;
}

export default function EventCard({ 
  event, 
  onJoin, 
  onSkip, 
  showActions = false, 
  className = "",
  isUserJoined = false,
  currentUserId
}: EventCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const joinEventMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/events/${event.id}/rsvp`, {
        status: "going"
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/rsvps"] });
      toast({
        title: "Joined Event!",
        description: "You've successfully joined this event.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Join",
        description: error.message || "Unable to join event. Please try again.",
        variant: "destructive",
      });
    },
  });

  const leaveEventMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/events/${event.id}/rsvp`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/rsvps"] });
      toast({
        title: "Left Event",
        description: "You've left this event.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Leave",
        description: error.message || "Unable to leave event. Please try again.",
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
      basketball: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&h=400&fit=crop",
      soccer: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&h=400&fit=crop",
      tennis: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&h=400&fit=crop",
      volleyball: "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800&h=400&fit=crop",
      baseball: "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=800&h=400&fit=crop",
      football: "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=800&h=400&fit=crop",
    };
    return images[event.sportType] || images.basketball;
  };

  const getEventStatus = () => {
    const eventDate = new Date(event.eventDate);
    const now = new Date();
    
    if (isPast(eventDate)) {
      return { status: 'past', text: 'Event Ended', color: 'text-gray-500 bg-gray-100' };
    } else if (isFuture(eventDate)) {
      const timeUntil = formatDistanceToNow(eventDate, { addSuffix: true });
      return { status: 'upcoming', text: `Starts ${timeUntil}`, color: 'text-blue-600 bg-blue-50' };
    }
    return { status: 'live', text: 'Live Now', color: 'text-green-600 bg-green-50' };
  };

  return (
    <Card className={`overflow-hidden border border-gray-100 ${className}`}>
      <div className="relative h-48">
        <img 
          src={getSportImage(event.sportType)} 
          alt={`${event.sportType} event`} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 gradient-overlay"></div>
        <div className="absolute top-4 left-4">
          <SkillBadge level={event.skillLevel} />
        </div>
        <div className="absolute top-4 right-4 text-white">
          <i className={`${getSportIcon(event.sportType)} text-lg`}></i>
        </div>
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${getEventStatus().color}`}>
            {getEventStatus().text}
          </div>
        </div>
        <div className="absolute bottom-4 left-4 text-white">
          <h3 className="text-xl font-bold mb-1">{event.title}</h3>
          <p className="text-sm opacity-90">{event.locationName}</p>
        </div>
      </div>
      
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <i className="fas fa-clock text-gray-400 text-sm"></i>
            <span className="text-sm text-gray-600">
              {format(new Date(event.eventDate), "MMM d, h:mm a")}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <i className="fas fa-users text-gray-400 text-sm"></i>
            <span className="text-sm text-gray-600">
              {event.currentPlayers}/{event.maxPlayers} players
            </span>
          </div>
        </div>
        
        {event.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {event.description}
          </p>
        )}
        
        {event.notes && (
          <p className="text-xs text-gray-500 mb-4 italic">
            {event.notes}
          </p>
        )}
        
        {showActions && (
          <div className="flex space-x-3">
            <Button 
              onClick={onSkip}
              variant="outline"
              className="flex-1"
            >
              <i className="fas fa-times mr-2"></i>Skip
            </Button>
            <Button 
              onClick={onJoin}
              className="flex-1 bg-primary hover:bg-primary/90 text-white"
            >
              <i className="fas fa-heart mr-2"></i>Join
            </Button>
          </div>
        )}

        {!showActions && currentUserId && currentUserId !== event.hostId && (
          <div className="mt-4">
            {isUserJoined ? (
              <div className="space-y-2">
                <div className="flex items-center justify-center py-2 px-4 bg-green-50 border border-green-200 rounded-lg">
                  <i className="fas fa-check-circle text-green-600 mr-2"></i>
                  <span className="text-green-700 font-medium">You're In!</span>
                </div>
                <Button 
                  onClick={() => leaveEventMutation.mutate()}
                  disabled={leaveEventMutation.isPending}
                  variant="outline"
                  className="w-full border-red-200 hover:bg-red-50 text-red-600"
                >
                  {leaveEventMutation.isPending ? "Leaving..." : "Leave Event"}
                </Button>
              </div>
            ) : (
              <Button 
                onClick={() => joinEventMutation.mutate()}
                disabled={joinEventMutation.isPending || (event.currentPlayers || 0) >= event.maxPlayers || getEventStatus().status === 'past'}
                className="w-full bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-400"
              >
                {joinEventMutation.isPending ? "Joining..." : 
                 getEventStatus().status === 'past' ? "Event Ended" :
                 (event.currentPlayers || 0) >= event.maxPlayers ? "Event Full" : "Join Event"}
              </Button>
            )}
          </div>
        )}

        {currentUserId === event.hostId && (
          <div className="mt-4">
            <Button 
              variant="outline"
              className="w-full"
              disabled
            >
              <i className="fas fa-crown mr-2 text-yellow-500"></i>You're hosting this event
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
