import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Application, User } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getQueryFn } from "@/lib/queryClient";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, CheckCircle, XCircle, ExternalLink, Calendar, MessageSquare } from "lucide-react";

interface ApplicationCardProps {
  application: Application;
  isExpanded?: boolean;
  onAccept?: () => void;
  onReject?: (feedback?: string) => void;
}

export function ApplicationCard({ application, isExpanded = false, onAccept, onReject }: ApplicationCardProps) {
  const { toast } = useToast();
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [feedbackText, setFeedbackText] = useState("Thank you for your interest in our project. We've decided to go with other candidates whose skills better align with our current needs.");
  
  // Fetch the applicant's user data
  const { data: applicantData, isLoading: isLoadingApplicant } = useQuery({
    queryKey: [`/api/user/${application.userId}`],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });
  
  const applicant = applicantData as User;
  
  // Accept application mutation
  const acceptMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("PATCH", `/api/applications/${application.id}/accept`, {});
    },
    onSuccess: () => {
      toast({
        title: "Application Accepted",
        description: `${applicant?.name || "User"} has been added to the project team.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${application.projectId}/team`] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to accept application. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Reject application mutation
  const rejectMutation = useMutation({
    mutationFn: async (feedback: string) => {
      return apiRequest("PATCH", `/api/applications/${application.id}/reject`, { feedback });
    },
    onSuccess: () => {
      toast({
        title: "Application Rejected",
        description: `${applicant?.name || "User"}'s application has been rejected.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reject application. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Show a loading state if applicant data is still loading
  if (isLoadingApplicant) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 flex justify-center items-center">
          <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
          <span>Loading application data...</span>
        </CardContent>
      </Card>
    );
  }
  
  // Status badge styling
  const statusStyles = {
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    accepted: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  };
  
  // Format application date
  const formattedDate = application.createdAt 
    ? new Intl.DateTimeFormat('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      }).format(new Date(application.createdAt))
    : 'Unknown date';
  
  if (!applicant) {
    return null;
  }
  
  return (
    <>
      <Card className="w-full">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div className="flex items-start space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback>{applicant.name?.substring(0, 2).toUpperCase() || applicant.username?.substring(0, 2).toUpperCase()}</AvatarFallback>
                {applicant.profilePicture && <AvatarImage src={applicant.profilePicture} alt={applicant.name} />}
              </Avatar>
              <div>
                <CardTitle className="text-base">{applicant.name || applicant.username}</CardTitle>
                <CardDescription className="text-xs flex items-center">
                  <Calendar className="h-3.5 w-3.5 mr-1" />
                  Applied on {formattedDate}
                </CardDescription>
              </div>
            </div>
            <Badge className={statusStyles[application.status as keyof typeof statusStyles]}>
              {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="pt-2 pb-3">
          {applicant.experienceLevel && (
            <Badge variant="outline" className="mr-2 mb-2">
              {applicant.experienceLevel.charAt(0).toUpperCase() + applicant.experienceLevel.slice(1)}
            </Badge>
          )}
          {applicant.weeklyAvailability && (
            <Badge variant="outline" className="mr-2 mb-2">
              {applicant.weeklyAvailability} hrs/week
            </Badge>
          )}
          
          {/* Only show skills if we have the expanded view */}
          {isExpanded && applicant.skills && applicant.skills.length > 0 && (
            <div className="mt-3">
              <p className="text-sm font-medium mb-1.5">Skills:</p>
              <div className="flex flex-wrap gap-1.5">
                {applicant.skills.map((skill, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {application.message && (
            <div className="mt-3">
              <div className="flex items-center text-sm font-medium mb-1.5">
                <MessageSquare className="h-4 w-4 mr-1.5" />
                Why they want to join:
              </div>
              <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                {application.message}
              </p>
            </div>
          )}
          
          {/* Show preferred role in expanded view */}
          {isExpanded && (application as any).preferredRole && (
            <div className="mt-3">
              <div className="flex items-center text-sm font-medium mb-1.5">
                Preferred Role:
              </div>
              <Badge variant="outline" className="mr-2">
                {(application as any).preferredRole}
              </Badge>
            </div>
          )}
          
          {/* Show previous experience in expanded view */}
          {isExpanded && (application as any).previousExperience && (
            <div className="mt-3">
              <div className="flex items-center text-sm font-medium mb-1.5">
                Previous Experience:
              </div>
              <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                {(application as any).previousExperience}
              </p>
            </div>
          )}
          
          {/* Show proof of work (NIT) in expanded view */}
          {isExpanded && (application as any).nitProof && (
            <div className="mt-3">
              <div className="flex items-center text-sm font-medium mb-1.5 text-primary">
                <CheckCircle className="h-4 w-4 mr-1.5" />
                NIT (Proof of Work):
              </div>
              <div className="border border-primary/20 bg-primary/5 p-3 rounded-md">
                <p className="text-sm">
                  {(application as any).nitProof}
                </p>
              </div>
            </div>
          )}
          
          {/* Show external links in expanded view */}
          {isExpanded && (
            <div className="mt-4 space-y-2">
              {application.resumeLink && (
                <a
                  href={application.resumeLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm flex items-center text-primary hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                  Portfolio/Resume
                </a>
              )}
              
              {application.githubLink && (
                <a
                  href={application.githubLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm flex items-center text-primary hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                  GitHub Profile
                </a>
              )}
              
              {application.linkedinProfile && (
                <a
                  href={application.linkedinProfile}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm flex items-center text-primary hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                  LinkedIn Profile
                </a>
              )}
            </div>
          )}
        </CardContent>
        
        {application.status === "pending" && (
          <>
            <Separator />
            <CardFooter className="pt-3 flex justify-end space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowRejectDialog(true)}
                disabled={rejectMutation.isPending}
                className="text-destructive border-destructive hover:bg-destructive/10"
              >
                {rejectMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <XCircle className="h-4 w-4 mr-1" />
                )}
                Decline
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  if (onAccept) {
                    onAccept();
                  } else {
                    acceptMutation.mutate();
                  }
                }}
                disabled={acceptMutation.isPending}
              >
                {acceptMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-1" />
                )}
                Accept
              </Button>
            </CardFooter>
          </>
        )}
      </Card>
      
      {/* Rejection Feedback Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
            <DialogDescription>
              Provide feedback to the applicant on why their application was rejected.
              This feedback will be sent to them directly.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="flex items-center space-x-2 mb-4">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{applicant.name?.substring(0, 2).toUpperCase() || applicant.username?.substring(0, 2).toUpperCase()}</AvatarFallback>
                {applicant.profilePicture && <AvatarImage src={applicant.profilePicture} alt={applicant.name} />}
              </Avatar>
              <div>
                <p className="font-medium">{applicant.name || applicant.username}</p>
                <p className="text-xs text-muted-foreground">Applied for your project</p>
              </div>
            </div>
            
            {(application as any).nitProof && (
              <div className="mb-4">
                <p className="text-sm font-medium mb-1">Their Proof of Work (NIT):</p>
                <div className="border border-muted rounded-md p-3 text-sm bg-muted/30">
                  {(application as any).nitProof}
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <p className="text-sm font-medium">Feedback Message:</p>
              <Textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Provide constructive feedback..."
                className="min-h-[120px]"
              />
              <p className="text-sm text-muted-foreground">
                Be specific about why they weren't selected and provide constructive feedback if possible.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowRejectDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => {
                if (onReject) {
                  onReject(feedbackText);
                  setShowRejectDialog(false);
                } else {
                  rejectMutation.mutate(feedbackText);
                  setShowRejectDialog(false);
                }
              }}
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Rejecting...
                </>
              ) : (
                "Reject Application"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}