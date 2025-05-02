import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CalendarIcon, ChevronRightIcon } from "lucide-react";

const steps = [
  { id: "role", title: "Your Role" },
  { id: "skills", title: "Skills & Interests" },
  { id: "experience", title: "Experience" },
  { id: "availability", title: "Availability" },
];

const formSchema = z.object({
  role: z.enum(["creator", "joiner", "both"], {
    required_error: "Please select a role",
  }),
  skills: z
    .string()
    .min(1, "Please add at least one skill")
    .refine((val) => val.split(",").filter(Boolean).length > 0, {
      message: "Please add at least one skill",
    }),
  interests: z
    .string()
    .min(1, "Please add at least one interest")
    .refine((val) => val.split(",").filter(Boolean).length > 0, {
      message: "Please add at least one interest",
    }),
  experienceLevel: z.enum(["beginner", "intermediate", "advanced", "expert"], {
    required_error: "Please select your experience level",
  }),
  weeklyAvailability: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(
      z.number()
        .min(1, "Availability must be at least 1 hour")
        .max(168, "Availability cannot exceed 168 hours (7 days)")
    ),
});

type OnboardingFormValues = z.infer<typeof formSchema>;

export default function UserOnboarding({ onComplete }: { onComplete: () => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      role: user?.role || undefined,
      skills: user?.skills?.join(", ") || "",
      interests: user?.interests?.join(", ") || "",
      experienceLevel: user?.experienceLevel || undefined,
      weeklyAvailability: user?.weeklyAvailability?.toString() || "10",
    },
  });

  const currentStepId = steps[currentStep]?.id;
  const progress = ((currentStep + 1) / steps.length) * 100;

  async function handleNext() {
    const fields = {
      role: ["role"],
      skills: ["skills", "interests"],
      experience: ["experienceLevel"],
      availability: ["weeklyAvailability"],
    }[currentStepId];

    const result = await form.trigger(fields as any, { shouldFocus: true });
    
    if (!result) return;

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      await onSubmit(form.getValues());
    }
  }

  function handleBack() {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }

  async function onSubmit(values: OnboardingFormValues) {
    try {
      setIsSubmitting(true);
      
      const response = await apiRequest("PUT", "/api/profile", values);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update profile");
      }
      
      const data = await response.json();
      
      // Update user data in auth context
      queryClient.setQueryData(["/api/user"], data);
      
      toast({
        title: "Profile updated!",
        description: "Your profile has been successfully updated.",
      });
      
      // Call complete callback
      onComplete();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-muted/30">
      <Card className="w-full max-w-3xl mx-auto shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-2xl font-bold">Complete Your Profile</CardTitle>
          <CardDescription>
            Let's set up your profile to help you get the most out of CollabVerse
          </CardDescription>
          <Progress value={progress} className="h-2 mt-4" />
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form className="space-y-6">
              {/* Step 1: Role Selection */}
              {currentStepId === "role" && (
                <div className="space-y-4">
                  <h3 className="font-medium text-lg">How will you use CollabVerse?</h3>
                  
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select your role</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="creator">
                              Project Creator
                              <span className="block text-xs text-muted-foreground">
                                I want to create and lead projects
                              </span>
                            </SelectItem>
                            <SelectItem value="joiner">
                              Project Joiner
                              <span className="block text-xs text-muted-foreground">
                                I want to join existing projects
                              </span>
                            </SelectItem>
                            <SelectItem value="both">
                              Both
                              <span className="block text-xs text-muted-foreground">
                                I want to create and join projects
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Step 2: Skills & Interests */}
              {currentStepId === "skills" && (
                <div className="space-y-4">
                  <h3 className="font-medium text-lg">What are your skills & interests?</h3>
                  
                  <FormField
                    control={form.control}
                    name="skills"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your skills</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. JavaScript, React, Node.js (comma separated)"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="interests"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your interests</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. Web Development, UI Design, Mobile Apps (comma separated)"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Step 3: Experience Level */}
              {currentStepId === "experience" && (
                <div className="space-y-4">
                  <h3 className="font-medium text-lg">What's your experience level?</h3>
                  
                  <FormField
                    control={form.control}
                    name="experienceLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select your experience level</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your experience level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="beginner">
                              Beginner
                              <span className="block text-xs text-muted-foreground">
                                Less than 1 year of experience
                              </span>
                            </SelectItem>
                            <SelectItem value="intermediate">
                              Intermediate
                              <span className="block text-xs text-muted-foreground">
                                1-3 years of experience
                              </span>
                            </SelectItem>
                            <SelectItem value="advanced">
                              Advanced
                              <span className="block text-xs text-muted-foreground">
                                3-5 years of experience
                              </span>
                            </SelectItem>
                            <SelectItem value="expert">
                              Expert
                              <span className="block text-xs text-muted-foreground">
                                5+ years of experience
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Step 4: Availability */}
              {currentStepId === "availability" && (
                <div className="space-y-4">
                  <h3 className="font-medium text-lg">What's your weekly availability?</h3>
                  
                  <FormField
                    control={form.control}
                    name="weeklyAvailability"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hours per week</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max="168"
                            placeholder="Hours available per week"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <CalendarIcon className="h-5 w-5" />
                      <p className="text-sm">
                        This helps project creators know your time commitment. You can update this later.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </Form>
        </CardContent>

        <CardFooter className="flex justify-between border-t p-6">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0 || isSubmitting}
          >
            Back
          </Button>
          
          <Button 
            onClick={handleNext}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              "Saving..."
            ) : currentStep === steps.length - 1 ? (
              "Complete Profile"
            ) : (
              <>
                Next
                <ChevronRightIcon className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}