import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Task } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Edit2, Trash2, User } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface TaskCardProps {
  task: Task;
  projectId: number;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function TaskCard({ task, projectId, onEdit, onDelete }: TaskCardProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [editedTask, setEditedTask] = useState({
    title: task.title,
    description: task.description || "",
    priority: task.priority || "medium",
  });
  const { toast } = useToast();

  // Priority colors
  const priorityColors = {
    low: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  };

  // Update task mutation
  const updateMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("PUT", `/api/tasks/${task.id}`, {
        ...task,
        ...editedTask,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/tasks`] });
      setShowDialog(false);
      toast({
        title: "Task updated",
        description: "Task has been successfully updated.",
      });
      if (onEdit) onEdit();
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update task.",
        variant: "destructive",
      });
    },
  });

  // Delete task mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", `/api/tasks/${task.id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/tasks`] });
      toast({
        title: "Task deleted",
        description: "Task has been successfully deleted.",
      });
      if (onDelete) onDelete();
    },
    onError: (error: Error) => {
      toast({
        title: "Deletion failed",
        description: error.message || "Failed to delete task.",
        variant: "destructive",
      });
    },
  });

  const handleUpdate = () => {
    if (!editedTask.title.trim()) {
      toast({
        title: "Title required",
        description: "Task title cannot be empty.",
        variant: "destructive",
      });
      return;
    }
    updateMutation.mutate();
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this task?")) {
      deleteMutation.mutate();
    }
  };

  return (
    <>
      <Card className="mb-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow">
        <CardContent className="p-3">
          <div className="flex justify-between items-start">
            <h3 className="font-medium text-sm">{task.title}</h3>
            <div className="flex space-x-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6" 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDialog(true);
                }}
              >
                <Edit2 className="h-3 w-3" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 text-destructive" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
          
          {task.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-2 line-clamp-2">
              {task.description}
            </p>
          )}
          
          <div className="flex justify-between items-center mt-2">
            <Badge variant="outline" className={`text-xs ${priorityColors[task.priority || 'medium']}`}>
              {task.priority?.charAt(0).toUpperCase() + task.priority?.slice(1) || "Medium"}
            </Badge>
            
            {task.assignedTo ? (
              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                <User className="h-3 w-3 mr-1" />
                <span>Assigned</span>
              </div>
            ) : (
              <div className="text-xs text-gray-400 dark:text-gray-500">Unassigned</div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={editedTask.title}
                onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={editedTask.description}
                onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="priority">Priority</Label>
              <select
                id="priority"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={editedTask.priority}
                onChange={(e) => setEditedTask({ ...editedTask, priority: e.target.value })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
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
