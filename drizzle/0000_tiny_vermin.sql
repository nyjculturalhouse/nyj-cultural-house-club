CREATE TABLE `programs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`externalId` varchar(128) NOT NULL,
	`title` varchar(255) NOT NULL,
	`summary` text NOT NULL,
	`description` text,
	`category` varchar(100),
	`target` varchar(255),
	`venue` varchar(255),
	`startAt` timestamp,
	`endAt` timestamp,
	`recruitmentDeadline` timestamp,
	`recruitmentStatus` enum('upcoming','open','closing-soon','closed') NOT NULL DEFAULT 'upcoming',
	`applicationUrl` text,
	`applicationProvider` enum('nyjcf','naver','other','none') NOT NULL DEFAULT 'none',
	`contact` varchar(255),
	`preApplicationChecks` text,
	`imageUrl` text,
	`isPublished` boolean NOT NULL DEFAULT false,
	`sourceUpdatedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `programs_id` PRIMARY KEY(`id`),
	CONSTRAINT `programs_externalId_unique` UNIQUE(`externalId`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
