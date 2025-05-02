import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Application } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ExternalLink, CheckCircle, XCircle, Clock, Loader2 } from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";

interface ApplicationReviewProps {
  application: Application;
  onActionComplete?: () => void;
}

export function ApplicationReview({ application, onActionComplete }: ApplicationReviewProps) {
  const [feedback, setFeedback] = useState("");
  const { toast } = useToast();

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

  // Accept application mutation
  const acceptMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/applications/${application.id}/accept`, {});
      return true;
    },
    onSuccess: () => {
      toast({
        title: "Application accepted",
        description: "The applicant has been added to your team.",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      
      if (onActionComplete) {
        onActionComplete();
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to accept application",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Reject application mutation
  const rejectMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/applications/${application.id}/reject`, { 
        feedback 
      });
      return true;
    },
    onSuccess: () => {
      toast({
        title: "Application rejected",
        description: "The applicant has been notified.",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      
      if (onActionComplete) {
        onActionComplete();
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to reject application",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Format date for display
  const formatDate = (date: Date | string | null) => {
    if (!date) return "";
    return format(new Date(date), "MMM dd, yyyy");
  };

  const isPending = acceptMutation.isPending || rejectMutation.isPending;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Application Review</CardTitle>
            <CardDescription>
              Application received on {formatDate(application.createdAt)}
            </CardDescription>
          </div>
          <Badge 
            variant="outline" 
            className={`${statusBadgeStyle[application.status as keyof typeof statusBadgeStyle]} flex items-center`}
          >
            {statusIcon[application.status as keyof typeof statusIcon]}
            {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {application.message && (
          <div>
            <h3 className="text-sm font-medium mb-1">Message</h3>
            <p className="text-sm bg-muted p-3 rounded-md">{application.message}</p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {application.resumeLink && (
            <div>
              <h3 className="text-sm font-medium mb-1">Resume</h3>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full" 
                onClick={() => window.open(application.resumeLink || "", "_blank")}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Resume
              </Button>
            </div>
          )}
          
          {application.linkedinProfile && (
            <div>
              <h3 className="text-sm font-medium mb-1">LinkedIn</h3>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full" 
                onClick={() => window.open(application.linkedinProfile || "", "_blank")}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View LinkedIn
              </Button>
            </div>
          )}
          
          {application.githubLink && (
            <div>
              <h3 className="text-sm font-medium mb-1">GitHub</h3>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full" 
                onClick={() => window.open(application.githubLink || "", "_blank")}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View GitHub
              </Button>
            </div>
          )}
        </div>
        
        {application.status === "pending" && (
          <div>
            <h3 className="text-sm font-medium mb-1">Feedback (optional)</h3>
            <Textarea 
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Add feedback for the applicant (required if rejecting)"
              className="min-h-[100px]"
            />
          </div>
        )}
        
        {application.status !== "pending" && application.feedback && (
          <div>
            <h3 className="text-sm font-medium mb-1">Feedback Provided</h3>
            <p className="text-sm bg-muted p-3 rounded-md">{application.feedback}</p>
          </div>
        )}
      </CardContent>
      
      {application.status === "pending" && (
        <CardFooter className="flex justify-between gap-4">
          <Button 
            variant="destructive" 
            className="flex-1"
            onClick={() => rejectMutation.mutate()}
            disabled={isPending || (!feedback.trim() && rejectMutation.isPending)}
          >
            {rejectMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Reject
          </Button>
          <Button 
            variant="default" 
            className="flex-1"
            onClick={() => acceptMutation.mutate()}
            disabled={isPending}
          >
            {acceptMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Accept
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}