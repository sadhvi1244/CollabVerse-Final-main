import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Project } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  AlertCircle,
  CalendarClock,
  Clock,
  Edit,
  ExternalLink,
  Inbox,
  Users,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApplicationCard } from "@/components/applications/application-card";

interface ProjectDetailsProps {
  project: Project;
  teamMembers?: any[];
  isCreator?: boolean;
  isPublicView?: boolean;
}

export function ProjectDetails({
  project,
  teamMembers = [],
  isCreator = false,
  isPublicView = false,
}: ProjectDetailsProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editedProject, setEditedProject] = useState({
    title: project.title,
    description: project.description,
    skillsNeeded: project.skillsNeeded ? project.skillsNeeded.join(", ") : "",
    timeline: project.timeline || "",
    coverImage: project.coverImage || "",
    website: project.website || "",
    focus: project.focus || "",
  });

  const { toast } = useToast();

  // Fetch project creator info
  const { data: creator } = useQuery({
    queryKey: [`/api/user/${project.creatorId}`],
    enabled: !!project.creatorId,
  });

  // Fetch project applications (only for creator)
  const { data: applications = [] } = useQuery({
    queryKey: [`/api/projects/${project.id}/applications`],
    enabled: !!project.id && isCreator && !isPublicView,
  });

  // Update project mutation
  const updateMutation = useMutation({
    mutationFn: async () => {
      const skillsArray = editedProject.skillsNeeded
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean);

      return await apiRequest("PUT", `/api/projects/${project.id}`, {
        ...editedProject,
        skillsNeeded: skillsArray,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/projects/${project.id}`],
      });
      toast({
        title: "Project updated",
        description: "Your project has been successfully updated.",
      });
      setShowEditDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update project.",
        variant: "destructive",
      });
    },
  });

  const handleUpdate = () => {
    if (!editedProject.title.trim() || !editedProject.description.trim()) {
      toast({
        title: "Missing fields",
        description: "Title and description are required.",
        variant: "destructive",
      });
      return;
    }
    updateMutation.mutate();
  };

  // Mutations for handling application status changes
  const acceptApplicationMutation = useMutation({
    mutationFn: async (applicationId: number) => {
      return await apiRequest(
        "POST",
        `/api/applications/${applicationId}/accept`,
        {}
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/projects/${project.id}/applications`],
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/projects/${project.id}/team`],
      });
      toast({
        title: "Application accepted",
        description: "The applicant has been added to the team.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error accepting application",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const rejectApplicationMutation = useMutation({
    mutationFn: async ({
      applicationId,
      feedback,
    }: {
      applicationId: number;
      feedback?: string;
    }) => {
      return await apiRequest(
        "POST",
        `/api/applications/${applicationId}/reject`,
        { feedback }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/projects/${project.id}/applications`],
      });
      toast({
        title: "Application rejected",
        description: "The applicant has been notified.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error rejecting application",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle accept application
  const handleAcceptApplication = (applicationId: number) => {
    acceptApplicationMutation.mutate(applicationId);
  };

  // Handle reject application
  const handleRejectApplication = (
    applicationId: number,
    feedback?: string
  ) => {
    rejectApplicationMutation.mutate({ applicationId, feedback });
  };

  return (
    <>
      {isCreator &&
        !isPublicView &&
        applications &&
        applications.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Inbox className="mr-2 h-5 w-5" />
                Applications
                <Badge className="ml-2" variant="secondary">
                  {
                    applications.filter((app) => app.status === "pending")
                      .length
                  }
                </Badge>
              </CardTitle>
              <CardDescription>
                Review and manage applications to join your project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="pending" className="w-full">
                <TabsList>
                  <TabsTrigger value="pending">
                    Pending
                    <Badge className="ml-2" variant="outline">
                      {
                        applications.filter((app) => app.status === "pending")
                          .length
                      }
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="accepted">
                    Accepted
                    <Badge className="ml-2" variant="outline">
                      {
                        applications.filter((app) => app.status === "accepted")
                          .length
                      }
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="rejected">
                    Rejected
                    <Badge className="ml-2" variant="outline">
                      {
                        applications.filter((app) => app.status === "rejected")
                          .length
                      }
                    </Badge>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="mt-4">
                  {applications.filter((app) => app.status === "pending")
                    .length > 0 ? (
                    <div className="space-y-4">
                      {applications
                        .filter((app) => app.status === "pending")
                        .map((application) => (
                          <ApplicationCard
                            key={application.id}
                            application={application}
                            onAccept={() =>
                              handleAcceptApplication(application.id)
                            }
                            onReject={(feedback) =>
                              handleRejectApplication(application.id, feedback)
                            }
                            isExpanded
                          />
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">
                        No pending applications
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="accepted" className="mt-4">
                  {applications.filter((app) => app.status === "accepted")
                    .length > 0 ? (
                    <div className="space-y-4">
                      {applications
                        .filter((app) => app.status === "accepted")
                        .map((application) => (
                          <ApplicationCard
                            key={application.id}
                            application={application}
                            isExpanded
                          />
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">
                        No accepted applications
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="rejected" className="mt-4">
                  {applications.filter((app) => app.status === "rejected")
                    .length > 0 ? (
                    <div className="space-y-4">
                      {applications
                        .filter((app) => app.status === "rejected")
                        .map((application) => (
                          <ApplicationCard
                            key={application.id}
                            application={application}
                            isExpanded
                          />
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">
                        No rejected applications
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle>Project Overview</CardTitle>
                <CardDescription>
                  Project details and description
                </CardDescription>
              </div>
              {isCreator && !isPublicView && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEditDialog(true)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {project.coverImage && (
                  <div className="mb-4 overflow-hidden rounded-lg">
                    <img
                      src={project.coverImage}
                      alt={project.title}
                      className="w-full h-auto object-cover"
                    />
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Description
                  </h4>
                  <p className="mt-1 whitespace-pre-line">
                    {project.description}
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Timeline
                  </h4>
                  <div className="mt-1 flex items-center">
                    <CalendarClock className="mr-2 h-5 w-5 text-gray-400" />
                    <span>{project.timeline || "Not specified"}</span>
                  </div>
                </div>

                {project.website && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Website
                    </h4>
                    <div className="mt-1 flex items-center">
                      <ExternalLink className="mr-2 h-5 w-5 text-gray-400" />
                      <a
                        href={project.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {project.website}
                      </a>
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Creator
                  </h4>
                  <div className="mt-1 flex items-center">
                    <Avatar className="h-6 w-6 mr-2">
                      <AvatarFallback>
                        {creator?.name?.substring(0, 2) ||
                          creator?.username?.substring(0, 2) ||
                          "CR"}
                      </AvatarFallback>
                      {creator?.profilePicture && (
                        <AvatarImage src={creator.profilePicture} />
                      )}
                    </Avatar>
                    <span>
                      {creator
                        ? creator.name || creator.username
                        : `User ${project.creatorId}`}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Created
                  </h4>
                  <div className="mt-1 flex items-center">
                    <Clock className="mr-2 h-5 w-5 text-gray-400" />
                    <span>
                      {project.createdAt
                        ? new Date(project.createdAt).toLocaleDateString()
                        : "Unknown date"}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Skills Needed</CardTitle>
              <CardDescription>
                Skills required for this project
              </CardDescription>
            </CardHeader>
            <CardContent>
              {project.skillsNeeded && project.skillsNeeded.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {project.skillsNeeded.map((skill, index) => (
                    <Badge key={index} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">
                  No specific skills listed for this project.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Team</CardTitle>
              <CardDescription>
                {teamMembers.length} member{teamMembers.length !== 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {teamMembers.length > 0 ? (
                <div className="space-y-4">
                  {teamMembers.map((member, index) => (
                    <div key={index} className="flex items-center">
                      <Avatar className="h-10 w-10 mr-3">
                        <AvatarFallback>
                          {member.username
                            ? member.username.substring(0, 2).toUpperCase()
                            : "U"}
                        </AvatarFallback>
                        {member.profilePicture && (
                          <AvatarImage src={member.profilePicture} />
                        )}
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {member.username || `User ${member.userId}`}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                          {member.role || "Member"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <Users className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No team members yet
                  </p>
                  {!isPublicView && (
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                      Team members will appear here as they join
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {isPublicView && (
            <Card>
              <CardHeader>
                <CardTitle>How to Apply</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Interested in joining this project? You can apply by clicking
                  the "Apply to Join" button at the top of the page.
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                  Be sure to highlight your relevant skills and experience in
                  your application message.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Edit Project Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Project Title</Label>
              <Input
                id="title"
                value={editedProject.title}
                onChange={(e) =>
                  setEditedProject({ ...editedProject, title: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                className="min-h-[120px]"
                value={editedProject.description}
                onChange={(e) =>
                  setEditedProject({
                    ...editedProject,
                    description: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="skillsNeeded">
                  Skills Needed (comma separated)
                </Label>
                <Input
                  id="skillsNeeded"
                  value={editedProject.skillsNeeded}
                  onChange={(e) =>
                    setEditedProject({
                      ...editedProject,
                      skillsNeeded: e.target.value,
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="timeline">Timeline</Label>
                <Input
                  id="timeline"
                  value={editedProject.timeline}
                  onChange={(e) =>
                    setEditedProject({
                      ...editedProject,
                      timeline: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="website">Project Website URL</Label>
                <Input
                  id="website"
                  value={editedProject.website}
                  onChange={(e) =>
                    setEditedProject({
                      ...editedProject,
                      website: e.target.value,
                    })
                  }
                  placeholder="https://yourproject.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="focus">Project Focus</Label>
                <Input
                  id="focus"
                  value={editedProject.focus}
                  onChange={(e) =>
                    setEditedProject({
                      ...editedProject,
                      focus: e.target.value,
                    })
                  }
                  placeholder="e.g., Mobile App, Web Platform, etc."
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="coverImage">Cover Image URL</Label>
              <Input
                id="coverImage"
                value={editedProject.coverImage}
                onChange={(e) =>
                  setEditedProject({
                    ...editedProject,
                    coverImage: e.target.value,
                  })
                }
                placeholder="https://example.com/your-image.jpg"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
