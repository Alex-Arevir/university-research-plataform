-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 15-10-2026 a las 19:10:57
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `university_research_platform`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `activities`
--

CREATE TABLE `activities` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED NOT NULL,
  `description` text NOT NULL,
  `participant_id` bigint(20) UNSIGNED NOT NULL,
  `deadline` date NOT NULL,
  `status` enum('pending','in_progress','in_review','completed') NOT NULL DEFAULT 'pending',
  `created_by` bigint(20) UNSIGNED NOT NULL,
  `accepted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `activity_history`
--

CREATE TABLE `activity_history` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `activity_id` bigint(20) UNSIGNED NOT NULL,
  `actor_id` bigint(20) UNSIGNED DEFAULT NULL,
  `action` varchar(80) NOT NULL,
  `previous_status` varchar(40) DEFAULT NULL,
  `new_status` varchar(40) DEFAULT NULL,
  `previous_participant_id` bigint(20) UNSIGNED DEFAULT NULL,
  `new_participant_id` bigint(20) UNSIGNED DEFAULT NULL,
  `observations` text DEFAULT NULL,
  `details` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `assistant_queries`
--

CREATE TABLE `assistant_queries` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED DEFAULT NULL,
  `action` enum('ask','summarize','explain','locate') NOT NULL DEFAULT 'ask',
  `question` text NOT NULL,
  `answer` longtext DEFAULT NULL,
  `insufficient_information` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `assistant_query_sources`
--

CREATE TABLE `assistant_query_sources` (
  `query_id` bigint(20) UNSIGNED NOT NULL,
  `chunk_id` bigint(20) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `documents`
--

CREATE TABLE `documents` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED NOT NULL,
  `title` varchar(250) NOT NULL,
  `uploaded_by` bigint(20) UNSIGNED NOT NULL,
  `is_blocked` tinyint(1) NOT NULL DEFAULT 0,
  `is_restricted` tinyint(1) NOT NULL DEFAULT 0,
  `deleted_at` datetime DEFAULT NULL,
  `deleted_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `document_versions`
--

CREATE TABLE `document_versions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `document_id` bigint(20) UNSIGNED NOT NULL,
  `version_number` int(10) UNSIGNED NOT NULL,
  `uploaded_by` bigint(20) UNSIGNED NOT NULL,
  `version_note` text DEFAULT NULL,
  `original_filename` varchar(255) NOT NULL,
  `storage_path` varchar(500) NOT NULL,
  `mime_type` varchar(150) NOT NULL,
  `file_size` bigint(20) UNSIGNED NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `evaluations`
--

CREATE TABLE `evaluations` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `assignment_id` bigint(20) UNSIGNED NOT NULL,
  `decision` enum('approved','changes_requested','rejected') NOT NULL,
  `observations` text NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `evaluation_assignments`
--

CREATE TABLE `evaluation_assignments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `proposal_id` bigint(20) UNSIGNED NOT NULL,
  `evaluator_id` bigint(20) UNSIGNED NOT NULL,
  `assigned_by` bigint(20) UNSIGNED NOT NULL,
  `assigned_at` datetime NOT NULL DEFAULT current_timestamp(),
  `is_active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `evidence`
--

CREATE TABLE `evidence` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `activity_id` bigint(20) UNSIGNED NOT NULL,
  `uploaded_by` bigint(20) UNSIGNED NOT NULL,
  `description` text DEFAULT NULL,
  `original_filename` varchar(255) NOT NULL,
  `storage_path` varchar(500) NOT NULL,
  `mime_type` varchar(150) NOT NULL,
  `file_size` bigint(20) UNSIGNED NOT NULL,
  `uploaded_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `institutional_documents`
--

CREATE TABLE `institutional_documents` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `title` varchar(250) NOT NULL,
  `version_number` int(10) UNSIGNED NOT NULL DEFAULT 1,
  `original_filename` varchar(255) NOT NULL,
  `storage_path` varchar(500) NOT NULL,
  `mime_type` varchar(150) NOT NULL,
  `file_size` bigint(20) UNSIGNED NOT NULL,
  `processing_status` enum('processing','ready','failed') NOT NULL DEFAULT 'processing',
  `processing_error` text DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `uploaded_by` bigint(20) UNSIGNED NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `knowledge_chunks`
--

CREATE TABLE `knowledge_chunks` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `institutional_document_id` bigint(20) UNSIGNED DEFAULT NULL,
  `document_version_id` bigint(20) UNSIGNED DEFAULT NULL,
  `chunk_number` int(10) UNSIGNED NOT NULL,
  `content` longtext NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `milestones`
--

CREATE TABLE `milestones` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED NOT NULL,
  `description` text NOT NULL,
  `target_date` date NOT NULL,
  `status` enum('pending','achieved') NOT NULL DEFAULT 'pending',
  `created_by` bigint(20) UNSIGNED NOT NULL,
  `achieved_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `milestone_activities`
--

CREATE TABLE `milestone_activities` (
  `milestone_id` bigint(20) UNSIGNED NOT NULL,
  `activity_id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `projects`
--

CREATE TABLE `projects` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `proposal_id` bigint(20) UNSIGNED NOT NULL,
  `responsible_researcher_id` bigint(20) UNSIGNED NOT NULL,
  `status` enum('active','closing','completed') NOT NULL DEFAULT 'active',
  `started_at` datetime NOT NULL DEFAULT current_timestamp(),
  `completed_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `project_closures`
--

CREATE TABLE `project_closures` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED NOT NULL,
  `requested_by` bigint(20) UNSIGNED NOT NULL,
  `request_observations` text DEFAULT NULL,
  `status` enum('pending','approved','changes_requested') NOT NULL DEFAULT 'pending',
  `reviewed_by` bigint(20) UNSIGNED DEFAULT NULL,
  `review_observations` text DEFAULT NULL,
  `requested_at` datetime NOT NULL DEFAULT current_timestamp(),
  `reviewed_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `project_history`
--

CREATE TABLE `project_history` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED NOT NULL,
  `actor_id` bigint(20) UNSIGNED DEFAULT NULL,
  `action` varchar(80) NOT NULL,
  `previous_value` text DEFAULT NULL,
  `new_value` text DEFAULT NULL,
  `details` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `project_participants`
--

CREATE TABLE `project_participants` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `joined_at` datetime NOT NULL DEFAULT current_timestamp(),
  `removed_at` datetime DEFAULT NULL,
  `added_by` bigint(20) UNSIGNED DEFAULT NULL,
  `removed_by` bigint(20) UNSIGNED DEFAULT NULL,
  `active_user_id` bigint(20) UNSIGNED GENERATED ALWAYS AS (case when `removed_at` is null then `user_id` else NULL end) STORED
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `proposals`
--

CREATE TABLE `proposals` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `title` varchar(250) NOT NULL,
  `description` text NOT NULL,
  `objectives` text NOT NULL,
  `author_id` bigint(20) UNSIGNED NOT NULL,
  `responsible_researcher_id` bigint(20) UNSIGNED NOT NULL,
  `status` enum('pending_researcher_review','pending_coordinator','under_evaluation','changes_requested_researcher','changes_requested_evaluator','rejected','approved') NOT NULL,
  `is_archived` tinyint(1) NOT NULL DEFAULT 0,
  `status_before_archive` varchar(50) DEFAULT NULL,
  `correction_pending_resubmit` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `proposal_history`
--

CREATE TABLE `proposal_history` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `proposal_id` bigint(20) UNSIGNED NOT NULL,
  `actor_id` bigint(20) UNSIGNED DEFAULT NULL,
  `action` varchar(80) NOT NULL,
  `previous_status` varchar(50) DEFAULT NULL,
  `new_status` varchar(50) DEFAULT NULL,
  `details` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `proposal_reviews`
--

CREATE TABLE `proposal_reviews` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `proposal_id` bigint(20) UNSIGNED NOT NULL,
  `researcher_id` bigint(20) UNSIGNED NOT NULL,
  `decision` enum('approved','changes_requested','rejected') NOT NULL,
  `observations` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(150) NOT NULL,
  `username` varchar(80) NOT NULL,
  `email` varchar(190) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('student','researcher','evaluator','coordinator') NOT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `user_sessions`
--

CREATE TABLE `user_sessions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `token_hash` char(64) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `last_activity_at` datetime NOT NULL DEFAULT current_timestamp(),
  `expires_at` datetime NOT NULL,
  `revoked_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `v_activity_deadlines`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `v_activity_deadlines` (
`activity_id` bigint(20) unsigned
,`project_id` bigint(20) unsigned
,`participant_id` bigint(20) unsigned
,`deadline` date
,`status` enum('pending','in_progress','in_review','completed')
,`deadline_status` varchar(13)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `v_project_progress`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `v_project_progress` (
`project_id` bigint(20) unsigned
,`total_activities` bigint(21)
,`completed_activities` decimal(22,0)
,`progress_percentage` decimal(28,2)
);

-- --------------------------------------------------------

--
-- Estructura para la vista `v_activity_deadlines`
--
DROP TABLE IF EXISTS `v_activity_deadlines`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_activity_deadlines`  AS SELECT `a`.`id` AS `activity_id`, `a`.`project_id` AS `project_id`, `a`.`participant_id` AS `participant_id`, `a`.`deadline` AS `deadline`, `a`.`status` AS `status`, CASE WHEN `a`.`status` = 'completed' THEN NULL WHEN `a`.`deadline` < curdate() THEN 'overdue' WHEN `a`.`deadline` <= curdate() + interval 3 day THEN 'near_deadline' ELSE 'normal' END AS `deadline_status` FROM `activities` AS `a` ;

-- --------------------------------------------------------

--
-- Estructura para la vista `v_project_progress`
--
DROP TABLE IF EXISTS `v_project_progress`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_project_progress`  AS SELECT `p`.`id` AS `project_id`, count(`a`.`id`) AS `total_activities`, coalesce(sum(case when `a`.`status` = 'completed' and `a`.`accepted_at` is not null then 1 else 0 end),0) AS `completed_activities`, CASE WHEN count(`a`.`id`) = 0 THEN 0.00 ELSE round(100.0 * sum(case when `a`.`status` = 'completed' and `a`.`accepted_at` is not null then 1 else 0 end) / count(`a`.`id`),2) END AS `progress_percentage` FROM (`projects` `p` left join `activities` `a` on(`a`.`project_id` = `p`.`id`)) GROUP BY `p`.`id` ;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `activities`
--
ALTER TABLE `activities`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_activity_project` (`id`,`project_id`),
  ADD KEY `idx_activities_project_status` (`project_id`,`status`),
  ADD KEY `idx_activities_participant` (`participant_id`,`status`),
  ADD KEY `idx_activities_deadline` (`deadline`),
  ADD KEY `created_by` (`created_by`);

--
-- Indices de la tabla `activity_history`
--
ALTER TABLE `activity_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_activity_history` (`activity_id`,`created_at`),
  ADD KEY `actor_id` (`actor_id`),
  ADD KEY `previous_participant_id` (`previous_participant_id`),
  ADD KEY `new_participant_id` (`new_participant_id`);

--
-- Indices de la tabla `assistant_queries`
--
ALTER TABLE `assistant_queries`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_queries_user` (`user_id`,`created_at`),
  ADD KEY `project_id` (`project_id`);

--
-- Indices de la tabla `assistant_query_sources`
--
ALTER TABLE `assistant_query_sources`
  ADD PRIMARY KEY (`query_id`,`chunk_id`),
  ADD KEY `chunk_id` (`chunk_id`);

--
-- Indices de la tabla `documents`
--
ALTER TABLE `documents`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_documents_project` (`project_id`,`deleted_at`,`is_restricted`),
  ADD KEY `uploaded_by` (`uploaded_by`),
  ADD KEY `deleted_by` (`deleted_by`);

--
-- Indices de la tabla `document_versions`
--
ALTER TABLE `document_versions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_document_version` (`document_id`,`version_number`),
  ADD KEY `idx_versions_document` (`document_id`,`created_at`),
  ADD KEY `uploaded_by` (`uploaded_by`);

--
-- Indices de la tabla `evaluations`
--
ALTER TABLE `evaluations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_evaluations_assignment` (`assignment_id`,`created_at`);

--
-- Indices de la tabla `evaluation_assignments`
--
ALTER TABLE `evaluation_assignments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_assignments_proposal` (`proposal_id`,`is_active`),
  ADD KEY `idx_assignments_evaluator` (`evaluator_id`,`is_active`),
  ADD KEY `assigned_by` (`assigned_by`);

--
-- Indices de la tabla `evidence`
--
ALTER TABLE `evidence`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_evidence_activity` (`activity_id`),
  ADD KEY `uploaded_by` (`uploaded_by`);

--
-- Indices de la tabla `institutional_documents`
--
ALTER TABLE `institutional_documents`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_institutional_active` (`is_active`,`processing_status`),
  ADD KEY `uploaded_by` (`uploaded_by`);

--
-- Indices de la tabla `knowledge_chunks`
--
ALTER TABLE `knowledge_chunks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_chunks_institutional` (`institutional_document_id`,`chunk_number`),
  ADD KEY `idx_chunks_document` (`document_version_id`,`chunk_number`);
ALTER TABLE `knowledge_chunks` ADD FULLTEXT KEY `ft_chunk_content` (`content`);

--
-- Indices de la tabla `milestones`
--
ALTER TABLE `milestones`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_milestone_project` (`id`,`project_id`),
  ADD KEY `idx_milestone_project_status` (`project_id`,`status`),
  ADD KEY `created_by` (`created_by`);

--
-- Indices de la tabla `milestone_activities`
--
ALTER TABLE `milestone_activities`
  ADD PRIMARY KEY (`milestone_id`,`activity_id`),
  ADD KEY `idx_ma_activity_project` (`activity_id`,`project_id`),
  ADD KEY `milestone_id` (`milestone_id`,`project_id`);

--
-- Indices de la tabla `projects`
--
ALTER TABLE `projects`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `proposal_id` (`proposal_id`),
  ADD KEY `idx_projects_researcher` (`responsible_researcher_id`),
  ADD KEY `idx_projects_status` (`status`);

--
-- Indices de la tabla `project_closures`
--
ALTER TABLE `project_closures`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_closures_project` (`project_id`,`status`),
  ADD KEY `requested_by` (`requested_by`),
  ADD KEY `reviewed_by` (`reviewed_by`);

--
-- Indices de la tabla `project_history`
--
ALTER TABLE `project_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_project_history` (`project_id`,`created_at`),
  ADD KEY `actor_id` (`actor_id`);

--
-- Indices de la tabla `project_participants`
--
ALTER TABLE `project_participants`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_active_participant` (`project_id`,`active_user_id`),
  ADD KEY `idx_participants_user` (`user_id`,`removed_at`),
  ADD KEY `added_by` (`added_by`),
  ADD KEY `removed_by` (`removed_by`);

--
-- Indices de la tabla `proposals`
--
ALTER TABLE `proposals`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_proposals_author` (`author_id`),
  ADD KEY `idx_proposals_researcher` (`responsible_researcher_id`),
  ADD KEY `idx_proposals_status_archive` (`status`,`is_archived`);

--
-- Indices de la tabla `proposal_history`
--
ALTER TABLE `proposal_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_proposal_history` (`proposal_id`,`created_at`),
  ADD KEY `actor_id` (`actor_id`);

--
-- Indices de la tabla `proposal_reviews`
--
ALTER TABLE `proposal_reviews`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_reviews_proposal` (`proposal_id`,`created_at`),
  ADD KEY `researcher_id` (`researcher_id`);

--
-- Indices de la tabla `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD KEY `idx_users_role_status` (`role`,`status`),
  ADD KEY `idx_users_name` (`name`);

--
-- Indices de la tabla `user_sessions`
--
ALTER TABLE `user_sessions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `token_hash` (`token_hash`),
  ADD KEY `idx_sessions_user` (`user_id`),
  ADD KEY `idx_sessions_expiration` (`expires_at`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `activities`
--
ALTER TABLE `activities`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `activity_history`
--
ALTER TABLE `activity_history`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `assistant_queries`
--
ALTER TABLE `assistant_queries`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `documents`
--
ALTER TABLE `documents`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `document_versions`
--
ALTER TABLE `document_versions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `evaluations`
--
ALTER TABLE `evaluations`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `evaluation_assignments`
--
ALTER TABLE `evaluation_assignments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `evidence`
--
ALTER TABLE `evidence`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `institutional_documents`
--
ALTER TABLE `institutional_documents`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `knowledge_chunks`
--
ALTER TABLE `knowledge_chunks`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `milestones`
--
ALTER TABLE `milestones`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `projects`
--
ALTER TABLE `projects`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `project_closures`
--
ALTER TABLE `project_closures`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `project_history`
--
ALTER TABLE `project_history`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `project_participants`
--
ALTER TABLE `project_participants`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `proposals`
--
ALTER TABLE `proposals`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `proposal_history`
--
ALTER TABLE `proposal_history`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `proposal_reviews`
--
ALTER TABLE `proposal_reviews`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `user_sessions`
--
ALTER TABLE `user_sessions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `activities`
--
ALTER TABLE `activities`
  ADD CONSTRAINT `activities_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`),
  ADD CONSTRAINT `activities_ibfk_2` FOREIGN KEY (`participant_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `activities_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`);

--
-- Filtros para la tabla `activity_history`
--
ALTER TABLE `activity_history`
  ADD CONSTRAINT `activity_history_ibfk_1` FOREIGN KEY (`activity_id`) REFERENCES `activities` (`id`),
  ADD CONSTRAINT `activity_history_ibfk_2` FOREIGN KEY (`actor_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `activity_history_ibfk_3` FOREIGN KEY (`previous_participant_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `activity_history_ibfk_4` FOREIGN KEY (`new_participant_id`) REFERENCES `users` (`id`);

--
-- Filtros para la tabla `assistant_queries`
--
ALTER TABLE `assistant_queries`
  ADD CONSTRAINT `assistant_queries_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `assistant_queries_ibfk_2` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`);

--
-- Filtros para la tabla `assistant_query_sources`
--
ALTER TABLE `assistant_query_sources`
  ADD CONSTRAINT `assistant_query_sources_ibfk_1` FOREIGN KEY (`query_id`) REFERENCES `assistant_queries` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `assistant_query_sources_ibfk_2` FOREIGN KEY (`chunk_id`) REFERENCES `knowledge_chunks` (`id`);

--
-- Filtros para la tabla `documents`
--
ALTER TABLE `documents`
  ADD CONSTRAINT `documents_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`),
  ADD CONSTRAINT `documents_ibfk_2` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `documents_ibfk_3` FOREIGN KEY (`deleted_by`) REFERENCES `users` (`id`);

--
-- Filtros para la tabla `document_versions`
--
ALTER TABLE `document_versions`
  ADD CONSTRAINT `document_versions_ibfk_1` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`),
  ADD CONSTRAINT `document_versions_ibfk_2` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`);

--
-- Filtros para la tabla `evaluations`
--
ALTER TABLE `evaluations`
  ADD CONSTRAINT `evaluations_ibfk_1` FOREIGN KEY (`assignment_id`) REFERENCES `evaluation_assignments` (`id`);

--
-- Filtros para la tabla `evaluation_assignments`
--
ALTER TABLE `evaluation_assignments`
  ADD CONSTRAINT `evaluation_assignments_ibfk_1` FOREIGN KEY (`proposal_id`) REFERENCES `proposals` (`id`),
  ADD CONSTRAINT `evaluation_assignments_ibfk_2` FOREIGN KEY (`evaluator_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `evaluation_assignments_ibfk_3` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`);

--
-- Filtros para la tabla `evidence`
--
ALTER TABLE `evidence`
  ADD CONSTRAINT `evidence_ibfk_1` FOREIGN KEY (`activity_id`) REFERENCES `activities` (`id`),
  ADD CONSTRAINT `evidence_ibfk_2` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`);

--
-- Filtros para la tabla `institutional_documents`
--
ALTER TABLE `institutional_documents`
  ADD CONSTRAINT `institutional_documents_ibfk_1` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`);

--
-- Filtros para la tabla `knowledge_chunks`
--
ALTER TABLE `knowledge_chunks`
  ADD CONSTRAINT `knowledge_chunks_ibfk_1` FOREIGN KEY (`institutional_document_id`) REFERENCES `institutional_documents` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `knowledge_chunks_ibfk_2` FOREIGN KEY (`document_version_id`) REFERENCES `document_versions` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `milestones`
--
ALTER TABLE `milestones`
  ADD CONSTRAINT `milestones_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`),
  ADD CONSTRAINT `milestones_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`);

--
-- Filtros para la tabla `milestone_activities`
--
ALTER TABLE `milestone_activities`
  ADD CONSTRAINT `milestone_activities_ibfk_1` FOREIGN KEY (`milestone_id`,`project_id`) REFERENCES `milestones` (`id`, `project_id`),
  ADD CONSTRAINT `milestone_activities_ibfk_2` FOREIGN KEY (`activity_id`,`project_id`) REFERENCES `activities` (`id`, `project_id`);

--
-- Filtros para la tabla `projects`
--
ALTER TABLE `projects`
  ADD CONSTRAINT `projects_ibfk_1` FOREIGN KEY (`proposal_id`) REFERENCES `proposals` (`id`),
  ADD CONSTRAINT `projects_ibfk_2` FOREIGN KEY (`responsible_researcher_id`) REFERENCES `users` (`id`);

--
-- Filtros para la tabla `project_closures`
--
ALTER TABLE `project_closures`
  ADD CONSTRAINT `project_closures_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`),
  ADD CONSTRAINT `project_closures_ibfk_2` FOREIGN KEY (`requested_by`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `project_closures_ibfk_3` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`);

--
-- Filtros para la tabla `project_history`
--
ALTER TABLE `project_history`
  ADD CONSTRAINT `project_history_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`),
  ADD CONSTRAINT `project_history_ibfk_2` FOREIGN KEY (`actor_id`) REFERENCES `users` (`id`);

--
-- Filtros para la tabla `project_participants`
--
ALTER TABLE `project_participants`
  ADD CONSTRAINT `project_participants_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`),
  ADD CONSTRAINT `project_participants_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `project_participants_ibfk_3` FOREIGN KEY (`added_by`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `project_participants_ibfk_4` FOREIGN KEY (`removed_by`) REFERENCES `users` (`id`);

--
-- Filtros para la tabla `proposals`
--
ALTER TABLE `proposals`
  ADD CONSTRAINT `proposals_ibfk_1` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `proposals_ibfk_2` FOREIGN KEY (`responsible_researcher_id`) REFERENCES `users` (`id`);

--
-- Filtros para la tabla `proposal_history`
--
ALTER TABLE `proposal_history`
  ADD CONSTRAINT `proposal_history_ibfk_1` FOREIGN KEY (`proposal_id`) REFERENCES `proposals` (`id`),
  ADD CONSTRAINT `proposal_history_ibfk_2` FOREIGN KEY (`actor_id`) REFERENCES `users` (`id`);

--
-- Filtros para la tabla `proposal_reviews`
--
ALTER TABLE `proposal_reviews`
  ADD CONSTRAINT `proposal_reviews_ibfk_1` FOREIGN KEY (`proposal_id`) REFERENCES `proposals` (`id`),
  ADD CONSTRAINT `proposal_reviews_ibfk_2` FOREIGN KEY (`researcher_id`) REFERENCES `users` (`id`);

--
-- Filtros para la tabla `user_sessions`
--
ALTER TABLE `user_sessions`
  ADD CONSTRAINT `user_sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
