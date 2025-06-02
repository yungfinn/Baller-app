import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import EventCard from "./event-card";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useSwipeGestures } from "@/lib/swipe-utils";
import { useToast } from "@/hooks/use-toast";
import type { Event } from "@shared/schema";

interface SwipeViewProps {
  events: Event[];
  userRsvps?: any[];
  currentUserId?: string;
}

export default function SwipeView({ events, userRsvps = [], currentUserId }: SwipeViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const swipeMutation = useMutation({
    mutationFn: async ({ eventId, direction }: { eventId: number; direction: string }) => {
      const response = await apiRequest("POST", `/api/events/${eventId}/swipe`, { direction });
      return response.json();
    },
    onSuccess: (_, { direction }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      if (direction === "right") {
        toast({
          title: "Event Joined!",
          description: "You've shown interest in this event.",
        });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to record your choice. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSwipe = (direction: "left" | "right") => {
    if (isAnimating || currentIndex >= events.length) return;

    const currentEvent = events[currentIndex];
    setIsAnimating(true);

    // Record the swipe
    swipeMutation.mutate({ eventId: currentEvent.id, direction });

    // Animate and move to next card
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
      setIsAnimating(false);
    }, 300);
  };

  const currentEvent = events[currentIndex];
  const hasMoreEvents = currentIndex < events.length;

  // Set up swipe gestures
  const { onTouchStart, onTouchMove, onTouchEnd, onMouseDown, onMouseMove, onMouseUp, transform, opacity } = useSwipeGestures({
    onSwipeLeft: () => handleSwipe("left"),
    onSwipeRight: () => handleSwipe("right"),
    threshold: 100,
  });

  if (!hasMoreEvents) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="fas fa-check text-gray-400 text-xl"></i>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">You're all caught up!</h3>
        <p className="text-gray-600 mb-6">Check back later for new events in your area.</p>
        <Button className="bg-primary hover:bg-primary/90 text-white">
          Adjust Filters
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Discover Events</h2>
        <p className="text-gray-600">Swipe right to join, left to skip</p>
      </div>
      
      <div className="card-stack relative h-96">
        {/* Show up to 3 cards in stack */}
        {events.slice(currentIndex, currentIndex + 3).map((event, index) => {
          const isTopCard = index === 0;
          const cardStyle = {
            zIndex: 3 - index,
            transform: isTopCard && !isAnimating ? transform : 
              index === 1 ? 'scale(0.95) translateY(10px)' :
              index === 2 ? 'scale(0.9) translateY(20px)' : '',
            opacity: isTopCard && !isAnimating ? opacity : 1,
          };

          return (
            <div
              key={event.id}
              className={`swipe-card absolute inset-0 cursor-grab active:cursor-grabbing ${
                isAnimating && isTopCard ? 'transition-transform duration-300' : ''
              }`}
              style={cardStyle}
              onTouchStart={isTopCard ? onTouchStart : undefined}
              onTouchMove={isTopCard ? onTouchMove : undefined}
              onTouchEnd={isTopCard ? onTouchEnd : undefined}
              onMouseDown={isTopCard ? onMouseDown : undefined}
              onMouseMove={isTopCard ? onMouseMove : undefined}
              onMouseUp={isTopCard ? onMouseUp : undefined}
              onMouseLeave={isTopCard ? onMouseUp : undefined}
            >
              <EventCard
                event={event}
                onJoin={() => handleSwipe("right")}
                onSkip={() => handleSwipe("left")}
                showActions={isTopCard}
                className="h-full"
              />
            </div>
          );
        })}
      </div>

      {/* Manual action buttons */}
      <div className="flex justify-center space-x-6">
        <Button
          size="lg"
          variant="outline"
          className="w-16 h-16 rounded-full border-2 border-gray-300"
          onClick={() => handleSwipe("left")}
          disabled={isAnimating}
        >
          <i className="fas fa-times text-xl text-gray-500"></i>
        </Button>
        <Button
          size="lg"
          className="w-16 h-16 rounded-full bg-primary hover:bg-primary/90 text-white"
          onClick={() => handleSwipe("right")}
          disabled={isAnimating}
        >
          <i className="fas fa-heart text-xl"></i>
        </Button>
      </div>
    </div>
  );
}
