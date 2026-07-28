
-- HOWARD HIGH SCHOOL - DYNAMIC PORTAL SCHEMA v1.0
-- MySQL / PostgreSQL compatible (InnoDB)
-- Motto: Godliness and Good Learning

CREATE TABLE users (
  id CHAR(36) PRIMARY KEY,
  role ENUM('super_admin','school_admin','staff','teacher','bursar','parent','student') NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20),
  whatsapp VARCHAR(20),
  password_hash VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE students (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) UNIQUE,
  admission_no VARCHAR(20) UNIQUE NOT NULL, -- e.g HHS/2026/0160
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  dob DATE,
  gender ENUM('M','F'),
  house ENUM('Falcon','Osprey','Harrier','Hawk') NOT NULL,
  form ENUM('1','2','3','4','5','6') NOT NULL,
  class_stream VARCHAR(10),
  enrollment_year YEAR,
  status ENUM('applied','shortlisted','admitted','active','suspended','alumni','dismissed') DEFAULT 'active',
  dorm_room VARCHAR(20),
  photo_url VARCHAR(500),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE parents (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) UNIQUE,
  national_id VARCHAR(50),
  full_name VARCHAR(200),
  relationship ENUM('father','mother','guardian'),
  occupation VARCHAR(100),
  address TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE parent_student_link (
  parent_id CHAR(36),
  student_id CHAR(36),
  is_primary BOOLEAN DEFAULT FALSE,
  PRIMARY KEY(parent_id, student_id),
  FOREIGN KEY(parent_id) REFERENCES parents(id),
  FOREIGN KEY(student_id) REFERENCES students(id)
);

CREATE TABLE staff (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) UNIQUE,
  staff_no VARCHAR(20) UNIQUE,
  department ENUM('administration','academics','boarding','sports','chaplaincy','bursary','maintenance'),
  designation VARCHAR(100), -- Headmaster, HOD Sciences etc
  qualification TEXT,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE subjects (
  id CHAR(36) PRIMARY KEY,
  code VARCHAR(20) UNIQUE, -- MATH, BIO
  name VARCHAR(100),
  category ENUM('O-Level','A-Level','both')
);

CREATE TABLE classes (
  id CHAR(36) PRIMARY KEY,
  form VARCHAR(2),
  stream VARCHAR(10),
  class_teacher_id CHAR(36),
  academic_year YEAR,
  FOREIGN KEY(class_teacher_id) REFERENCES staff(id)
);

CREATE TABLE enrollments (
  id CHAR(36) PRIMARY KEY,
  student_id CHAR(36),
  class_id CHAR(36),
  subject_id CHAR(36),
  academic_year YEAR,
  FOREIGN KEY(student_id) REFERENCES students(id)
);

-- RESULTS PORTAL
CREATE TABLE exam_sessions (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(100), -- ZIMSEC Nov 2025, Mid-Year 2026
  type ENUM('internal','zimsec_o','zimsec_a','mock'),
  year YEAR,
  term TINYINT
);

CREATE TABLE results (
  id CHAR(36) PRIMARY KEY,
  student_id CHAR(36),
  session_id CHAR(36),
  subject_id CHAR(36),
  mark DECIMAL(5,2),
  grade CHAR(2), -- A,B,C
  points TINYINT,
  comment TEXT,
  teacher_id CHAR(36),
  is_published BOOLEAN DEFAULT FALSE,
  FOREIGN KEY(student_id) REFERENCES students(id),
  FOREIGN KEY(session_id) REFERENCES exam_sessions(id)
);

-- FEES PORTAL
CREATE TABLE fee_structures (
  id CHAR(36) PRIMARY KEY,
  form VARCHAR(2),
  term TINYINT,
  year YEAR,
  amount_usd DECIMAL(10,2) NOT NULL, -- 595.00
  description VARCHAR(255)
);

CREATE TABLE invoices (
  id CHAR(36) PRIMARY KEY,
  student_id CHAR(36),
  fee_structure_id CHAR(36),
  total_usd DECIMAL(10,2),
  balance_usd DECIMAL(10,2),
  due_date DATE,
  status ENUM('unpaid','partial','paid','overdue') DEFAULT 'unpaid',
  FOREIGN KEY(student_id) REFERENCES students(id)
);

CREATE TABLE payments (
  id CHAR(36) PRIMARY KEY,
  invoice_id CHAR(36),
  amount_usd DECIMAL(10,2),
  method ENUM('cash','zipit','innbucks','bank','usd'),
  reference VARCHAR(100),
  receipt_no VARCHAR(50) UNIQUE,
  paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  verified_by CHAR(36), -- bursar id
  FOREIGN KEY(invoice_id) REFERENCES invoices(id)
);

-- BURSARY / SCHOLARSHIP
CREATE TABLE bursaries (
  id CHAR(36) PRIMARY KEY,
  student_id CHAR(36),
  sponsor ENUM('salvation_army','government','private'),
  type VARCHAR(100),
  coverage_percent TINYINT,
  amount_usd DECIMAL(10,2),
  status ENUM('applied','approved','rejected'),
  FOREIGN KEY(student_id) REFERENCES students(id)
);

-- COMMUNICATION
CREATE TABLE announcements (
  id CHAR(36) PRIMARY KEY,
  title VARCHAR(200),
  body TEXT,
  audience ENUM('all','students','parents','staff','form'),
  audience_value VARCHAR(20), -- e.g form 1
  created_by CHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE disciplinary_logs (
  id CHAR(36) PRIMARY KEY,
  student_id CHAR(36),
  incident_date DATE,
  type VARCHAR(100),
  description TEXT,
  action_taken TEXT,
  recorded_by CHAR(36)
);

-- INDEXES
CREATE INDEX idx_students_admission ON students(admission_no);
CREATE INDEX idx_results_student_session ON results(student_id, session_id);
CREATE INDEX idx_invoices_student ON invoices(student_id);
