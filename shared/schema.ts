import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User Model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role", { enum: ["creator", "joiner", "both"] }).notNull(),
  skills: text("skills").array(),
  interests: text("interests").array(),
  experienceLevel: text("experience_level"),
  weeklyAvailability: integer("weekly_availability"),
  profilePicture: text("profile_picture"),
  createdAt: timestamp("created_at").defaultNow()
});

// Project Model
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  creatorId: integer("creator_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  skillsNeeded: text("skills_needed").array(),
  timeline: text("timeline"),
  coverImage: text("cover_image"),
  stage: text("stage", { 
    enum: ["ideation", "mvp", "beta", "scaling"] 
  }).default("ideation"),
  focus: text("focus"),
  website: text("website"),
  createdAt: timestamp("created_at").defaultNow()
});

// Application Model
export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  projectId: integer("project_id").notNull(),
  message: text("message").notNull(),
  status: text("status", { enum: ["pending", "accepted", "rejected"] }).notNull().default("pending"),
  feedback: text("feedback"),
  resumeLink: text("resume_link"),
  linkedinProfile: text("linkedin_profile"),
  githubLink: text("github_link"),
  weeklyAvailability: integer("weekly_availability"),
  skills: text("skills").array(),
  createdAt: timestamp("created_at").defaultNow()
});

// Team Model
export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  userId: integer("user_id").notNull(),
  role: text("role", { enum: ["owner", "admin", "member"] }).notNull(),
  joinedAt: timestamp("joined_at").defaultNow()
});

// Task Model
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  assignedTo: integer("assigned_to"),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status", { enum: ["todo", "inProgress", "done"] }).notNull().default("todo"),
  priority: text("priority", { enum: ["low", "medium", "high"] }).default("medium"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
});

// Message Model
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  senderId: integer("sender_id").notNull(),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow()
});

// CalendarEvent Model
export const calendarEvents = pgTable("calendar_events", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  datetime: timestamp("datetime").notNull(),
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

// Notification Model
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  relatedId: integer("related_id"),
  createdAt: timestamp("created_at").defaultNow()
});

// Zod Schemas for Validation
export const insertUserSchema = createInsertSchema(users)
  .omit({ id: true, createdAt: true });

export const insertProjectSchema = createInsertSchema(projects)
  .omit({ id: true, createdAt: true });

export const insertApplicationSchema = createInsertSchema(applications)
  .omit({ id: true, createdAt: true, status: true });

export const insertTeamSchema = createInsertSchema(teams)
  .omit({ id: true, joinedAt: true });

export const insertTaskSchema = createInsertSchema(tasks)
  .omit({ id: true, createdAt: true, updatedAt: true });

export const insertMessageSchema = createInsertSchema(messages)
  .omit({ id: true, timestamp: true });

export const insertCalendarEventSchema = createInsertSchema(calendarEvents)
  .omit({ id: true, createdAt: true });

export const insertNotificationSchema = createInsertSchema(notifications)
  .omit({ id: true, isRead: true, createdAt: true });

// Login Schema
export const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters")
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginSchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type Application = typeof applications.$inferSelect;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;

export type Team = typeof teams.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type InsertCalendarEvent = z.infer<typeof insertCalendarEventSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
