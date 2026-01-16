import { mysqlTable, int, varchar, text, timestamp, mysqlEnum, boolean, json } from "drizzle-orm/mysql-core";

/**
 * Support tickets - main table for tracking support requests
 */
export const supportTickets = mysqlTable("support_tickets", {
  id: int("id").autoincrement().primaryKey(),
  ticketNumber: varchar("ticketNumber", { length: 50 }).notNull().unique(),
  userId: int("userId").notNull(),
  userEmail: varchar("userEmail", { length: 320 }).notNull(),
  userName: varchar("userName", { length: 255 }).notNull(),
  userRole: mysqlEnum("userRole", ["artist", "venue", "admin"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  category: mysqlEnum("category", ["contracts", "billing", "technical", "account", "general"]).notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).notNull(),
  status: mysqlEnum("status", ["open", "in-progress", "waiting-customer", "resolved", "closed"]).default("open").notNull(),
  assignedTeam: varchar("assignedTeam", { length: 100 }),
  assignedTo: int("assignedTo"),
  tags: json("tags").$type<string[]>().default([]),
  attachments: json("attachments").$type<Array<{ name: string; url: string }>>().default([]),
  
  // SLA tracking
  responseTimeMinutes: int("responseTimeMinutes"),
  resolutionTimeMinutes: int("resolutionTimeMinutes"),
  firstResponseAt: timestamp("firstResponseAt"),
  resolvedAt: timestamp("resolvedAt"),
  slaStatus: mysqlEnum("slaStatus", ["on-track", "at-risk", "breached"]).default("on-track").notNull(),
  slaBreachedAt: timestamp("slaBreachedAt"),
  
  // Metadata
  relatedBookingId: int("relatedBookingId"),
  relatedContractId: int("relatedContractId"),
  internalNotes: text("internalNotes"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  closedAt: timestamp("closedAt"),
});

export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = typeof supportTickets.$inferInsert;

/**
 * Ticket responses - comments and updates on tickets
 */
export const ticketResponses = mysqlTable("ticket_responses", {
  id: int("id").autoincrement().primaryKey(),
  ticketId: int("ticketId").notNull(),
  userId: int("userId").notNull(),
  userName: varchar("userName", { length: 255 }).notNull(),
  userRole: mysqlEnum("userRole", ["customer", "support", "admin"]).notNull(),
  message: text("message").notNull(),
  attachments: json("attachments").$type<Array<{ name: string; url: string }>>().default([]),
  isInternal: boolean("isInternal").default(false).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TicketResponse = typeof ticketResponses.$inferSelect;
export type InsertTicketResponse = typeof ticketResponses.$inferInsert;

/**
 * Ticket assignments - track team assignments and escalations
 */
export const ticketAssignments = mysqlTable("ticket_assignments", {
  id: int("id").autoincrement().primaryKey(),
  ticketId: int("ticketId").notNull(),
  assignedTo: int("assignedTo").notNull(),
  assignedBy: int("assignedBy").notNull(),
  team: varchar("team", { length: 100 }).notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).notNull(),
  reason: text("reason"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TicketAssignment = typeof ticketAssignments.$inferSelect;
export type InsertTicketAssignment = typeof ticketAssignments.$inferInsert;

/**
 * Help center articles
 */
export const helpArticles = mysqlTable("help_articles", {
  id: int("id").autoincrement().primaryKey(),
  articleId: varchar("articleId", { length: 100 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  summary: text("summary").notNull(),
  content: text("content").notNull(),
  category: mysqlEnum("category", ["getting-started", "contracts", "bookings", "payments", "signatures", "account", "technical"]).notNull(),
  difficulty: mysqlEnum("difficulty", ["beginner", "intermediate", "advanced"]).default("beginner").notNull(),
  keywords: json("keywords").$type<string[]>().default([]),
  relatedArticles: json("relatedArticles").$type<string[]>().default([]),
  
  // Engagement tracking
  views: int("views").default(0).notNull(),
  helpful: int("helpful").default(0).notNull(),
  unhelpful: int("unhelpful").default(0).notNull(),
  averageRating: int("averageRating"),
  
  // Metadata
  estimatedReadTime: int("estimatedReadTime"),
  lastUpdatedBy: int("lastUpdatedBy"),
  isPublished: boolean("isPublished").default(true).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type HelpArticle = typeof helpArticles.$inferSelect;
export type InsertHelpArticle = typeof helpArticles.$inferInsert;

/**
 * Support metrics - aggregated statistics for analytics
 */
export const supportMetrics = mysqlTable("support_metrics", {
  id: int("id").autoincrement().primaryKey(),
  date: timestamp("date").notNull(),
  
  // Ticket metrics
  totalTickets: int("totalTickets").default(0).notNull(),
  openTickets: int("openTickets").default(0).notNull(),
  resolvedTickets: int("resolvedTickets").default(0).notNull(),
  closedTickets: int("closedTickets").default(0).notNull(),
  
  // Performance metrics
  averageResponseTime: int("averageResponseTime"),
  averageResolutionTime: int("averageResolutionTime"),
  slaComplianceRate: int("slaComplianceRate"),
  slaBreachCount: int("slaBreachCount").default(0).notNull(),
  
  // Category breakdown
  categoryBreakdown: json("categoryBreakdown").$type<Record<string, number>>().default({}),
  priorityBreakdown: json("priorityBreakdown").$type<Record<string, number>>().default({}),
  
  // Team metrics
  teamMetrics: json("teamMetrics").$type<Record<string, { tickets: number; avgTime: number }>>().default({}),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SupportMetrics = typeof supportMetrics.$inferSelect;
export type InsertSupportMetrics = typeof supportMetrics.$inferInsert;
