import { boolean, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Public programme records. The site always reads the official Google Sheet feed
 * first; this table is the verified fallback and provides a stable management
 * model for a future admin screen. Images are referenced by S3 URL only.
 */
export const programs = mysqlTable("programs", {
  id: int("id").autoincrement().primaryKey(),
  externalId: varchar("externalId", { length: 128 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  summary: text("summary").notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  target: varchar("target", { length: 255 }),
  venue: varchar("venue", { length: 255 }),
  startAt: timestamp("startAt"),
  endAt: timestamp("endAt"),
  recruitmentDeadline: timestamp("recruitmentDeadline"),
  recruitmentStatus: mysqlEnum("recruitmentStatus", ["upcoming", "open", "closing-soon", "closed"]).default("upcoming").notNull(),
  applicationUrl: text("applicationUrl"),
  applicationProvider: mysqlEnum("applicationProvider", ["nyjcf", "naver", "other", "none"]).default("none").notNull(),
  contact: varchar("contact", { length: 255 }),
  preApplicationChecks: text("preApplicationChecks"),
  imageUrl: text("imageUrl"),
  isPublished: boolean("isPublished").default(false).notNull(),
  sourceUpdatedAt: timestamp("sourceUpdatedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Program = typeof programs.$inferSelect;
export type InsertProgram = typeof programs.$inferInsert;
