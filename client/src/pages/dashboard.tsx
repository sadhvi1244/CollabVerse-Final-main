import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Navbar } from "@/components/layout/navbar";

import CreatorDashboard from "./creator-dashboard";
import JoinerDashboard from "./joiner-dashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Bell, ChevronRight, Home, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { UserProfileSummary } from "@/components/dashboard/user-profile-summary";
import { NotificationsPanel } from "@/components/notifications/notifications-panel";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";

export default function Dashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  // Fetch user profile data including projects and applications
  const { data: profileData, isLoading } = useQuery({
    queryKey: ["/api/profile"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!user, // Only fetch when user is available
  });

  // Handle role-specific redirects - if user only has one role, redirect to that dashboard
  useEffect(() => {
    if (user && user.role === "creator") {
      navigate("/creator");
    } else if (user && user.role === "joiner") {
      navigate("/joiner");
    }
  }, [user, navigate]);

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading your dashboard...</span>
        </main>
        <Footer />
      </div>
    );
  }

  // Calculate unread notifications count
  const unreadNotifications =
    profileData?.notifications?.filter((n) => !n.isRead) || [];
  const unreadCount = unreadNotifications.length;

  // If user has both roles, show tabbed interface
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow bg-gray-50 dark:bg-gray-900 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs */}
          <div className="flex items-center text-sm text-muted-foreground mb-4">
            <Home className="h-4 w-4 mr-1" />
            <span>Home</span>
            <ChevronRight className="h-4 w-4 mx-1" />
            <span className="font-medium text-foreground">Dashboard</span>
          </div>

          <div className="mb-5">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Welcome back{user?.name ? `, ${user.name}` : ""}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Manage your projects and contributions from your personalized
              dashboard.
            </p>
          </div>

          {/* Main Dashboard Tabs */}
          <Tabs
            defaultValue="creator"
            className="w-full mb-6 border border-zinc-800 "
          >
            <TabsList className="mb-6 text-4xl font-bold">
              <TabsTrigger value="creator">Creator Dashboard</TabsTrigger>
              <TabsTrigger value="joiner">Joiner Dashboard</TabsTrigger>
            </TabsList>

            <TabsContent value="creator">
              <CreatorDashboard inTabView={true} />
            </TabsContent>

            <TabsContent value="joiner">
              <JoinerDashboard inTabView={true} />
            </TabsContent>
          </Tabs>

          <Separator className="my-6" />

          {/* Section Titles */}
          <h2 className="text-xl font-semibold mb-4">Dashboard Overview</h2>

          {/* Dashboard Stats */}
          {profileData && (
            <div className="mb-6">
              <DashboardStats
                projects={profileData.projects}
                applications={profileData.applications}
                team={profileData.teams?.flatMap((t) => t.members) || []}
                tasks={
                  profileData.projects?.flatMap((p) => p.tasks || []) || []
                }
                userRole={user?.role}
              />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
            {/* Profile Summary */}
            <div className="lg:col-span-1">
              <h3 className="text-lg font-medium mb-3">Profile</h3>
              <UserProfileSummary />
            </div>

            {/* Notifications Panel */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-medium">Notifications</h3>
                {unreadCount > 0 && (
                  <div className="flex items-center bg-primary/10 text-primary px-2 py-0.5 rounded-full text-sm">
                    <Bell className="h-3.5 w-3.5 mr-1" />
                    {unreadCount} New
                  </div>
                )}
              </div>
              <NotificationsPanel simplified={true} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
