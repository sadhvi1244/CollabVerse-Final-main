import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Message } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { Send, Loader2 } from "lucide-react";
import { useWebSocket } from "@/hooks/use-websocket";

interface ChatInterfaceProps {
  projectId: number;
}

export function ChatInterface({ projectId }: ChatInterfaceProps) {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Query to fetch existing messages
  const { data: messages, isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: [`/api/projects/${projectId}/messages`],
    enabled: !!projectId,
  });
  
  // WebSocket connection for real-time chat
  const { socket, connected, error: wsError, joinProject } = useWebSocket({
    projectId,
    autoJoinProject: true,
    onMessageReceived: (messageData) => {
      // Update the messages in the cache
      queryClient.setQueryData([`/api/projects/${projectId}/messages`], (oldData: Message[] | undefined) => {
        if (!oldData) return [messageData];
        return [...oldData, messageData];
      });
    }
  });
  
  // We don't need this effect anymore since we're using the onMessageReceived callback
  // in the useWebSocket hook
  
  // Mutation to send a new message
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user) throw new Error("User not authenticated");
      
      return await apiRequest("POST", "/api/messages", {
        projectId,
        senderId: user.id,
        content
      });
    },
    onSuccess: (response) => {
      setMessage("");
      setIsLoading(false);
      
      // If WebSocket not connected, manually update the UI
      if (!connected) {
        queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/messages`] });
      }
    },
    onError: (error: Error) => {
      setIsLoading(false);
      toast({
        title: "Failed to send message",
        description: error.message || "There was an error sending your message.",
        variant: "destructive",
      });
    }
  });
  
  // Send message via WebSocket if connected, or fallback to REST API
  const handleSendMessage = () => {
    if (!message.trim()) return;
    setIsLoading(true);
    
    // Always send via WebSocket if available, but also always send via REST API
    // This ensures message is saved to database AND transmitted in real-time
    // This "dual-send" approach guarantees delivery and persistence
    if (socket && connected) {
      try {
        socket.send(JSON.stringify({
          type: 'chat-message',
          projectId,
          data: {
            senderId: user?.id,
            content: message,
            timestamp: new Date().toISOString()
          }
        }));
      } catch (error) {
        console.error("WebSocket send error:", error);
        // Error will be handled by fallback below
      }
    } 
    
    // Always use REST API to ensure persistence
    // If WebSocket was successful, this acts as a confirmation
    // If WebSocket failed, this ensures the message is still sent
    sendMessageMutation.mutate(message);
  };
  
  // Auto-scroll to the bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  return (
    <Card className="flex flex-col h-[calc(100vh-300px)] md:h-[600px]">
      <CardHeader className="border-b">
        <CardTitle className="text-lg">Team Chat</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0">
        <div className="flex-1 overflow-y-auto p-4">
          {messagesLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : messages && messages.length > 0 ? (
            <div className="space-y-4">
              {messages.map((msg) => {
                const isSentByUser = msg.senderId === user?.id;
                
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isSentByUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex ${isSentByUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-2 max-w-[80%]`}>
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {msg.senderId.toString().substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div
                          className={`rounded-lg px-3 py-2 text-sm ${
                            isSentByUser
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          {msg.content}
                        </div>
                        <p className={`text-xs text-gray-500 mt-1 ${isSentByUser ? 'text-right' : ''}`}>
                          {msg.timestamp && formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="mb-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-full">
                <Send className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium mb-2">No messages yet</h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                Start the conversation with your team! Send your first message to begin collaborating.
              </p>
            </div>
          )}
        </div>
        
        <div className="border-t p-4">
          <div className="flex space-x-2">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 min-h-[60px] max-h-[120px]"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <Button
              onClick={handleSendMessage}
              disabled={isLoading || !message.trim()}
              className="self-end"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          {/* We're using hybrid approach (REST+WebSocket), so no need for fallback warnings */}
        </div>
      </CardContent>
    </Card>
  );
}
