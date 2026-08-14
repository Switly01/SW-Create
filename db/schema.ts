import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable(
  "sw_users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    displayName: text("display_name").notNull(),
    passwordHash: text("password_hash").notNull(),
    passwordSalt: text("password_salt").notNull(),
    emailVerifiedAt: integer("email_verified_at"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [uniqueIndex("sw_users_email_unique").on(table.email)],
);

export const sessions = sqliteTable(
  "sw_sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    tokenHash: text("token_hash").notNull(),
    expiresAt: integer("expires_at").notNull(),
    createdAt: integer("created_at").notNull(),
    lastSeenAt: integer("last_seen_at").notNull(),
  },
  (table) => [uniqueIndex("sw_sessions_token_unique").on(table.tokenHash)],
);

export const products = sqliteTable(
  "sw_products",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    status: text("status").notNull().default("active"),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [uniqueIndex("sw_products_slug_unique").on(table.slug)],
);

export const entitlements = sqliteTable(
  "sw_entitlements",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    productId: text("product_id").notNull(),
    tier: text("tier").notNull().default("free"),
    source: text("source").notNull().default("system"),
    startsAt: integer("starts_at").notNull(),
    expiresAt: integer("expires_at"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("sw_entitlements_user_product_unique").on(
      table.userId,
      table.productId,
    ),
  ],
);

export const waitlist = sqliteTable(
  "sw_waitlist",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    plan: text("plan").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [uniqueIndex("sw_waitlist_email_plan_unique").on(table.email, table.plan)],
);

export const identityProfiles = sqliteTable(
  "sw_identity_profiles",
  {
    userId: text("user_id").primaryKey(),
    email: text("email").notNull(),
    displayName: text("display_name").notNull(),
    identityName: text("identity_name"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [uniqueIndex("sw_identity_profiles_email_unique").on(table.email)],
);
