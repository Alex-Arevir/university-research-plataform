-- Ejecutar en una base nueva. No elimina tablas ni datos existentes.
CREATE TABLE IF NOT EXISTS users (
 id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(150) NOT NULL, username VARCHAR(80) NOT NULL UNIQUE,
 email VARCHAR(254) NULL, password_hash VARCHAR(255) NOT NULL,
 role ENUM('student','researcher','evaluator','coordinator') NOT NULL,
 status ENUM('active','inactive') NOT NULL DEFAULT 'active',
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS user_sessions (
 id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, token_hash CHAR(64) NOT NULL,
 created_at DATETIME NOT NULL, last_activity_at DATETIME NOT NULL, expires_at DATETIME NOT NULL, revoked_at DATETIME NULL,
 INDEX(user_id), FOREIGN KEY(user_id) REFERENCES users(id)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS proposals (
 id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(250) NOT NULL, description TEXT NOT NULL, objectives TEXT NOT NULL,
 author_id INT NOT NULL, responsible_researcher_id INT NOT NULL,
 status VARCHAR(50) NOT NULL, is_archived TINYINT NOT NULL DEFAULT 0, status_before_archive VARCHAR(50) NULL,
 correction_pending_resubmit TINYINT NOT NULL DEFAULT 0,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 FOREIGN KEY(author_id) REFERENCES users(id), FOREIGN KEY(responsible_researcher_id) REFERENCES users(id)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS proposal_history (
 id INT AUTO_INCREMENT PRIMARY KEY, proposal_id INT NOT NULL, actor_id INT NOT NULL, action VARCHAR(80) NOT NULL,
 previous_status VARCHAR(50) NULL, new_status VARCHAR(50) NOT NULL, details TEXT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(proposal_id) REFERENCES proposals(id), FOREIGN KEY(actor_id) REFERENCES users(id)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS proposal_reviews (
 id INT AUTO_INCREMENT PRIMARY KEY, proposal_id INT NOT NULL, researcher_id INT NOT NULL, decision VARCHAR(30) NOT NULL,
 observations TEXT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(proposal_id) REFERENCES proposals(id), FOREIGN KEY(researcher_id) REFERENCES users(id)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS evaluation_assignments (
 id INT AUTO_INCREMENT PRIMARY KEY, proposal_id INT NOT NULL, evaluator_id INT NOT NULL, assigned_by INT NOT NULL,
 is_active TINYINT NOT NULL DEFAULT 1, assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(proposal_id) REFERENCES proposals(id), FOREIGN KEY(evaluator_id) REFERENCES users(id), FOREIGN KEY(assigned_by) REFERENCES users(id)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS evaluations (
 id INT AUTO_INCREMENT PRIMARY KEY, proposal_id INT NOT NULL, evaluator_id INT NOT NULL, decision VARCHAR(30) NOT NULL,
 observations TEXT NOT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(proposal_id) REFERENCES proposals(id), FOREIGN KEY(evaluator_id) REFERENCES users(id)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS projects (
 id INT AUTO_INCREMENT PRIMARY KEY, proposal_id INT NOT NULL UNIQUE, title VARCHAR(250) NOT NULL,
 responsible_researcher_id INT NOT NULL, status ENUM('active','closing','finalized') NOT NULL DEFAULT 'active',
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 FOREIGN KEY(proposal_id) REFERENCES proposals(id), FOREIGN KEY(responsible_researcher_id) REFERENCES users(id)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS participants (
 id INT AUTO_INCREMENT PRIMARY KEY, project_id INT NOT NULL, user_id INT NOT NULL, is_active TINYINT NOT NULL DEFAULT 1,
 joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, removed_at DATETIME NULL, UNIQUE(project_id,user_id),
 FOREIGN KEY(project_id) REFERENCES projects(id), FOREIGN KEY(user_id) REFERENCES users(id)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS activities (
 id INT AUTO_INCREMENT PRIMARY KEY, project_id INT NOT NULL, description TEXT NOT NULL, participant_id INT NOT NULL,
 deadline DATE NOT NULL, status ENUM('pending','in_progress','in_review','completed') NOT NULL DEFAULT 'pending', observations TEXT NULL,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 FOREIGN KEY(project_id) REFERENCES projects(id), FOREIGN KEY(participant_id) REFERENCES users(id)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS milestones (
 id INT AUTO_INCREMENT PRIMARY KEY, project_id INT NOT NULL, description TEXT NOT NULL, target_date DATE NOT NULL,
 status ENUM('pending','achieved') NOT NULL DEFAULT 'pending', created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(project_id) REFERENCES projects(id)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS milestone_activities (
 milestone_id INT NOT NULL, activity_id INT NOT NULL, PRIMARY KEY(milestone_id,activity_id),
 FOREIGN KEY(milestone_id) REFERENCES milestones(id), FOREIGN KEY(activity_id) REFERENCES activities(id)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS documents (
 id INT AUTO_INCREMENT PRIMARY KEY, project_id INT NULL, activity_id INT NULL, title VARCHAR(250) NOT NULL,
 kind ENUM('project','evidence','institutional') NOT NULL, blocked TINYINT NOT NULL DEFAULT 0, restricted TINYINT NOT NULL DEFAULT 0,
 deleted_at DATETIME NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(project_id) REFERENCES projects(id), FOREIGN KEY(activity_id) REFERENCES activities(id)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS document_versions (
 id INT AUTO_INCREMENT PRIMARY KEY, document_id INT NOT NULL, version INT NOT NULL, filename VARCHAR(255) NOT NULL,
 mime VARCHAR(100) NOT NULL, content LONGBLOB NOT NULL, text_content MEDIUMTEXT NULL, uploaded_by INT NOT NULL,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(document_id,version),
 FOREIGN KEY(document_id) REFERENCES documents(id), FOREIGN KEY(uploaded_by) REFERENCES users(id)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS closures (
 id INT AUTO_INCREMENT PRIMARY KEY, project_id INT NOT NULL, requested_by INT NOT NULL, observations TEXT NULL,
 status ENUM('pending','approved','changes_requested') NOT NULL DEFAULT 'pending', review_observations TEXT NULL,
 reviewed_by INT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, reviewed_at DATETIME NULL,
 FOREIGN KEY(project_id) REFERENCES projects(id), FOREIGN KEY(requested_by) REFERENCES users(id), FOREIGN KEY(reviewed_by) REFERENCES users(id)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS project_history (
 id INT AUTO_INCREMENT PRIMARY KEY, project_id INT NOT NULL, actor_id INT NOT NULL, entity VARCHAR(40) NOT NULL,
 entity_id INT NOT NULL, action VARCHAR(80) NOT NULL, details TEXT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(project_id) REFERENCES projects(id), FOREIGN KEY(actor_id) REFERENCES users(id)
) ENGINE=InnoDB;
