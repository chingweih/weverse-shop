CREATE TABLE `products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text DEFAULT 'weverse',
	`sale_id` text NOT NULL,
	`last_checked_at` integer,
	`created_at` integer DEFAULT 1769057987956
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`product_id` integer NOT NULL,
	`variant_id` integer,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`variant_id`) REFERENCES `variants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_subs_specific` ON `subscriptions` (`user_id`,`variant_id`) WHERE "subscriptions"."variant_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_subs_any` ON `subscriptions` (`user_id`,`product_id`) WHERE "subscriptions"."variant_id" IS NULL;--> statement-breakpoint
CREATE INDEX `idx_subs_product` ON `subscriptions` (`product_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`line_user_id` text NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_line_user_id_unique` ON `users` (`line_user_id`);--> statement-breakpoint
CREATE TABLE `variants` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`variant_name` text NOT NULL,
	`variant_id` text NOT NULL,
	`last_status` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `unique_variant_per_product` ON `variants` (`product_id`,`variant_id`);--> statement-breakpoint
CREATE INDEX `idx_variants_product` ON `variants` (`product_id`);