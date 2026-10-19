import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";
export const notebooks = sqliteTable("notebooks", {
  owner: text("owner").primaryKey(),
  payload: text("payload").notNull(),
  version: integer("version").notNull(),
  updatedAt: text("updated_at").notNull(),
});
export const attachments = sqliteTable("attachments", {
  id: text("id").primaryKey(),
  owner: text("owner").notNull(),
  objectKey: text("object_key").notNull(),
  mime: text("mime").notNull(),
  size: integer("size").notNull(),
  deleted: integer("deleted").notNull().default(0),
  createdAt: integer("created_at").notNull().default(0),
});
export const aiUsage = sqliteTable('ai_usage', {
  day: text('day').primaryKey(),
  requests: integer('requests').notNull(),
});

// Alpha: two attempts per authenticated user and UTC day; no recipe data.
export const aiUserUsage = sqliteTable('ai_user_usage', {
  owner: text('owner').notNull(),
  day: text('day').notNull(),
  requests: integer('requests').notNull(),
}, table => [primaryKey({columns: [table.owner, table.day]})]);
