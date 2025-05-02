import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Notification } from "@shared/schema";
import { useLocation } from "wouter";
import { Check, Bell, Info, AlertCircle, Calendar, MessageSquare, UserPlus } from "lucide-react";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

interface NotificationsPanelProps {
  simplified?: boolean;
}

// Get notification icon based on type
const getNotificationIcon = (type: string) => {
  switch (type) {
    case "application":
      return <UserPlus className="h-5 w-5 text-blue-500" />;
    case "message":
      return <MessageSquare className="h-5 w-5 text-violet-500" />;
    case "event":
      return <Calendar className="h-5 w-5 text-emerald-500" />;
    case "system":
      return <Info className="h-5 w-5 text-gray-500" />;
    default:
      return <Bell className="h-5 w-5 text-gray-500" />;
  }
};

// Generate notification background color based on type and read status
const getNotificationBg = (type: string, isRead: boolean | null) => {
  const baseClass = isRead ? "bg-transparent" : "bg-blue-50 dark:bg-blue-950/20";
  
  return baseClass;
};

export function NotificationsPanel(props: NotificationsPanelProps = {}) {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Get all notifications for the current user
  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
  });

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      await apiRequest("PATCH", `/api/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to mark notification as read",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mark all notifications as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/notifications/mark-all-read");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to mark all notifications as read",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read if not already
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }

    // Navigate based on notification type and relatedId
    if (notification.type === "application" && notification.relatedId) {
      navigate(`/projects/${notification.relatedId}`);
    } else if (notification.type === "message" && notification.relatedId) {
      navigate(`/projects/${notification.relatedId}/messages`);
    } else if (notification.type === "event" && notification.relatedId) {
      navigate(`/projects/${notification.relatedId}/calendar`);
    }
  };

  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;
  
  // Format date for display
  const formatDate = (date: Date | string | null) => {
    if (!date) return "";
    return format(new Date(date), "MMM dd, h:mm a");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading notifications...</span>
      </div>
    );
  }

  if (!notifications || notifications.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center text-center p-6">
          <Bell className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-lg font-medium">No notifications yet</h3>
          <p className="text-muted-foreground mt-2">
            You'll receive notifications for application updates, messages, and events.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Simplified version just shows recent notifications without tabs
  if (props.simplified) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="divide-y max-h-[400px] overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.slice(0, 5).map((notification) => (
                <div 
                  key={notification.id}
                  className={`p-4 cursor-pointer transition-colors hover:bg-muted/50 ${getNotificationBg(notification.type, notification.isRead)}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start">
                    <div className="mr-3 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm ${!notification.isRead ? 'font-medium' : ''}`}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(notification.createdAt)}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <div className="h-2 w-2 rounded-full bg-blue-500 mt-2"></div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center">
                <p className="text-muted-foreground">No notifications</p>
              </div>
            )}
          </div>
          {notifications.length > 5 && (
            <div className="p-3 border-t text-center">
              <Button variant="link" size="sm" onClick={() => navigate('/notifications')}>
                View all notifications
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Full detailed version with tabs
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <CardTitle>Notifications</CardTitle>
            {unreadCount > 0 && (
              <Badge className="ml-2 bg-primary">{unreadCount}</Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
            >
              {markAllAsReadMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Check className="h-4 w-4 mr-1" />
              )}
              Mark all as read
            </Button>
          )}
        </div>
        <CardDescription>
          Stay updated with project activities and messages
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full rounded-none px-6">
            <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
            <TabsTrigger value="unread" className="flex-1">
              Unread {unreadCount > 0 && `(${unreadCount})`}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="m-0">
            <div className="divide-y max-h-[400px] overflow-y-auto">
              {notifications.map((notification) => (
                <div 
                  key={notification.id}
                  className={`p-4 cursor-pointer transition-colors hover:bg-muted/50 ${getNotificationBg(notification.type, notification.isRead)}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start">
                    <div className="mr-3 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm ${!notification.isRead ? 'font-medium' : ''}`}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(notification.createdAt)}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <div className="h-2 w-2 rounded-full bg-blue-500 mt-2"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="unread" className="m-0">
            <div className="divide-y max-h-[400px] overflow-y-auto">
              {notifications.filter(n => !n.isRead).length > 0 ? (
                notifications
                  .filter(n => !n.isRead)
                  .map((notification) => (
                    <div 
                      key={notification.id}
                      className={`p-4 cursor-pointer transition-colors hover:bg-muted/50 ${getNotificationBg(notification.type, notification.isRead)}`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start">
                        <div className="mr-3 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(notification.createdAt)}
                          </p>
                        </div>
                        <div className="h-2 w-2 rounded-full bg-blue-500 mt-2"></div>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="p-6 text-center">
                  <p className="text-muted-foreground">No unread notifications</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}