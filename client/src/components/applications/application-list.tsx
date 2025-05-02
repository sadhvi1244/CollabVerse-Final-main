import { useState } from "react";
import { Application, Project } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Clock, CheckCircle, XCircle } from "lucide-react";
import { ApplicationReview } from "./application-review";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ApplicationListProps {
  projectId: number;
  creatorView?: boolean;
}

export function ApplicationList({ projectId, creatorView = false }: ApplicationListProps) {
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Fetch applications for this project
  const { data: applications, isLoading } = useQuery<Application[]>({
    queryKey: [`/api/projects/${projectId}/applications`],
  });

  // Status badge styling
  const statusBadgeStyle = {
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    accepted: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  };

  // Status icon
  const statusIcon = {
    pending: <Clock className="h-4 w-4 mr-1" />,
    accepted: <CheckCircle className="h-4 w-4 mr-1" />,
    rejected: <XCircle className="h-4 w-4 mr-1" />,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading applications...</span>
      </div>
    );
  }

  if (!applications || applications.length === 0) {
    return (
      <div className="p-6 text-center border rounded-md bg-muted/20">
        <h3 className="font-medium">No applications found</h3>
        <p className="text-muted-foreground mt-1">
          {creatorView 
            ? "No one has applied to this project yet."
            : "You haven't applied to this project yet."}
        </p>
      </div>
    );
  }

  const pendingApplications = applications.filter(app => app.status === "pending");
  const acceptedApplications = applications.filter(app => app.status === "accepted");
  const rejectedApplications = applications.filter(app => app.status === "rejected");

  return (
    <div>
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="all">
            All ({applications.length})
          </TabsTrigger>
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
        
        {/* All Applications */}
        <TabsContent value="all" className="mt-4">
          <div className="grid gap-4">
            {applications.map(application => (
              <div 
                key={application.id} 
                className="p-4 border rounded-md hover:bg-muted/20 cursor-pointer transition-colors"
                onClick={() => {
                  setSelectedApplication(application);
                  setIsDialogOpen(true);
                }}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">
                      Application from User #{application.userId}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {application.message ? 
                        application.message.substring(0, 100) + (application.message.length > 100 ? "..." : "") : 
                        "No message provided"}
                    </p>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`${statusBadgeStyle[application.status as keyof typeof statusBadgeStyle]} flex items-center`}
                  >
                    {statusIcon[application.status as keyof typeof statusIcon]}
                    {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
        
        {/* Pending Applications */}
        <TabsContent value="pending" className="mt-4">
          <div className="grid gap-4">
            {pendingApplications.length > 0 ? (
              pendingApplications.map(application => (
                <div 
                  key={application.id} 
                  className="p-4 border rounded-md hover:bg-muted/20 cursor-pointer transition-colors"
                  onClick={() => {
                    setSelectedApplication(application);
                    setIsDialogOpen(true);
                  }}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">
                        Application from User #{application.userId}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {application.message ? 
                          application.message.substring(0, 100) + (application.message.length > 100 ? "..." : "") : 
                          "No message provided"}
                      </p>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`${statusBadgeStyle.pending} flex items-center`}
                    >
                      <Clock className="h-4 w-4 mr-1" />
                      Pending
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center border rounded-md bg-muted/20">
                <p className="text-muted-foreground">No pending applications</p>
              </div>
            )}
          </div>
        </TabsContent>
        
        {/* Accepted Applications */}
        <TabsContent value="accepted" className="mt-4">
          <div className="grid gap-4">
            {acceptedApplications.length > 0 ? (
              acceptedApplications.map(application => (
                <div 
                  key={application.id} 
                  className="p-4 border rounded-md hover:bg-muted/20 cursor-pointer transition-colors"
                  onClick={() => {
                    setSelectedApplication(application);
                    setIsDialogOpen(true);
                  }}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">
                        Application from User #{application.userId}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {application.message ? 
                          application.message.substring(0, 100) + (application.message.length > 100 ? "..." : "") : 
                          "No message provided"}
                      </p>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`${statusBadgeStyle.accepted} flex items-center`}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Accepted
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center border rounded-md bg-muted/20">
                <p className="text-muted-foreground">No accepted applications</p>
              </div>
            )}
          </div>
        </TabsContent>
        
        {/* Rejected Applications */}
        <TabsContent value="rejected" className="mt-4">
          <div className="grid gap-4">
            {rejectedApplications.length > 0 ? (
              rejectedApplications.map(application => (
                <div 
                  key={application.id} 
                  className="p-4 border rounded-md hover:bg-muted/20 cursor-pointer transition-colors"
                  onClick={() => {
                    setSelectedApplication(application);
                    setIsDialogOpen(true);
                  }}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">
                        Application from User #{application.userId}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {application.message ? 
                          application.message.substring(0, 100) + (application.message.length > 100 ? "..." : "") : 
                          "No message provided"}
                      </p>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`${statusBadgeStyle.rejected} flex items-center`}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Rejected
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center border rounded-md bg-muted/20">
                <p className="text-muted-foreground">No rejected applications</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Application Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-xl">
          {selectedApplication && (
            <ApplicationReview 
              application={selectedApplication} 
              onActionComplete={() => setIsDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}