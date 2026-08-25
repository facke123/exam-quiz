-- ============================================================
-- 软考刷题系统 - 数据库 Schema
-- Database: exam_quiz
-- Engine: InnoDB  Charset: utf8mb4  Collation: utf8mb4_unicode_ci
-- 说明: 本文件由 MySQL 容器启动时自动执行 (挂载到 /docker-entrypoint-initdb.d)
-- ============================================================

CREATE DATABASE IF NOT EXISTS exam_quiz DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE exam_quiz;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------
-- 1. 用户表
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL COMMENT '用户名',
  email VARCHAR(100) UNIQUE COMMENT '邮箱',
  phone VARCHAR(20) UNIQUE COMMENT '手机号',
  password VARCHAR(255) NOT NULL COMMENT 'BCrypt加密密码',
  nickname VARCHAR(50) COMMENT '昵称',
  avatar VARCHAR(500) COMMENT '头像URL',
  status TINYINT DEFAULT 1 COMMENT '状态: 0-禁用 1-正常',
  vip_level TINYINT DEFAULT 0 COMMENT '会员等级: 0-免费 1-月卡 2-季卡 3-年卡',
  vip_expire_at DATETIME COMMENT '会员到期时间',
  exam_date DATE COMMENT '考试日期',
  current_subject_id BIGINT COMMENT '当前备考科目ID',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_vip (vip_level, vip_expire_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- ------------------------------------------------------------
-- 2. 管理员表
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admins (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  real_name VARCHAR(50),
  role VARCHAR(20) DEFAULT 'editor' COMMENT 'super_admin/admin/editor/operator',
  status TINYINT DEFAULT 1,
  last_login_at DATETIME,
  last_login_ip VARCHAR(50),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='管理员表';

-- ------------------------------------------------------------
-- 3. 考试科目表
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subjects (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL COMMENT '科目名称',
  code VARCHAR(50) UNIQUE NOT NULL COMMENT '科目编码',
  description TEXT,
  icon VARCHAR(500),
  sort INT DEFAULT 0,
  status TINYINT DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='考试科目表';

-- ------------------------------------------------------------
-- 4. 章节表
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chapters (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  subject_id BIGINT NOT NULL,
  parent_id BIGINT DEFAULT 0 COMMENT '父章节ID, 0为顶级',
  name VARCHAR(200) NOT NULL,
  sort INT DEFAULT 0,
  question_count INT DEFAULT 0 COMMENT '题目数量(冗余字段)',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_subject (subject_id),
  INDEX idx_parent (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='章节表';

-- ------------------------------------------------------------
-- 5. 知识点表
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS knowledge_points (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  chapter_id BIGINT NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_chapter (chapter_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='知识点表';

-- ------------------------------------------------------------
-- 6. 题目表 (5种题型: single_choice/multiple_choice/true_false/case_analysis/subjective)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS questions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  subject_id BIGINT NOT NULL COMMENT '科目ID',
  chapter_id BIGINT COMMENT '章节ID',
  knowledge_point_ids VARCHAR(500) COMMENT '知识点ID, 逗号分隔',
  type ENUM('single_choice','multiple_choice','true_false','case_analysis','subjective') NOT NULL COMMENT '题型',
  difficulty TINYINT DEFAULT 3 COMMENT '难度: 1-5',
  content TEXT NOT NULL COMMENT '题干(富文本)',
  options JSON COMMENT '选项(JSON数组, [{key:"A", content:"..."}])',
  answer TEXT COMMENT '正确答案(单选:A, 多选:ABD, 判断:true/false, 主观:参考答案)',
  analysis TEXT COMMENT '解析(富文本)',
  tags VARCHAR(500) COMMENT '标签, 逗号分隔',
  source ENUM('manual','excel','word','ai') DEFAULT 'manual' COMMENT '来源',
  ai_confidence DECIMAL(5,2) COMMENT 'AI置信度(0-100)',
  status ENUM('draft','pending','published','archived') DEFAULT 'draft' COMMENT '状态',
  correct_count INT DEFAULT 0 COMMENT '答对次数',
  wrong_count INT DEFAULT 0 COMMENT '答错次数',
  created_by BIGINT COMMENT '创建人(管理员ID)',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_subject_chapter (subject_id, chapter_id),
  INDEX idx_type (type),
  INDEX idx_status (status),
  INDEX idx_difficulty (difficulty),
  FULLTEXT INDEX ft_content (content)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='题目表';

-- ------------------------------------------------------------
-- 7. 试卷表
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS papers (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  subject_id BIGINT NOT NULL,
  name VARCHAR(200) NOT NULL,
  year INT COMMENT '年份(真题)',
  type ENUM('real','mock','practice') NOT NULL COMMENT '试卷类型',
  duration INT COMMENT '考试时长(分钟)',
  total_score INT DEFAULT 100 COMMENT '总分',
  question_ids JSON COMMENT '题目ID列表',
  pass_score INT COMMENT '及格分',
  status TINYINT DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_subject_type (subject_id, type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='试卷表';

-- ------------------------------------------------------------
-- 8. 做题记录表
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS practice_records (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  subject_id BIGINT NOT NULL,
  mode ENUM('chapter','real','mock','daily','case','free') NOT NULL COMMENT '练习模式',
  paper_id BIGINT COMMENT '试卷ID',
  chapter_id BIGINT COMMENT '章节ID(章节练习时)',
  total_questions INT NOT NULL COMMENT '总题数',
  answered_questions INT DEFAULT 0 COMMENT '已答题数',
  correct_count INT DEFAULT 0 COMMENT '答对题数',
  score INT COMMENT '得分',
  duration INT COMMENT '用时(秒)',
  status ENUM('ongoing','completed','abandoned') DEFAULT 'ongoing',
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  submitted_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_mode (user_id, mode),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='做题记录表';

-- ------------------------------------------------------------
-- 9. 做题答题表
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS practice_answers (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  record_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  question_id BIGINT NOT NULL,
  user_answer TEXT COMMENT '用户答案',
  is_correct TINYINT COMMENT '是否正确: 0-错 1-对 null-主观题未判分',
  time_cost INT COMMENT '用时(秒)',
  marked TINYINT DEFAULT 0 COMMENT '是否标记',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_record (record_id),
  INDEX idx_user_question (user_id, question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='做题答题表';

-- ------------------------------------------------------------
-- 10. 错题本表
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wrong_questions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  question_id BIGINT NOT NULL,
  subject_id BIGINT NOT NULL,
  chapter_id BIGINT,
  wrong_count INT DEFAULT 1 COMMENT '错误次数',
  last_wrong_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  status ENUM('pending','reviewing','mastered') DEFAULT 'pending',
  added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_question (user_id, question_id),
  INDEX idx_user_status (user_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='错题本表';

-- ------------------------------------------------------------
-- 11. 收藏表
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS favorites (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  question_id BIGINT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_question (user_id, question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='收藏表';

-- ------------------------------------------------------------
-- 12. 笔记表
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notes (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  question_id BIGINT NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='笔记表';

-- ------------------------------------------------------------
-- 13. 艾宾浩斯复习队列表
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS review_queue (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  question_id BIGINT NOT NULL,
  interval_days INT DEFAULT 1 COMMENT '当前间隔天数(1/2/4/7/15/30)',
  step INT DEFAULT 0 COMMENT '复习阶段(0-5)',
  next_review_at DATETIME NOT NULL COMMENT '下次复习时间',
  last_reviewed_at DATETIME,
  status ENUM('pending','completed','mastered') DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_next (user_id, next_review_at, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='艾宾浩斯复习队列表';

-- ------------------------------------------------------------
-- 14. 会员套餐表
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS member_plans (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL COMMENT '套餐名称',
  type ENUM('monthly','quarterly','yearly') NOT NULL COMMENT '套餐类型',
  price DECIMAL(10,2) NOT NULL COMMENT '价格',
  original_price DECIMAL(10,2) COMMENT '原价',
  duration INT NOT NULL COMMENT '时长(天)',
  features JSON COMMENT '权益列表(JSON数组)',
  status TINYINT DEFAULT 1,
  sort INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='会员套餐表';

-- ------------------------------------------------------------
-- 15. 订单表
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  plan_id BIGINT NOT NULL,
  order_no VARCHAR(64) UNIQUE NOT NULL COMMENT '订单号',
  amount DECIMAL(10,2) NOT NULL COMMENT '金额',
  pay_method ENUM('wechat','alipay') COMMENT '支付方式',
  pay_status ENUM('pending','paid','refunded','refund_failed') DEFAULT 'pending',
  trade_no VARCHAR(100) COMMENT '第三方交易号',
  paid_at DATETIME,
  refund_at DATETIME,
  refund_reason VARCHAR(500),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user (user_id),
  INDEX idx_status (pay_status),
  INDEX idx_order_no (order_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单表';

-- ------------------------------------------------------------
-- 16. 纠错反馈表
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS error_reports (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  question_id BIGINT NOT NULL,
  type VARCHAR(50) COMMENT '纠错类型(题目错误/答案错误/解析错误/其他)',
  description TEXT NOT NULL,
  status ENUM('pending','resolved','rejected') DEFAULT 'pending',
  admin_reply TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='纠错反馈表';

-- ------------------------------------------------------------
-- 17. 公告表
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS announcements (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  type ENUM('system','exam','activity') DEFAULT 'system',
  status TINYINT DEFAULT 0 COMMENT '0-下线 1-上线',
  publish_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='公告表';

-- ------------------------------------------------------------
-- 18. Banner表
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS banners (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  link_url VARCHAR(500),
  sort INT DEFAULT 0,
  status TINYINT DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Banner表';

-- ------------------------------------------------------------
-- 19. 操作日志表
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS operation_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  admin_id BIGINT NOT NULL,
  admin_name VARCHAR(50) NOT NULL,
  action VARCHAR(100) NOT NULL COMMENT '操作行为',
  module VARCHAR(50) COMMENT '操作模块',
  target VARCHAR(200) COMMENT '操作对象',
  ip VARCHAR(50),
  detail TEXT COMMENT '详细内容(JSON)',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_admin (admin_id),
  INDEX idx_module (module),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='操作日志表';

-- ------------------------------------------------------------
-- 20. AI任务表
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_tasks (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  type ENUM('generate_question','generate_analysis','import') NOT NULL COMMENT '任务类型',
  status ENUM('pending','processing','completed','failed') DEFAULT 'pending',
  params JSON COMMENT '任务参数',
  result JSON COMMENT '任务结果',
  model VARCHAR(50) COMMENT '使用的AI模型',
  prompt_id BIGINT COMMENT '使用的Prompt模板ID',
  admin_id BIGINT COMMENT '发起管理员ID',
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  INDEX idx_status (status),
  INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI任务表';

-- ------------------------------------------------------------
-- 21. AI Prompt模板表
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_prompts (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  type ENUM('generate_question','generate_analysis','import') NOT NULL,
  content TEXT NOT NULL COMMENT 'Prompt内容',
  variables JSON COMMENT '变量列表',
  status TINYINT DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI Prompt模板表';

-- ------------------------------------------------------------
-- 22. 系统配置表
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS system_configs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  config_key VARCHAR(100) UNIQUE NOT NULL,
  config_value TEXT,
  config_type ENUM('string','number','boolean','json') DEFAULT 'string',
  description VARCHAR(200),
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统配置表';

SET FOREIGN_KEY_CHECKS = 1;
