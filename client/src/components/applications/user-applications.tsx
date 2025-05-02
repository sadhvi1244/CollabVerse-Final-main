import { useQuery } from "@tanstack/react-query";
import { Application, Project } from "@shared/schema";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Link } from "wouter";

export function UserApplications() {
  // Fetch the user's applications
  const { data: applications, isLoading, error } = useQuery<(Application & { project?: Project })[]>({
    queryKey: ["/api/applications/user"],
  });

  // Sort applications by date (newest first)
  const sortedApplications = applications?.sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateB - dateA;
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading your applications...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load your applications. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  if (!applications || applications.length === 0) {
    return (
      <div className="text-center p-8 bg-muted/50 rounded-lg border">
        <h3 className="text-lg font-medium mb-2">No Applications Yet</h3>
        <p className="text-muted-foreground mb-4">
          You haven't applied to any projects yet. Explore projects to find ones that match your skills and interests.
        </p>
        <Button asChild>
          <Link href="/discover">Browse Projects</Link>
        </Button>
      </div>
    );
  }

  // Helper function for status badge
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
      case "accepted":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      case "rejected":
        return "bg-red-100 text-red-800 hover:bg-red-100";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    }
  };

  // Helper function for formatted date
  const formatDate = (dateString?: Date | string | null) => {
    if (!dateString) return "Unknown date";
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return format(date, "MMM dd, yyyy");
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">Your Applications</h2>
      
      {sortedApplications?.map(application => (
        <Card key={application.id} className="overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
              <div>
                <CardTitle className="text-lg">
                  {application.project?.title || "Project"}
                </CardTitle>
                <CardDescription>
                  Applied on {formatDate(application.createdAt)}
                </CardDescription>
              </div>
              <Badge className={getStatusBadgeClass(application.status)}>
                {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="pb-3">
            {application.message && (
              <div className="mb-3">
                <h4 className="font-medium text-sm mb-1">Your message:</h4>
                <p className="text-sm text-gray-600">{application.message}</p>
              </div>
            )}
            
            {/* Feedback for rejected applications */}
            {application.status === "rejected" && application.feedback && (
              <div className="mb-3 p-3 bg-red-50 dark:bg-red-950/20 rounded-md">
                <h4 className="font-medium text-sm text-red-800 dark:text-red-300 mb-1">Feedback from project creator:</h4>
                <p className="text-sm text-red-700 dark:text-red-400">{application.feedback}</p>
              </div>
            )}
            
            {/* "Joined" banner for accepted applications */}
            {application.status === "accepted" && (
              <div className="mb-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-md">
                <h4 className="font-medium text-sm text-green-800 dark:text-green-300 mb-1">You've joined this project!</h4>
                <p className="text-sm text-green-700 dark:text-green-400">
                  Congratulations! You are now a member of this project team.
                </p>
              </div>
            )}
            
            {application.project?.description && (
              <div>
                <h4 className="font-medium text-sm mb-1">Project description:</h4>
                <p className="text-sm text-gray-600 line-clamp-2">{application.project.description}</p>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex flex-col sm:flex-row gap-2 w-full">
            {application.status === "accepted" ? (
              <>
                <Button asChild className="w-full sm:w-auto">
                  <Link href={`/projects/${application.projectId}`}>Go to Project Dashboard</Link>
                </Button>
                <Button variant="outline" asChild className="w-full sm:w-auto">
                  <Link href={`/projects/${application.projectId}/tasks`}>View Tasks</Link>
                </Button>
              </>
            ) : (
              <Button variant="outline" asChild className="w-full">
                <Link href={`/projects/${application.projectId}`}>View Project</Link>
              </Button>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}