import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import { Search, User as UserIcon } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ProjectCard } from "@/components/dashboard/project-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { UserProfileSummary } from "@/components/dashboard/user-profile-summary";
import { NotificationsPanel } from "@/components/notifications/notifications-panel";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
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

interface JoinerDashboardProps {
  inTabView?: boolean;
}

export default function JoinerDashboard({
  inTabView = false,
}: JoinerDashboardProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [, navigate] = useLocation();
  const { user } = useAuth();

  const { data: profileData, isLoading } = useQuery({
    queryKey: ["/api/profile"],
  });

  const joinedProjects =
    profileData?.projects?.filter(
      (project) =>
        project.creatorId !== profileData.user.id &&
        (searchQuery === "" ||
          project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          project.description.toLowerCase().includes(searchQuery.toLowerCase()))
    ) || [];

  const userApplications = profileData?.applications || [];

  const renderDashboardContent = () => (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          {!inTabView && (
            <>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white flex items-center">
                Joiner Dashboard
                <Badge
                  className="ml-3 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  variant="outline"
                >
                  <UserIcon className="h-3.5 w-3.5 mr-1.5" />
                  Joiner Role
                </Badge>
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Manage your joined projects and applications
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
          <Button onClick={() => navigate("/discover")}>
            Discover Projects
          </Button>
        </div>
      </div>

      {!inTabView && profileData && (
        <>
          <div className="mb-8">
            <DashboardStats
              projects={profileData.projects || []}
              applications={profileData.applications || []}
              team={profileData.teams?.flatMap((t) => t.members) || []}
              tasks={profileData.projects?.flatMap((p) => p.tasks || []) || []}
              userRole="joiner"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-1">
              <UserProfileSummary compact={true} />
            </div>

            <div className="lg:col-span-2">
              <NotificationsPanel />
            </div>
          </div>
        </>
      )}

      <Tabs defaultValue="joined" className="w-full">
        <TabsList className="mb-8">
          <TabsTrigger value="joined">Joined Projects</TabsTrigger>
          <TabsTrigger value="applications">My Applications</TabsTrigger>
        </TabsList>

        <TabsContent value="joined">
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
          ) : joinedProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {joinedProjects.map((project) => (
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
                  <Search className="h-8 w-8 text-gray-500 dark:text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  No joined projects yet
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
                  Discover and apply to projects that match your skills and
                  interests.
                </p>
                <Button onClick={() => navigate("/discover")}>
                  Discover Projects
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="applications">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-6 w-1/3 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-4" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-5/6 mb-4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : userApplications.length > 0 ? (
            <div className="space-y-4">
              {userApplications.map((application) => {
                const statusColors = {
                  pending:
                    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
                  accepted:
                    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
                  rejected:
                    "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
                };

                const project = profileData?.projects.find(
                  (p) => p.id === application.projectId
                );

                return (
                  <Card key={application.id} className="overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">
                            {project ? (
                              <Button
                                variant="link"
                                className="p-0 h-auto text-lg font-semibold"
                                onClick={() =>
                                  navigate(`/projects/${application.projectId}`)
                                }
                              >
                                {project.title}
                              </Button>
                            ) : (
                              `Project #${application.projectId}`
                            )}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Applied on{" "}
                            {new Date(
                              application.createdAt
                            ).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`mt-2 md:mt-0 ${
                            statusColors[application.status]
                          }`}
                        >
                          {application.status.charAt(0).toUpperCase() +
                            application.status.slice(1)}
                        </Badge>
                      </div>
                      <div className="mt-4 space-y-3">
                        {application.message && (
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            <span className="font-medium">Your message:</span>{" "}
                            {application.message}
                          </p>
                        )}

                        {application.status === "rejected" &&
                          application.feedback && (
                            <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-md">
                              <h4 className="font-medium text-sm text-red-800 dark:text-red-300 mb-1">
                                Feedback from project creator:
                              </h4>
                              <p className="text-sm text-red-700 dark:text-red-400">
                                {application.feedback}
                              </p>
                            </div>
                          )}

                        {application.status === "accepted" && (
                          <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-md">
                            <h4 className="font-medium text-sm text-green-800 dark:text-green-300 mb-1">
                              You've joined this project!
                            </h4>
                            <p className="text-sm text-green-700 dark:text-green-400">
                              Congratulations! You are now a member of this
                              project team.
                            </p>
                          </div>
                        )}

                        {application.status === "accepted" && (
                          <div className="flex flex-wrap gap-2 mt-4">
                            <Button
                              size="sm"
                              onClick={() =>
                                navigate(`/projects/${application.projectId}`)
                              }
                            >
                              Go to Project
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                navigate(
                                  `/projects/${application.projectId}/tasks`
                                )
                              }
                            >
                              View Tasks
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-10 flex flex-col items-center justify-center text-center">
                <h3 className="text-xl font-semibold mb-2">
                  No applications yet
                </h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mb-6">
                  Start applying to projects that match your skills and
                  interest.
                </p>
                <Button onClick={() => navigate("/discover")}>
                  Browse Projects
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
      <Waves className="fixed inset-0 -z-10" />
      <main className="flex-grow bg-gray-50/50 dark:bg-gray-900 pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {renderDashboardContent()}
        </div>
      </main>
    </div>
  );
}
