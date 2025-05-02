import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, Briefcase } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ProjectCard } from "@/components/dashboard/project-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ProjectForm } from "@/components/projects/project-form";
import { ApplicationsList } from "@/components/applications/applications-list";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { UserProfileSummary } from "@/components/dashboard/user-profile-summary";
import { NotificationsPanel } from "@/components/notifications/notifications-panel";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import { useTheme } from "next-themes";
import { Waves } from "@/components/ui/waves-background";

function WavesDemo() {
  const { theme } = useTheme();

  return (
    <div className="relative w-full h-[400px] bg-background/80 rounded-lg overflow-hidden">
      <div className="absolute inset-0">
        <Waves
          lineColor={
            theme === "dark" ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.3)"
          }
          backgroundColor="transparent"
          waveSpeedX={0.02}
          waveSpeedY={0.01}
          waveAmpX={40}
          waveAmpY={20}
          friction={0.9}
          tension={0.01}
          maxCursorMove={120}
          xGap={12}
          yGap={36}
        />
      </div>

      <div className="relative z-10 p-8">
        <h3 className="text-2xl font-bold">Interactive Waves</h3>
        <p className="text-muted-foreground">
          Move your mouse to interact with the waves
        </p>
      </div>
    </div>
  );
}

export { WavesDemo };
interface CreatorDashboardProps {
  inTabView?: boolean;
}

export default function CreatorDashboard({
  inTabView = false,
}: CreatorDashboardProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [, navigate] = useLocation();

  // Fetch user's projects
  const { data: profileData, isLoading } = useQuery({
    queryKey: ["/api/profile"],
  });

  // Filter projects based on search query
  const filteredProjects = profileData?.projects
    ? profileData.projects.filter(
        (project) =>
          project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          project.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // Get applications for projects
  const projectApplications = profileData?.applications
    ? profileData.applications.filter((app) => app.status === "pending")
    : [];

  const { user } = useAuth();

  const renderDashboardContent = () => (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          {!inTabView && (
            <>
              <h1 className="text-4xl font-bold text-gray-900  dark:text-white flex items-center">
                Creator Dashboard
                <Badge
                  className="ml-3 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                  variant="outline"
                >
                  <Briefcase className="h-3.5 w-3.5 mr-1.5" />
                  Creator Role
                </Badge>
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Manage your projects and team applications
              </p>
            </>
          )}
        </div>
        <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
            <Input
              placeholder="Search projects..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <ProjectForm onSuccess={() => setOpenDialog(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {!inTabView && profileData && (
        <>
          {/* Dashboard Stats */}
          <div className="mb-8">
            <DashboardStats
              projects={profileData.projects || []}
              applications={profileData.applications || []}
              team={profileData.teams?.flatMap((t) => t.members) || []}
              tasks={profileData.projects?.flatMap((p) => p.tasks || []) || []}
              userRole="creator"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Profile Summary */}
            <div className="lg:col-span-1">
              <UserProfileSummary compact={true} />
            </div>

            {/* Notifications Panel */}
            <div className="lg:col-span-2">
              <NotificationsPanel />
            </div>
          </div>
        </>
      )}

      <Tabs defaultValue="projects" className="w-full">
        <TabsList className="mb-8">
          <TabsTrigger value="projects">My Projects</TabsTrigger>
          <TabsTrigger value="applications">
            Applications
            {projectApplications.length > 0 && (
              <span className="ml-2 bg-primary text-white text-xs py-0.5 px-2 rounded-full">
                {projectApplications.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="projects">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-6 w-3/4 mb-4" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-5/6 mb-6" />
                    <div className="flex gap-2 mb-4">
                      <Skeleton className="h-6 w-16 rounded-full" />
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                    <Skeleton className="h-8 w-full mt-4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onClick={() => navigate(`/projects/${project.id}`)}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-10 flex flex-col items-center justify-center text-center">
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-full mb-4">
                  <Plus className="h-8 w-8 text-gray-500 dark:text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
                  Start creating your first project to find collaborators and
                  bring your ideas to life.
                </p>
                <Button onClick={() => setOpenDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Project
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="applications">
          {!isLoading && filteredProjects.length > 0 ? (
            <>
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">
                  Project Applications
                </h3>
                <p className="text-muted-foreground">
                  View and manage applications for your projects. Accept or
                  reject applications from potential collaborators.
                </p>
              </div>

              <Tabs
                defaultValue={filteredProjects[0]?.id.toString()}
                className="w-full"
              >
                <TabsList className="mb-6 flex flex-wrap">
                  {filteredProjects.map((project) => (
                    <TabsTrigger key={project.id} value={project.id.toString()}>
                      {project.title}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {filteredProjects.map((project) => (
                  <TabsContent key={project.id} value={project.id.toString()}>
                    <ApplicationsList projectId={project.id} />
                  </TabsContent>
                ))}
              </Tabs>
            </>
          ) : isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-6 w-1/3 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-4" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-5/6 mb-4" />
                    <div className="flex justify-end gap-2">
                      <Skeleton className="h-10 w-24" />
                      <Skeleton className="h-10 w-24" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-10 flex flex-col items-center justify-center text-center">
                <h3 className="text-xl font-semibold mb-2">
                  No projects or applications
                </h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mb-6">
                  You need to create a project first before you can receive
                  applications.
                </p>
                <Button onClick={() => setOpenDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Project
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </>
  );

  if (inTabView) {
    return renderDashboardContent();
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow bg-gray-50 dark:bg-gray-900 pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {renderDashboardContent()}
        </div>
      </main>
    </div>
  );
}
