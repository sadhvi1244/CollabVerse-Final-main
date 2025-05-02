import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertApplicationSchema } from "@shared/schema";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MultiSelect } from "@/components/ui/multi-select";

// Extend the application schema for the form
const applicationFormSchema = insertApplicationSchema.extend({
  message: z.string().min(10, "Please provide a brief message about why you want to join this project"),
  resumeLink: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  linkedinProfile: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  githubLink: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  weeklyAvailability: z.number().min(1, "Please specify your weekly availability").max(60, "Maximum 60 hours per week"),
  skills: z.array(z.string()).min(1, "Please select at least one skill"),
  previousExperience: z.string().optional().or(z.literal("")),
  nitProof: z.string().optional().or(z.literal("")),
  preferredRole: z.string().optional().or(z.literal(""))
});

// TypeScript type for form values
type ApplicationFormValues = z.infer<typeof applicationFormSchema>;

interface ApplicationFormProps {
  projectId: number;
  isOpen: boolean;
  onClose: () => void;
  projectSkills?: string[];
}

export function ApplicationForm({ projectId, isOpen, onClose, projectSkills = [] }: ApplicationFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [availableSkills, setAvailableSkills] = useState<{ value: string; label: string }[]>([]);
  
  // Create form with validation
  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationFormSchema),
    defaultValues: {
      projectId,
      userId: user?.id || 0,
      status: "pending",
      message: "",
      resumeLink: "",
      linkedinProfile: "",
      githubLink: "",
      weeklyAvailability: user?.weeklyAvailability || 5,
      skills: user?.skills || [],
      previousExperience: "",
      nitProof: "",
      preferredRole: ""
    },
  });

  // Handle form submission
  const submitMutation = useMutation({
    mutationFn: async (values: ApplicationFormValues) => {
      return apiRequest("POST", "/api/applications", values);
    },
    onSuccess: () => {
      toast({
        title: "Application Submitted",
        description: "Your application has been successfully submitted!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Application Failed",
        description: error.message || "Failed to submit your application. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Process skills for multi-select
  useEffect(() => {
    const combinedSkills = [...new Set([...(user?.skills || []), ...projectSkills])];
    setAvailableSkills(
      combinedSkills.map(skill => ({
        value: skill,
        label: skill
      }))
    );
    
    // Pre-fill user skills if available
    if (user?.skills?.length) {
      form.setValue("skills", user.skills);
    }
  }, [user, projectSkills, form]);

  const onSubmit = (values: ApplicationFormValues) => {
    submitMutation.mutate(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Apply to Join Project</DialogTitle>
          <DialogDescription>
            Tell the project creator why you'd like to join and what skills you can contribute. The more details you provide, the better your chances of being accepted.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Why do you want to join?</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe why you're interested in this project and what you can contribute..." 
                      className="min-h-[120px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Be specific about your interest and what skills you can bring to the project.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="skills"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Skills</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={availableSkills}
                      selectedValues={field.value.map(skill => ({ value: skill, label: skill }))}
                      onChange={(selected) => field.onChange(selected.map(item => item.value))}
                      placeholder="Select your relevant skills"
                      createable
                    />
                  </FormControl>
                  <FormDescription>
                    Select skills that are relevant to this project. You can add new ones if needed.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="weeklyAvailability"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Weekly Availability (hours)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min={1} 
                      max={60} 
                      placeholder="Hours per week" 
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    How many hours per week can you commit to this project?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="preferredRole"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Role</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Frontend Developer, UX Designer, Project Manager" {...field} />
                  </FormControl>
                  <FormDescription>
                    What role would you like to take on in this project?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="previousExperience"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Previous Experience</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Share your relevant experience for this role..." 
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Briefly describe your previous experience related to this project or role.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nitProof"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>NIT (Proof of Work)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe a small task or proof of concept you could implement for this project..." 
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Suggest a small proof of work you could complete to demonstrate your skills.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <h3 className="text-sm font-medium">Portfolio & Contact (Optional)</h3>
              
              <FormField
                control={form.control}
                name="resumeLink"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Portfolio/Resume Link</FormLabel>
                    <FormControl>
                      <Input placeholder="https://yourportfolio.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="githubLink"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GitHub Profile</FormLabel>
                    <FormControl>
                      <Input placeholder="https://github.com/username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="linkedinProfile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LinkedIn Profile</FormLabel>
                    <FormControl>
                      <Input placeholder="https://linkedin.com/in/username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button variant="outline" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={submitMutation.isPending}
              >
                {submitMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Application"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}