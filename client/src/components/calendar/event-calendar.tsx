import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CalendarEvent } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { format, isToday, isThisWeek, isThisMonth, isSameDay } from "date-fns";
import { Calendar, CalendarPlus, Clock, Loader2, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface EventCalendarProps {
  projectId: number;
  isCreator?: boolean;
}

export function EventCalendar({
  projectId,
  isCreator = false,
}: EventCalendarProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showAddEventDialog, setShowAddEventDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );
  const [selectedView, setSelectedView] = useState<"calendar" | "list">(
    "calendar"
  );
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    date: new Date(),
    time: format(new Date(), "HH:mm"),
  });
  const [currentTab, setCurrentTab] = useState<"all" | "upcoming" | "today">(
    "all"
  );

  // Fetch events for the project
  const { data: events, isLoading } = useQuery<CalendarEvent[]>({
    queryKey: [`/api/projects/${projectId}/events`],
    enabled: !!projectId,
  });

  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: async () => {
      // Combine date and time to create a datetime
      const [hours, minutes] = newEvent.time.split(":").map(Number);
      const datetime = new Date(newEvent.date);
      datetime.setHours(hours);
      datetime.setMinutes(minutes);

      return await apiRequest("POST", "/api/events", {
        projectId,
        title: newEvent.title,
        description: newEvent.description,
        datetime: datetime.toISOString(),
        createdBy: user?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/projects/${projectId}/events`],
      });
      setShowAddEventDialog(false);
      setNewEvent({
        title: "",
        description: "",
        date: new Date(),
        time: format(new Date(), "HH:mm"),
      });
      toast({
        title: "Event created",
        description: "Your event has been scheduled successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create event",
        description:
          error.message || "There was an error scheduling your event.",
        variant: "destructive",
      });
    },
  });

  // Filter events based on the selected tab
  const getFilteredEvents = (): CalendarEvent[] => {
    if (!events) return [];

    switch (currentTab) {
      case "today":
        return events.filter((event) => isToday(new Date(event.datetime)));
      case "upcoming":
        return events.filter((event) => {
          const eventDate = new Date(event.datetime);
          return (
            eventDate > new Date() &&
            (isThisWeek(eventDate) || isThisMonth(eventDate))
          );
        });
      case "all":
      default:
        return events;
    }
  };

  // Sort events by date
  const sortedEvents = getFilteredEvents().sort((a, b) => {
    return new Date(a.datetime).getTime() - new Date(b.datetime).getTime();
  });

  // Function to get events for the selected date
  const getEventsForDate = (date: Date): CalendarEvent[] => {
    if (!events) return [];
    return events.filter((event) => {
      const eventDate = new Date(event.datetime);
      return isSameDay(eventDate, date);
    });
  };

  // Handle input changes for the new event form
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setNewEvent((prev) => ({ ...prev, [name]: value }));
  };

  // Handle date selection in the calendar
  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
  };

  // Render calendar with highlighted event dates
  const eventsForCalendar = events
    ? events.map((event) => new Date(event.datetime))
    : [];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Project Calendar</h2>
        <div className="flex gap-2">
          <Button
            variant={selectedView === "calendar" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedView("calendar")}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Calendar
          </Button>
          <Button
            variant={selectedView === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedView("list")}
          >
            <Users className="h-4 w-4 mr-2" />
            List View
          </Button>
          <Button onClick={() => setShowAddEventDialog(true)}>
            <CalendarPlus className="h-4 w-4 mr-2" />
            Add Event
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {selectedView === "calendar" ? (
            <Card>
              <CardContent className="p-4">
                <div className="grid md:grid-cols-7 gap-6">
                  <div className="md:col-span-5">
                    <CalendarComponent
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDateSelect}
                      className="rounded-md border w-full"
                      selectedDays={eventsForCalendar}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-4 h-full">
                      <h3 className="font-medium mb-4">
                        {selectedDate
                          ? format(selectedDate, "EEEE, MMMM d, yyyy")
                          : "No date selected"}
                      </h3>

                      {selectedDate && (
                        <div>
                          <h4 className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                            Events
                          </h4>
                          <div className="space-y-3">
                            {getEventsForDate(selectedDate).length > 0 ? (
                              getEventsForDate(selectedDate).map((event) => (
                                <div
                                  key={event.id}
                                  className="p-3 bg-white dark:bg-gray-700 rounded-md shadow-sm"
                                >
                                  <h5 className="font-medium">{event.title}</h5>
                                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {format(new Date(event.datetime), "h:mm a")}
                                  </div>
                                  {event.description && (
                                    <p className="text-sm mt-2">
                                      {event.description}
                                    </p>
                                  )}
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                No events scheduled for this day
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <Tabs
                  defaultValue="all"
                  onValueChange={(value) =>
                    setCurrentTab(value as "all" | "upcoming" | "today")
                  }
                >
                  <TabsList>
                    <TabsTrigger value="all">All Events</TabsTrigger>
                    <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                    <TabsTrigger value="today">Today</TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              <CardContent>
                {sortedEvents.length > 0 ? (
                  <div className="space-y-4">
                    {sortedEvents.map((event) => {
                      const eventDate = new Date(event.datetime);
                      const isUpcoming = eventDate > new Date();

                      return (
                        <div
                          key={event.id}
                          className={`p-4 border rounded-lg ${
                            isUpcoming
                              ? "border-primary/20 bg-primary/5"
                              : "border-gray-200 dark:border-gray-700"
                          }`}
                        >
                          <div className="flex justify-between">
                            <h3 className="font-medium">{event.title}</h3>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {format(eventDate, "MMM d, yyyy")}
                            </span>
                          </div>
                          {event.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                              {event.description}
                            </p>
                          )}
                          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-3">
                            <Clock className="h-4 w-4 mr-1" />
                            {format(eventDate, "h:mm a")}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                    <h3 className="text-lg font-medium mb-1">
                      No events found
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                      {currentTab === "all"
                        ? "No events have been scheduled yet for this project."
                        : currentTab === "upcoming"
                        ? "There are no upcoming events scheduled."
                        : "There are no events scheduled for today."}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Add Event Dialog */}
      <Dialog open={showAddEventDialog} onOpenChange={setShowAddEventDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Schedule New Event</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Event Title</Label>
              <Input
                id="title"
                name="title"
                value={newEvent.title}
                onChange={handleInputChange}
                placeholder="Enter event title"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                name="description"
                value={newEvent.description}
                onChange={handleInputChange}
                placeholder="Enter event description"
                className="min-h-[100px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  value={format(newEvent.date, "yyyy-MM-dd")}
                  onChange={(e) => {
                    if (e.target.value) {
                      setNewEvent({
                        ...newEvent,
                        date: new Date(e.target.value),
                      });
                    }
                  }}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  name="time"
                  type="time"
                  value={newEvent.time}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddEventDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => createEventMutation.mutate()}
              disabled={!newEvent.title.trim() || createEventMutation.isPending}
            >
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
