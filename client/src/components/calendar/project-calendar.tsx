import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, addDays, startOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO } from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Loader2, Plus } from "lucide-react";
import { CalendarEvent } from "@shared/schema";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

interface ProjectCalendarProps {
  projectId: number;
}

export function ProjectCalendar({ projectId }: ProjectCalendarProps) {
  const [date, setDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDescription, setNewEventDescription] = useState("");
  const [newEventTime, setNewEventTime] = useState("");
  
  const { toast } = useToast();

  const { data: events, isLoading } = useQuery<CalendarEvent[]>({
    queryKey: ["/api/projects", projectId, "events"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/projects/${projectId}/events`);
      if (!res.ok) throw new Error("Failed to load events");
      return res.json();
    },
  });

  // Create new event
  const createEventMutation = useMutation({
    mutationFn: async (eventData: {
      projectId: number;
      title: string;
      description: string;
      datetime: string;
    }) => {
      const res = await apiRequest("POST", "/api/events", eventData);
      if (!res.ok) throw new Error("Failed to create event");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Event Created",
        description: "Your event has been scheduled successfully.",
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/projects", projectId, "events"],
      });
      setEventDialogOpen(false);
      setNewEventTitle("");
      setNewEventDescription("");
      setNewEventTime("");
    },
    onError: (error: Error) => {
      toast({
        title: "Event Creation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateEvent = () => {
    if (!newEventTitle.trim() || !newEventTime || !selectedDate) return;
    
    // Combine date and time
    const dateTime = new Date(selectedDate);
    const [hours, minutes] = newEventTime.split(":").map(Number);
    dateTime.setHours(hours, minutes);
    
    createEventMutation.mutate({
      projectId,
      title: newEventTitle,
      description: newEventDescription,
      datetime: dateTime.toISOString(),
    });
  };

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(date),
    end: endOfMonth(date),
  });

  const firstDayOfMonth = startOfMonth(date);
  const startDate = startOfWeek(firstDayOfMonth);
  const days = Array.from({ length: 42 }, (_, i) => addDays(startDate, i));

  const getEventsForDay = (day: Date) => {
    if (!events) return [];
    return events.filter(event => {
      const eventDate = parseISO(event.datetime.toString());
      return isSameDay(eventDate, day);
    });
  };

  const handleDateClick = (day: Date) => {
    setSelectedDate(day);
    setEventDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Event Calendar</h2>
        <div className="flex space-x-2">
          <Button 
            variant="outline"
            size="sm"
            onClick={() => setDate(new Date())}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setDate(new Date(date.getFullYear(), date.getMonth() - 1, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setDate(new Date(date.getFullYear(), date.getMonth() + 1, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="text-center mb-4">
        <h3 className="text-xl font-medium">{format(date, 'MMMM yyyy')}</h3>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-sm font-medium text-center p-2">
            {day}
          </div>
        ))}
        
        {days.map((day, i) => {
          const dayEvents = getEventsForDay(day);
          const isCurrentMonth = isSameMonth(day, date);
          const isToday = isSameDay(day, new Date());
          
          return (
            <div 
              key={i}
              className={`min-h-[100px] border rounded-md p-1 ${
                isCurrentMonth ? 'bg-white' : 'bg-gray-50 text-gray-400'
              } ${isToday ? 'ring-2 ring-primary ring-offset-1' : ''}`}
              onClick={() => handleDateClick(day)}
            >
              <div className="text-right p-1">
                <span className={`text-sm ${isToday ? 'font-bold' : ''}`}>
                  {format(day, 'd')}
                </span>
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event) => (
                  <div 
                    key={event.id}
                    className="bg-blue-100 text-blue-800 text-xs p-1 rounded truncate"
                    title={event.title}
                  >
                    {format(parseISO(event.datetime.toString()), 'h:mm a')} - {event.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-gray-500 pl-1">
                    + {dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* New Event Dialog */}
      <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule New Event</DialogTitle>
            <DialogDescription>
              Create a new event for {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : ''}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Event Title
              </label>
              <Input
                id="title"
                value={newEventTitle}
                onChange={(e) => setNewEventTitle(e.target.value)}
                placeholder="Enter event title"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="time" className="text-sm font-medium">
                Time
              </label>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <Input
                  id="time"
                  type="time"
                  value={newEventTime}
                  onChange={(e) => setNewEventTime(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <Textarea
                id="description"
                value={newEventDescription}
                onChange={(e) => setNewEventDescription(e.target.value)}
                placeholder="Enter event description"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEventDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateEvent} disabled={createEventMutation.isPending}>
              {createEventMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Scheduling...
                </>
              ) : (
                "Schedule Event"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}