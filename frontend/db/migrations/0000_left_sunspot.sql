CREATE TABLE `appointments` (
	`id` text PRIMARY KEY NOT NULL,
	`lead_id` text NOT NULL,
	`calendar_event_id` text,
	`scheduled_at` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` text PRIMARY KEY NOT NULL,
	`lead_id` text NOT NULL,
	`sender` text NOT NULL,
	`direction` text NOT NULL,
	`message` text NOT NULL,
	`channel` text DEFAULT 'email' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`email` text NOT NULL,
	`phone` text,
	`source` text DEFAULT 'web_form' NOT NULL,
	`original_message` text,
	`intent` text,
	`requirements` text,
	`budget` real,
	`currency` text,
	`timeline` text,
	`urgency` text,
	`lead_score` integer,
	`qualification` text,
	`status` text DEFAULT 'NEW' NOT NULL,
	`next_action` text,
	`follow_up_stage` text DEFAULT 'none' NOT NULL,
	`assigned_agent` text,
	`paused` integer DEFAULT false NOT NULL,
	`last_contact_at` text,
	`last_reply_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `workflow_events` (
	`id` text PRIMARY KEY NOT NULL,
	`lead_id` text,
	`workflow` text NOT NULL,
	`action` text NOT NULL,
	`status` text DEFAULT 'ok' NOT NULL,
	`detail` text,
	`error` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE no action
);
