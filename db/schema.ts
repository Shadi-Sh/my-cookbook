import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
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
});
export const aiUsage = sqliteTable('ai_usage', {
  day: text('day').primaryKey(),
  requests: integer('requests').notNull(),
});
