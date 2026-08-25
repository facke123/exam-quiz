-- ============================================================
-- 软考刷题系统 - 初始化种子数据
-- 说明: 本文件由 MySQL 容器启动时自动执行 (在 01-schema.sql 之后)
-- ============================================================

USE exam_quiz;
SET NAMES utf8mb4;

-- ------------------------------------------------------------
-- 超级管理员 (默认账号: admin / 密码: admin123)
-- password 字段为 'admin123' 的 BCrypt 哈希 (cost=10)
-- 如登录失败可重新生成: node -e "console.log(require('bcryptjs').hashSync('admin123',10))"
-- ------------------------------------------------------------
INSERT INTO admins (username, password, real_name, role, status) VALUES
(
  'admin',
  '$2a$10$Wzwvebb5MK7ea7cCgbJXQucyEqDyxa316gZSoojFSwWM8UBjIR/Xe',
  '超级管理员',
  'super_admin',
  1
);

-- ------------------------------------------------------------
-- 软考科目 (3个)
-- ------------------------------------------------------------
INSERT INTO subjects (name, code, description, icon, exam_date, exam_title, sort, status) VALUES
('软件设计师', 'ruankao_soft_designer', '中级职称, 考察软件设计、数据结构、算法、面向对象等', NULL, '2026-11-08 09:00:00', '2026年下半年软考统一认证', 1, 1),
('网络工程师', 'ruankao_network_engineer', '中级职称, 考察网络体系结构、协议、路由交换、网络安全等', NULL, '2026-11-08 09:00:00', '2026年下半年软考统一认证', 2, 1),
('信息系统监理师', 'ruankao_info_supervisor', '中级职称, 考察信息系统工程监理的理论与方法', NULL, '2026-11-08 09:00:00', '2026年下半年软考统一认证', 3, 1);

-- ------------------------------------------------------------
-- 会员套餐 (3个)
-- ------------------------------------------------------------
INSERT INTO member_plans (name, type, price, original_price, duration, features, status, sort) VALUES
(
  '月卡',
  'monthly',
  19.00,
  29.00,
  30,
  JSON_ARRAY('全部题库访问', '历年真题', '错题本', '收藏笔记', '每日一练'),
  1,
  1
),
(
  '季卡',
  'quarterly',
  49.00,
  87.00,
  90,
  JSON_ARRAY('全部题库访问', '历年真题', '错题本', '收藏笔记', '每日一练', '艾宾浩斯复习', '模拟考试'),
  1,
  2
),
(
  '年卡',
  'yearly',
  99.00,
  348.00,
  365,
  JSON_ARRAY('全部题库访问', '历年真题', '错题本', '收藏笔记', '每日一练', '艾宾浩斯复习', '模拟考试', 'AI智能解析', '专属客服'),
  1,
  3
);

-- ------------------------------------------------------------
-- AI Prompt 模板 (默认)
-- ------------------------------------------------------------
INSERT INTO ai_prompts (name, type, content, variables, status) VALUES
(
  '单选题生成',
  'generate_question',
  '你是一位软考出题专家。请根据以下知识点生成一道单项选择题。\n科目: {{subject}}\n章节: {{chapter}}\n知识点: {{knowledge_point}}\n难度: {{difficulty}} (1-5)\n\n要求:\n1. 题干清晰准确, 符合软考命题规范\n2. 提供A/B/C/D四个选项\n3. 只有一个正确答案\n4. 提供详细解析\n\n请以JSON格式返回:\n{"content":"题干","options":[{"key":"A","content":"选项A"},...],"answer":"A","analysis":"解析"}',
  JSON_ARRAY('subject','chapter','knowledge_point','difficulty'),
  1
),
(
  '题目解析生成',
  'generate_analysis',
  '你是软考教学专家。请为以下题目编写详细解析。\n题目: {{question}}\n正确答案: {{answer}}\n\n要求:\n1. 解释为何该答案正确\n2. 逐项分析其他选项为何不正确\n3. 补充相关知识点扩展\n\n请返回解析文本(支持富文本):',
  JSON_ARRAY('question','answer'),
  1
),
(
  'Word文档导入解析',
  'import',
  '请将以下文档内容解析为结构化题目。\n文档内容: {{content}}\n科目: {{subject}}\n\n要求:\n1. 识别题目类型(单选/多选/判断/主观)\n2. 提取题干、选项、答案、解析\n3. 标注所属章节\n\n请以JSON数组返回: [{"type":"single_choice","content":"...","options":[...],"answer":"A","analysis":"..."}]',
  JSON_ARRAY('content','subject'),
  1
);

-- ------------------------------------------------------------
-- 系统配置 (默认)
-- ------------------------------------------------------------
INSERT INTO system_configs (config_key, config_value, config_type, description) VALUES
('exam_countdown_date', '2026-11-08 09:00:00', 'string', '全局考试倒计时目标时间'),
('exam_countdown_title', '2026年软考统一认证', 'string', '全局考试倒计时副标题'),
('site_name', '软考刷题宝', 'string', '站点名称'),
('site_icp', '粤ICP备XXXXXXXX号', 'string', '备案号'),
('register_enabled', '1', 'boolean', '是否开放注册'),
('default_avatar', '/static/avatar/default.png', 'string', '默认头像'),
('vip_enabled', '1', 'boolean', '是否启用会员体系'),
('daily_question_count', '10', 'number', '每日一练题数'),
('review_intervals', '[1,2,4,7,15,30]', 'json', '艾宾浩斯复习间隔天数'),
('pass_score_ratio', '0.6', 'number', '及格线比例(0-1)'),
('ai_model', 'gpt-4o-mini', 'string', '默认AI模型'),
('ai_enabled', '1', 'boolean', '是否启用AI功能'),
('minio_bucket', 'exam-quiz', 'string', 'MinIO默认存储桶'),
('app_version', '1.0.0', 'string', '当前应用版本');

-- ------------------------------------------------------------
-- 默认公告
-- ------------------------------------------------------------
INSERT INTO announcements (title, content, type, status, publish_at) VALUES
(
  '欢迎使用软考刷题宝',
  '欢迎使用软考刷题宝! 我们提供软件设计师、网络工程师、信息系统监理师等科目的题库与真题练习, 助您顺利通过软考。如有建议欢迎在"我的-意见反馈"中告诉我们。',
  'system',
  1,
  NOW()
);

-- ------------------------------------------------------------
-- 默认 Banner
-- ------------------------------------------------------------
INSERT INTO banners (title, image_url, link_url, sort, status) VALUES
('新人专享月卡¥19', '/static/banner/banner1.png', '/vip', 1, 1),
('每日打卡领积分', '/static/banner/banner2.png', '/check-in', 2, 1);

-- 完成提示
SELECT '软考刷题系统种子数据初始化完成' AS message;
