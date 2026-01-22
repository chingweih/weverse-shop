PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text DEFAULT 'weverse',
	`sale_id` text NOT NULL,
	`last_checked_at` integer,
	`created_at` integer DEFAULT 1769063209617
);
--> statement-breakpoint
INSERT INTO `__new_products`("id", "type", "sale_id", "last_checked_at", "created_at") SELECT "id", "type", "sale_id", "last_checked_at", "created_at" FROM `products`;--> statement-breakpoint
DROP TABLE `products`;--> statement-breakpoint
ALTER TABLE `__new_products` RENAME TO `products`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `unique_type_saleId` ON `products` (`type`,`sale_id`);