import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const adminUsers = sqliteTable("admin_users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("admin"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const playerUsers = sqliteTable("player_users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email"),
  passwordHash: text("password_hash"),
  isGuest: integer("is_guest", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const groups = sqliteTable("groups", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
});

export const collections = sqliteTable("collections", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  groupId: integer("group_id"),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
});

export const puzzles = sqliteTable("puzzles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  collectionId: integer("collection_id"),
  title: text("title").notNull(),
  date: text("date").notNull(),
  status: text("status").notNull().default("draft"),
  iconUrl: text("icon_url"),
  description: text("description"),
  difficulty: text("difficulty"),
  publishedAt: integer("published_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const gameSessions = sqliteTable("game_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  puzzleId: integer("puzzle_id").notNull(),
  playerId: integer("player_id"),
  status: text("status").notNull().default("active"),
  data: text("data"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const sessionHints = sqliteTable("session_hints", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  gameSessionId: integer("game_session_id").notNull(),
  payload: text("payload").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const shares = sqliteTable("shares", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  puzzleId: integer("puzzle_id").notNull(),
  playerId: integer("player_id"),
  channel: text("channel").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});









