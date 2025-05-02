import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "./use-auth";

interface WebSocketHookOptions {
  onNotification?: (notification: any) => void;
  onMessageReceived?: (message: any) => void;
  projectId?: number;
  autoJoinProject?: boolean;
}

export interface WebSocketMessage {
  type: string;
  projectId?: number;
  data: any;
}

interface WebSocketHookResult {
  socket: WebSocket | null;
  connected: boolean;
  error: string | null;
  sendMessage: (message: WebSocketMessage) => boolean;
  joinProject: (projectId: number) => boolean;
  notificationsCount: number;
}

export function useWebSocket(options: WebSocketHookOptions = {}): WebSocketHookResult {
  const { user } = useAuth();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const reconnectCountRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { onNotification, onMessageReceived, projectId, autoJoinProject } = options;
  
  // Send a message through the WebSocket
  const sendMessage = useCallback((message: WebSocketMessage): boolean => {
    if (socket && connected) {
      try {
        socket.send(JSON.stringify(message));
        return true;
      } catch (err) {
        console.error("Error sending WebSocket message:", err);
        return false;
      }
    }
    return false;
  }, [socket, connected]);
  
  // Helper to join a project room
  const joinProject = useCallback((projectId: number): boolean => {
    if (!user?.id) return false;
    
    return sendMessage({
      type: 'join-project',
      projectId,
      data: { userId: user.id }
    });
  }, [sendMessage, user]);
  
  // Process incoming websocket messages
  const handleWebSocketMessage = useCallback((event: MessageEvent) => {
    try {
      const message = JSON.parse(event.data);
      console.log("WebSocket message received:", message);
      
      if (message.type === 'notification-count') {
        setNotificationsCount(message.data.count);
      } 
      else if (message.type === 'new-notification') {
        if (onNotification) {
          onNotification(message.data);
        }
        // Increment notification count
        setNotificationsCount(prev => prev + 1);
      }
      else if (message.type === 'chat-message' && onMessageReceived) {
        onMessageReceived(message.data);
      }
    } catch (err) {
      console.error("Error processing WebSocket message:", err);
    }
  }, [onNotification, onMessageReceived]);
  
  useEffect(() => {
    // Only attempt to connect if user is authenticated
    if (!user?.id) return;
    
    // Flag to track if this effect is still mounted
    let isActive = true;
    let socketInstance: WebSocket | null = null;
    
    const connectWebSocket = () => {
      try {
        // Use the environment variable or fallback to localhost
        const wsUrl = process.env.REACT_APP_WS_URL || "ws://localhost:3001/ws";
        
        console.log(`Connecting to WebSocket at ${wsUrl}`);
        
        // Clean up any existing connection first
        if (socketInstance) {
          try {
            socketInstance.close();
          } catch (err) {
            // Ignore errors during cleanup
          }
        }
        
        const ws = new WebSocket(wsUrl);
        socketInstance = ws;
        
        ws.onopen = () => {
          // Make sure we're still mounted
          if (!isActive) return;
          
          console.log("WebSocket connection established");
          setSocket(ws);
          setConnected(true);
          setError(null);
          reconnectCountRef.current = 0; // Reset reconnect counter on successful connection
          
          try {
            // Register for user-specific notifications
            ws.send(JSON.stringify({
              type: 'user-connect',
              data: { userId: user.id }
            }));
            
            // Automatically join project room if requested
            if (autoJoinProject && projectId) {
              ws.send(JSON.stringify({
                type: 'join-project',
                projectId,
                data: { userId: user.id }
              }));
            }
          } catch (err) {
            console.error("Error sending initial messages:", err);
          }
        };
        
        ws.onmessage = handleWebSocketMessage;
        
        ws.onclose = (event) => {
          console.log(`WebSocket closed: Code ${event.code}, Reason: ${event.reason}`);
          // Make sure we're still mounted
          if (!isActive) return;
          
          console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
          setConnected(false);
          setSocket(null);
          
          // Only try to reconnect for certain close codes
          // 1000 (normal closure) and 1001 (going away) don't need reconnects
          if (event.code !== 1000 && event.code !== 1001 && reconnectCountRef.current < 5) {
            // Try to reconnect with exponential backoff
            const reconnectDelay = Math.min(1000 * Math.pow(2, reconnectCountRef.current), 30000);
            reconnectCountRef.current++;
            
            // Clear any existing timeout
            if (reconnectTimeoutRef.current) {
              clearTimeout(reconnectTimeoutRef.current);
            }
            
            reconnectTimeoutRef.current = setTimeout(() => {
              if (isActive) {
                console.log(`Attempting to reconnect (attempt ${reconnectCountRef.current})...`);
                connectWebSocket();
              }
            }, reconnectDelay);
          } else if (reconnectCountRef.current >= 5) {
            console.error("Maximum reconnection attempts reached.");
            setError("Unable to connect to the WebSocket server. Please refresh the page.");
            return;
          }
        };
        
        ws.onerror = (event) => {
          console.error("WebSocket error:", event);
          setError("Failed to connect to the WebSocket server.");
        };
        
        return ws;
      } catch (err) {
        console.error("Error creating WebSocket:", err);
        setError(`WebSocket initialization error: ${err instanceof Error ? err.message : String(err)}`);
        return null;
      }
    };
    
    const ws = connectWebSocket();
    
    // Cleanup function
    return () => {
      // Mark as inactive to prevent operations after unmount
      isActive = false;
      
      // Clear any pending reconnection attempt
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      // Close the socket connection
      if (ws) {
        try {
          // Use 1000 (normal closure) code to prevent reconnection attempts
          ws.close(1000, "Component unmounted");
        } catch (err) {
          console.error("Error closing WebSocket:", err);
        }
      }
      
      // Reset state variables
      setSocket(null);
      setConnected(false);
    };
  }, [user, projectId, autoJoinProject, handleWebSocketMessage]); // Depend on user and projectId
  
  return { 
    socket, 
    connected, 
    error, 
    sendMessage, 
    joinProject,
    notificationsCount
  };
}
