import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ProjectDetails } from "@/components/projects/project-details";
import { TaskBoard } from "@/components/tasks/task-board";
import { ChatInterface } from "@/components/chat/chat-interface";
import { ProjectCalendar } from "@/components/calendar/project-calendar";
import { ApplicationForm } from "@/components/applications/application-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";

export default function ProjectDetail() {
  const [, params] = useRoute("/projects/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const projectId = params ? parseInt(params.id) : 0;

  // Fetch project details
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: [`/api/projects/${projectId}`],
    enabled: !!projectId,
  });

  // Fetch team members
  const { data: teamMembers, isLoading: teamLoading } = useQuery({
    queryKey: [`/api/projects/${projectId}/team`],
    enabled: !!projectId,
  });

  // Check if user is part of the team
  const isTeamMember = teamMembers?.some(
    (member) => member.userId === user?.id
  );
  const isCreator = project?.creatorId === user?.id;

  // Check if user has already applied
  const { data: myApplications } = useQuery({
    queryKey: ["/api/profile"],
  });

  const hasApplied = myApplications?.applications?.some(
    (app) => app.projectId === projectId
  );

  // Handle application form dialog closing
  const handleDialogClose = () => {
    setShowApplyDialog(false);
  };

  if (projectLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow bg-gray-50 dark:bg-gray-900 pt-20 pb-10 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading project details...</span>
        </main>
        <Footer />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow bg-gray-50 dark:bg-gray-900 pt-20 pb-10 flex flex-col items-center justify-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Project Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            The project you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => navigate("/discover")}>Browse Projects</Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow bg-gray-50 dark:bg-gray-900 pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {project.title}
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                {project.timeline
                  ? `Timeline: ${project.timeline}`
                  : "No timeline specified"}
              </p>
            </div>

            {!isCreator && !isTeamMember && !hasApplied && (
              <Button
                className="mt-4 md:mt-0"
                onClick={() => setShowApplyDialog(true)}
              >
                Apply to Join
              </Button>
            )}

            {!isCreator && !isTeamMember && hasApplied && (
              <div className="mt-4 md:mt-0 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 px-4 py-2 rounded-md text-sm">
                You've already applied to this project
              </div>
            )}
          </div>

          {/* Only show full project details to team members */}
          {isTeamMember || isCreator ? (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="mb-8">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="tasks">Tasks</TabsTrigger>
                <TabsTrigger value="chat">Team Chat</TabsTrigger>
                <TabsTrigger value="calendar">Calendar</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <ProjectDetails
                  project={project}
                  teamMembers={teamMembers}
                  isCreator={isCreator}
                />
              </TabsContent>

              <TabsContent value="tasks">
                <TaskBoard projectId={projectId} />
              </TabsContent>

              <TabsContent value="chat">
                <div className="p-4 bg-white rounded-lg shadow">
                  <ChatInterface projectId={projectId} />
                </div>
              </TabsContent>

              <TabsContent value="calendar">
                <ProjectCalendar projectId={projectId} />
              </TabsContent>
            </Tabs>
          ) : (
            // Non-team members see only the project overview
            <ProjectDetails
              project={project}
              teamMembers={teamMembers}
              isCreator={isCreator}
              isPublicView
            />
          )}
        </div>
      </main>
      <Footer />

      {/* Application Dialog */}
      <Dialog open={showApplyDialog} onOpenChange={setShowApplyDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Apply to Join Project</DialogTitle>
            <DialogDescription>
              Tell the project creator why you'd like to join and what skills
              you can contribute.
            </DialogDescription>
          </DialogHeader>

          <ApplicationForm
            projectId={projectId}
            isOpen={true}
            onClose={handleDialogClose}
            projectSkills={project.skillsNeeded}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
