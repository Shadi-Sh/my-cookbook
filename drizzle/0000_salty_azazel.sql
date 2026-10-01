CREATE TABLE `attachments` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`object_key` text NOT NULL,
	`mime` text NOT NULL,
	`size` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `notebooks` (
	`owner` text PRIMARY KEY NOT NULL,
	`payload` text NOT NULL,
	`version` integer NOT NULL,
	`updated_at` text NOT NULL
);
