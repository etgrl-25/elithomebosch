CREATE TABLE `sales` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`amount` integer NOT NULL,
	`payment` text NOT NULL,
	`note` text NOT NULL,
	`sold_at` text NOT NULL,
	`cancelled` integer DEFAULT 0 NOT NULL
);
