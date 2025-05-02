import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Application, User } from "@shared/schema";
import { ApplicationCard } from "./application-card";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ApplicationsListProps {
  projectId: number;
}

export function ApplicationsList({ projectId }: ApplicationsListProps) {
  // Fetch applications for this project
  const { data: applications, isLoading, error } = useQuery<(Application & { user?: User })[]>({
    queryKey: ["/api/projects", projectId, "applications"],
    enabled: !!projectId,
  });

  // Group applications by status
  const pendingApplications = applications?.filter(app => app.status === "pending") || [];
  const acceptedApplications = applications?.filter(app => app.status === "accepted") || [];
  const rejectedApplications = applications?.filter(app => app.status === "rejected") || [];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading applications...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load applications. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  if (applications?.length === 0) {
    return (
      <div className="text-center p-8 bg-muted/50 rounded-lg border">
        <h3 className="text-lg font-medium mb-2">No Applications Yet</h3>
        <p className="text-muted-foreground">
          When people apply to join your project, their applications will appear here.
        </p>
      </div>
    );
  }

  return (
    <Tabs defaultValue="pending" className="w-full">
      <TabsList className="mb-6">
        <TabsTrigger value="pending">
          Pending ({pendingApplications.length})
        </TabsTrigger>
        <TabsTrigger value="accepted">
          Accepted ({acceptedApplications.length})
        </TabsTrigger>
        <TabsTrigger value="rejected">
          Rejected ({rejectedApplications.length})
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="pending" className="space-y-4">
        {pendingApplications.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No pending applications</p>
        ) : (
          pendingApplications.map(application => (
            <ApplicationCard 
              key={application.id} 
              application={application} 
              isProjectCreator={true}
            />
          ))
        )}
      </TabsContent>
      
      <TabsContent value="accepted" className="space-y-4">
        {acceptedApplications.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No accepted applications</p>
        ) : (
          acceptedApplications.map(application => (
            <ApplicationCard 
              key={application.id} 
              application={application} 
              isProjectCreator={true}
            />
          ))
        )}
      </TabsContent>
      
      <TabsContent value="rejected" className="space-y-4">
        {rejectedApplications.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No rejected applications</p>
        ) : (
          rejectedApplications.map(application => (
            <ApplicationCard 
              key={application.id} 
              application={application} 
              isProjectCreator={true}
            />
          ))
        )}
      </TabsContent>
    </Tabs>
  );
}