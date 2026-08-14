CREATE TABLE IF NOT EXISTS `sw_identity_profiles` (
  `user_id` text PRIMARY KEY NOT NULL,
  `email` text NOT NULL,
  `display_name` text NOT NULL,
  `identity_name` text,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `sw_identity_profiles_email_unique` ON `sw_identity_profiles` (`email`);
