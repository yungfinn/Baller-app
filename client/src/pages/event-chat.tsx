import { useState, useEffect, useRef } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Send, Users, Calendar, MapPin, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import type { EventMessage, InsertEventMessage, Event } from "@shared/schema";

export default function EventChat() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/event/:eventId/chat");
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const eventId = params?.eventId ? parseInt(params.eventId) : null;

  // Fetch event details
  const { data: event } = useQuery({
    queryKey: ["/api/events", eventId],
    enabled: !!eventId,
  });

  // Fetch event messages
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["/api/events", eventId, "messages"],
    enabled: !!eventId,
    refetchInterval: 3000, // Poll for new messages every 3 seconds
  });

  // Fetch event participants
  const { data: participants = [] } = useQuery({
    queryKey: ["/api/events", eventId, "participants"],
    enabled: !!eventId,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: InsertEventMessage) => {
      return apiRequest(`/api/events/${eventId}/messages`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "messages"] });
      setNewMessage("");
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !user?.id || !eventId) return;

    sendMessageMutation.mutate({
      eventId,
      userId: user.id,
      message: newMessage.trim(),
      messageType: "text",
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!match || !eventId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Event not found</h2>
          <Button onClick={() => setLocation("/")} variant="outline">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100 flex-shrink-0">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button onClick={() => setLocation("/my-events")} className="text-gray-600">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex-1">
                <h1 className="text-lg font-bold text-gray-900 truncate">
                  {event?.title || "Event Chat"}
                </h1>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Users className="w-3 h-3" />
                  <span>{participants.length} participants</span>
                </div>
              </div>
            </div>
            <Badge variant="outline" className="text-accent border-accent">
              Live Chat
            </Badge>
          </div>
        </div>
      </header>

      {/* Event Info Card */}
      {event && (
        <div className="max-w-md mx-auto px-4 py-3 flex-shrink-0">
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>{format(new Date(event.eventDate), "MMM d, yyyy")}</span>
                  <span>•</span>
                  <span>{event.eventTime}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span className="truncate">{event.locationName}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>{participants.length} / {event.maxPlayers} players</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 max-w-md mx-auto w-full px-4 flex flex-col">
        <ScrollArea className="flex-1 py-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="text-gray-600">Loading messages...</div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <h3 className="font-medium text-gray-900 mb-1">Start the conversation!</h3>
              <p className="text-sm text-gray-600">Be the first to send a message to the group.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message: any) => {
                const isOwnMessage = message.userId === user?.id;
                const isSystemMessage = message.messageType === "system";
                
                if (isSystemMessage) {
                  return (
                    <div key={message.id} className="text-center">
                      <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                        {message.message}
                      </span>
                    </div>
                  );
                }

                return (
                  <div key={message.id} className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                    <div className={`flex space-x-2 max-w-[80%] ${isOwnMessage ? "flex-row-reverse space-x-reverse" : ""}`}>
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarImage src={message.user?.profileImageUrl} />
                        <AvatarFallback className="text-xs">
                          {message.user?.firstName?.[0]}{message.user?.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`flex flex-col ${isOwnMessage ? "items-end" : "items-start"}`}>
                        <div className={`rounded-2xl px-3 py-2 ${
                          isOwnMessage 
                            ? "bg-primary text-primary-foreground" 
                            : "bg-white border border-gray-200"
                        }`}>
                          <p className="text-sm">{message.message}</p>
                        </div>
                        <div className="flex items-center space-x-1 mt-1">
                          {!isOwnMessage && (
                            <span className="text-xs text-gray-500">
                              {message.user?.firstName}
                            </span>
                          )}
                          <span className="text-xs text-gray-400">
                            {format(new Date(message.createdAt), "h:mm a")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Message Input */}
        <div className="py-4 border-t border-gray-200 bg-white">
          <div className="flex items-center space-x-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1"
              disabled={sendMessageMutation.isPending}
            />
            <Button
              onClick={handleSendMessage}
              size="sm"
              disabled={!newMessage.trim() || sendMessageMutation.isPending}
              className="px-3"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}