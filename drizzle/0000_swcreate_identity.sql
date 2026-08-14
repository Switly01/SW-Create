CREATE TABLE `sw_users` (
  `id` text PRIMARY KEY NOT NULL,
  `email` text NOT NULL,
  `display_name` text NOT NULL,
  `password_hash` text NOT NULL,
  `password_salt` text NOT NULL,
  `email_verified_at` integer,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sw_users_email_unique` ON `sw_users` (`email`);
--> statement-breakpoint
CREATE TABLE `sw_sessions` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL,
  `token_hash` text NOT NULL,
  `expires_at` integer NOT NULL,
  `created_at` integer NOT NULL,
  `last_seen_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sw_sessions_token_unique` ON `sw_sessions` (`token_hash`);
--> statement-breakpoint
CREATE INDEX `sw_sessions_user_idx` ON `sw_sessions` (`user_id`, `expires_at`);
--> statement-breakpoint
CREATE TABLE `sw_products` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `slug` text NOT NULL,
  `status` text DEFAULT 'active' NOT NULL,
  `created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sw_products_slug_unique` ON `sw_products` (`slug`);
--> statement-breakpoint
CREATE TABLE `sw_entitlements` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL,
  `product_id` text NOT NULL,
  `tier` text DEFAULT 'free' NOT NULL,
  `source` text DEFAULT 'system' NOT NULL,
  `starts_at` integer NOT NULL,
  `expires_at` integer,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sw_entitlements_user_product_unique` ON `sw_entitlements` (`user_id`, `product_id`);
--> statement-breakpoint
CREATE TABLE `sw_waitlist` (
  `id` text PRIMARY KEY NOT NULL,
  `email` text NOT NULL,
  `plan` text NOT NULL,
  `created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sw_waitlist_email_plan_unique` ON `sw_waitlist` (`email`, `plan`);
