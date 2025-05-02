import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { insertProjectSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Project stages with descriptions
const PROJECT_STAGES = [
  { 
    value: "ideation", 
    label: "Ideation", 
    description: "Plan and design your platform", 
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" 
  },
  { 
    value: "mvp", 
    label: "MVP", 
    description: "Build the first working version", 
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" 
  },
  { 
    value: "beta", 
    label: "Beta Launch", 
    description: "Real user testing and improvements", 
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" 
  },
  { 
    value: "scaling", 
    label: "Scaling & Monetization", 
    description: "Grow users and start revenue", 
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" 
  }
];

// Extend the schema with client-side validation
const projectFormSchema = insertProjectSchema
  .extend({
    skillsNeeded: z.string().optional().transform(val => 
      val ? val.split(',').map(skill => skill.trim()).filter(Boolean) : []
    ),
    stage: z.enum(["ideation", "mvp", "beta", "scaling"]).default("ideation"),
    focus: z.string().optional()
  })
  .omit({ creatorId: true });

type ProjectFormValues = z.infer<typeof projectFormSchema>;

interface ProjectFormProps {
  onSuccess?: () => void;
}

export function ProjectForm({ onSuccess }: ProjectFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Initialize form with default values
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      title: "",
      description: "",
      skillsNeeded: "",
      timeline: "",
      coverImage: "",
      stage: "ideation",
      focus: ""
    }
  });

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (values: ProjectFormValues) => {
      // Convert skillsNeeded from string to array if needed
      const skillsArray = typeof values.skillsNeeded === 'string' 
        ? values.skillsNeeded.split(',').map(skill => skill.trim()).filter(Boolean)
        : values.skillsNeeded;
        
      // Ensure we have a valid user ID
      if (!user?.id) {
        throw new Error("You must be logged in to create a project");
      }
      
      const projectData = {
        ...values,
        skillsNeeded: skillsArray,
        creatorId: user.id
      };
      
      console.log("Creating project with data:", projectData);
      const response = await apiRequest("POST", "/api/projects", projectData);
      return await response.json();
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      
      toast({
        title: "Project created",
        description: "Your project has been successfully created.",
      });
      
      form.reset();
      
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create project",
        description: error.message || "There was an error creating your project. Please try again.",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (values: ProjectFormValues) => {
    createProjectMutation.mutate(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project Title</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Mobile App for Health Tracking" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Describe your project idea, goals, and what you're looking to achieve" 
                    className="min-h-[120px]" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="skillsNeeded"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Skills Needed (comma separated)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. React, UI Design, Node.js" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="timeline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Timeline</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. 2-3 months" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="coverImage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cover Image URL (optional)</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="https://example.com/image.jpg" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Project Stage Selection */}
            <FormField
              control={form.control}
              name="stage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Stage</FormLabel>
                  <Select 
                    value={field.value} 
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a stage" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PROJECT_STAGES.map(stage => (
                        <SelectItem key={stage.value} value={stage.value}>
                          <div className="flex flex-col">
                            <span>{stage.label}</span>
                            <span className="text-xs text-gray-500">{stage.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select your project's current development stage
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Focus Field */}
            <FormField
              control={form.control}
              name="focus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Focus</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. Mobile App, Web Platform, etc."
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    What is the main focus or type of your project?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        <Button 
          type="submit" 
          className="w-full" 
          disabled={createProjectMutation.isPending}
        >
          {createProjectMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Project...
            </>
          ) : (
            "Create Project"
          )}
        </Button>
      </form>
    </Form>
  );
}
