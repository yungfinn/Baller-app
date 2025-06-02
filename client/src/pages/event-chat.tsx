import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLocation, useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Clock, Send, ArrowLeft, Volume2, VolumeX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, isValid } from "date-fns";

interface Message {
  id: number;
  eventId: number;
  userId: string;
  message: string;
  createdAt: Date;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
  };
}

export default function EventChat() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const params = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  
  const ws = useRef<WebSocket | null>(null);
  const chatBoxRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);

  const eventId = parseInt(params.id || '0');

  const { data: event, isLoading: isLoadingEvent } = useQuery({
    queryKey: [`/api/events/${eventId}`],
    enabled: !!eventId,
  });

  const { data: messageHistory = [] } = useQuery({
    queryKey: [`/api/events/${eventId}/messages`],
    enabled: !!eventId,
  });

  // Get user initials for avatar
  const getUserInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || '?';
  };

  // Get avatar color based on user ID
  const getAvatarColor = (userId: string) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 
      'bg-indigo-500', 'bg-red-500', 'bg-orange-500', 'bg-teal-500'
    ];
    const index = parseInt(userId.slice(-1)) % colors.length;
    return colors[index];
  };

  // Auto-scroll to bottom unless user is scrolling up
  const scrollToBottom = () => {
    if (!isUserScrolling && lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Handle scroll detection
  const handleScroll = () => {
    if (chatBoxRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatBoxRef.current;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
      setIsUserScrolling(!isAtBottom);
    }
  };

  // Play notification sound
  const playNotificationSound = () => {
    if (soundEnabled) {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmYeBkOO1fDP');
      audio.play().catch(() => {}); // Ignore errors if audio can't play
    }
  };

  // WebSocket connection
  useEffect(() => {
    if (!eventId || !user?.id) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      
      // Join the event room
      ws.current?.send(JSON.stringify({
        type: 'join-event',
        eventId,
        userId: user.id
      }));
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'joined':
            console.log('Successfully joined event chat');
            break;
            
          case 'new-message':
            setMessages(prev => [...prev, data]);
            if (data.userId !== user.id) {
              playNotificationSound();
            }
            setTimeout(scrollToBottom, 100);
            break;
            
          case 'user-joined':
            setOnlineUsers(prev => new Set([...prev, data.user.id]));
            break;
            
          case 'user-left':
            setOnlineUsers(prev => {
              const newSet = new Set(prev);
              newSet.delete(data.user.id);
              return newSet;
            });
            break;
            
          case 'error':
            toast({
              title: "Chat Error",
              description: data.message,
              variant: "destructive",
            });
            break;
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.current.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    return () => {
      ws.current?.close();
    };
  }, [eventId, user?.id]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !ws.current || !isConnected) return;

    ws.current.send(JSON.stringify({
      type: 'send-message',
      eventId,
      message: newMessage.trim()
    }));

    setNewMessage("");
  };

  const formatEventDate = (dateString: string | null) => {
    if (!dateString) return "Date TBD";
    const date = new Date(dateString);
    return isValid(date) ? format(date, "EEEE, MMMM d, yyyy") : "Date TBD";
  };

  const formatEventTime = (dateString: string | null) => {
    if (!dateString) return "Time TBD";
    const date = new Date(dateString);
    return isValid(date) ? format(date, "h:mm a") : "Time TBD";
  };

  if (isLoadingEvent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Calendar className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-gray-600">Loading event...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Event not found</h2>
          <p className="text-gray-600 mb-4">This event may have been removed or doesn't exist.</p>
          <Button onClick={() => setLocation("/my-events")}>
            Go back to My Events
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
              <div>
                <h1 className="text-lg font-bold text-gray-900">{event.title || "Event Chat"}</h1>
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <span className={`flex items-center space-x-1 ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span>{isConnected ? 'Live' : 'Disconnected'}</span>
                  </span>
                  <span>{onlineUsers.size} online</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 text-gray-500 hover:text-gray-700"
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-md mx-auto w-full flex flex-col">
        {/* Event Info */}
        <div className="p-4 pb-2">
          <Card className="border border-gray-200">
            <CardContent className="p-3">
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>{formatEventDate(event.eventDate)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{formatEventTime(event.eventDate)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate">{event.locationName || "Location TBD"}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="w-3 h-3" />
                  <span>{event.currentPlayers || 0}/{event.maxPlayers || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Chat Box */}
        <div className="flex-1 mx-4 mb-4 flex flex-col">
          <Card className="flex-1 flex flex-col min-h-0">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Live Chat</CardTitle>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  {messages.length} messages
                </Badge>
              </div>
              <p className="text-sm text-gray-600">Chat with all event participants</p>
            </CardHeader>
            
            {/* Messages Container */}
            <CardContent className="flex-1 flex flex-col min-h-0 p-0">
              <div 
                ref={chatBoxRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-3"
                style={{ maxHeight: '400px' }}
              >
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Send className="w-6 h-6 text-gray-400" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">No messages yet</h3>
                    <p className="text-gray-600 text-sm">Be the first to start the conversation!</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div key={message.id} className="flex items-start gap-3">
                      <div className={`rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${getAvatarColor(message.userId)}`}>
                        {getUserInitials(message.user.firstName, message.user.lastName)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="text-sm font-semibold text-gray-900">
                            {message.userId === user?.id ? 'You' : message.user.firstName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(message.createdAt), "h:mm a")}
                          </p>
                        </div>
                        <p className="text-base text-gray-800 break-words">{message.message}</p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={lastMessageRef} />
              </div>
              
              {/* Message Input - Fixed at bottom */}
              <form onSubmit={handleSendMessage} className="p-4 border-t bg-white flex space-x-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={isConnected ? "Type a message..." : "Connecting..."}
                  disabled={!isConnected}
                  className="flex-1"
                  maxLength={500}
                />
                <Button
                  type="submit"
                  disabled={!newMessage.trim() || !isConnected}
                  size="sm"
                  className="px-4"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}