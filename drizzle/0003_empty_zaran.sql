CREATE TABLE `ai_user_usage` (
	`owner` text NOT NULL,
	`day` text NOT NULL,
	`requests` integer NOT NULL,
	PRIMARY KEY(`owner`, `day`)
);
