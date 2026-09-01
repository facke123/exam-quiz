import { Injectable, NotFoundException, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Subject } from '@/database/entities/subject.entity';
import { Chapter } from '@/database/entities/chapter.entity';
import { KnowledgePoint } from '@/database/entities/knowledge-point.entity';
import { Paper } from '@/database/entities/paper.entity';
import { Question } from '@/database/entities/question.entity';
import {
  CreateSubjectDto,
  CreateChapterDto,
  CreateKnowledgePointDto,
  CreatePaperDto,
  GeneratePaperDto,
} from './dto/exam.dto';

/**
 * 考试管理服务
 */
@Injectable()
export class ExamService implements OnModuleInit {
  private readonly logger = new Logger(ExamService.name);

  constructor(
    @InjectRepository(Subject)
    private readonly subjectRepository: Repository<Subject>,
    @InjectRepository(Chapter)
    private readonly chapterRepository: Repository<Chapter>,
    @InjectRepository(KnowledgePoint)
    private readonly knowledgePointRepository: Repository<KnowledgePoint>,
    @InjectRepository(Paper)
    private readonly paperRepository: Repository<Paper>,
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
  ) {}

  async onModuleInit() {
    await this.ensureTablesSchema();
    await this.seedInitialExamData();
    await this.ensureKeyKnowledgePoints();
  }

  /**
   * 确保知识库核心关键必考考点完整存在并置顶排序
   */
  async ensureKeyKnowledgePoints() {
    try {
      const keyPoints = [
        {
          subjectId: 1,
          chapterId: 9,
          name: '净值管理(EVM)关键公式与绩效指标分析',
          categoryTag: '项目成本与进度管理',
          sourceBook: '《教程》第9章 项目成本管理',
          importance: '必考',
          coreAnalysis: `### 一、净值管理（EVM）核心三参数
1. **计划价值（PV, Planned Value）**：截至某一时间点，按计划应完成工作的预算金额。\`PV = 计划工时 × 预算单价\`
2. **实际成本（AC, Actual Cost）**：截至某一时间点，完成工作实际耗费的全部成本。
3. **挣值（EV, Earned Value）**：截至某一时间点，实际已完成工作的预算金额。\`EV = 实际完工比例 × 总预算(BAC)\`

### 二、两大偏差与绩效指数公式
- **进度偏差（SV）**：\`SV = EV - PV\`（>0 进度提前，<0 进度滞后）
- **成本偏差（CV）**：\`CV = EV - AC\`（>0 成本节约，<0 成本超支）
- **进度绩效指数（SPI）**：\`SPI = EV / PV\`（>1 提前，<1 滞后）
- **成本绩效指数（CPI）**：\`CPI = EV / AC\`（>1 节约，<1 超支）

### 三、完工估算（EAC）计算法则
- **非典型偏差（后续按原计划预算执行）**：\`EAC = AC + (BAC - EV)\`
- **典型偏差（后续保持当前CPI绩效趋势）**：\`EAC = BAC / CPI\`
- **综合考虑进度与成本（兼顾SPI与CPI）**：\`EAC = AC + (BAC - EV) / (CPI × SPI)\`
- **完工尚需估算（ETC）**：非典型 \`ETC = BAC - EV\`；典型 \`ETC = (BAC - EV) / CPI\`
- **完工偏差（VAC）**：\`VAC = BAC - EAC\`（>0 费用节约，<0 费用超支）`,
          memoryTips: '口诀：EV在前面，减去谁算谁；减PV是进度偏差，减AC是成本偏差；大于0好，小于0差！除法同理，大于1赚，小于1亏！典型除CPI，非典型加剩余！',
          sort: 1,
        },
        {
          subjectId: 1,
          chapterId: 8,
          name: '关键路径法(CPM)与三点估算(PERT)公式',
          categoryTag: '项目进度管理',
          sourceBook: '《教程》第8章 项目进度管理',
          importance: '必考',
          coreAnalysis: `### 一、关键路径法（CPM）核心原则
1. **关键路径定义**：网络图中耗时最长的路径序列，决定了项目的最短完工工期。一个项目可能存在多条关键路径。
2. **总时差（Total Float / Slack）**：在不影响项目总工期前提下，活动可延误的时间。\`TF = LS - ES = LF - EF\`（关键路径上总时差通常为0）。
3. **自由时差（Free Float）**：在不影响所有紧后活动最早开始时间前提下，活动可推迟的时间。\`FF = Min(所有紧后活动ES) - 本活动EF\`。
4. **时差关系定理**：\`总时差 ≥ 自由时差 ≥ 0\`。

### 二、PERT 三点估算公式（β分布与三角分布）
- **期望工期（Te, 贝塔分布）**：\`Te = (To + 4Tm + Tp) / 6\`
  - \`To\`：最乐观时间（Optimistic）
  - \`Tm\`：最可能时间（Most Likely）
  - \`Tp\`：最悲观时间（Pessimistic）
- **三角分布工期**：\`Te = (To + Tm + Tp) / 3\`
- **标准差（σ）**：\`σ = (Tp - To) / 6\`
- **方差（σ²）**：\`σ² = [(Tp - To) / 6]²\`（项目总方差 = 各关键活动方差之和）
- **正态分布完成概率区间**：
  - \`Te ± 1σ\`：约 68.26% 概率完成
  - \`Te ± 2σ\`：约 95.46% 概率完成
  - \`Te ± 3σ\`：约 99.73% 概率完成`,
          memoryTips: '口诀：一乐一悲四可能，加和除以六得工期；悲减乐再除六，标准差算方差平方走；正负一西格玛六十八，二西格玛九十五，三西格玛九九点七全拿下！',
          sort: 2,
        },
        {
          subjectId: 1,
          chapterId: 14,
          name: '整体变更控制流程与 CCB 决策机制',
          categoryTag: '项目变更与配置管理',
          sourceBook: '《教程》第14章 项目变更管理',
          importance: '必考',
          coreAnalysis: `### 一、变更控制委员会（CCB）核心职责与定位
- **定位**：CCB（Change Control Board）是项目的决策机构而非日常作业执行机构，由项目发起人、客户代表、项目经理、技术负责人等关键干系人共同组成。
- **职责**：负责审查、评估、批准、推迟或否决对项目基准（范围、进度、成本、质量基准）的变更请求。
- **项目经理职责**：PM 负责组织对变更的影响评估，提交 CCB 审议，并在批准后组织落实、更新计划并监控执行。

### 二、整体变更控制标准 7 步闭环流程
1. **提出变更申请**：由干系人以正式书面形式提出变更请求（CR）。
2. **评估影响分析**：PM 组织团队全面综合分析变更对范围、成本、进度、质量、风险等各方面的综合影响。
3. **提交 CCB 审批**：将变更方案及综合影响评估报告提交 CCB 审议。
4. **CCB 做出决策**：CCB 正式作出批准（Approve）、否决（Reject）或推迟（Defer）决议。
5. **更新项目基准与管理计划**：变更批准后，必须立即同步更新范围/进度/成本基准与项目管理计划。
6. **通知受影响干系人**：将变更决议与更新后的管理计划及时通知全体相关干系人。
7. **监控执行与效果验证**：跟踪变更落实执行过程，验证变更效果，记录经验教训并闭环归档。`,
          memoryTips: '口诀：变更必须走书面，先评估再报CCB审；批准改基准通知全员，跟踪验证保闭环；口头变更不作数，基准调整不可乱！',
          sort: 3,
        },
        {
          subjectId: 1,
          chapterId: 7,
          name: '项目范围基线、WBS 拆解原则与范围确认',
          categoryTag: '项目范围管理',
          sourceBook: '《教程》第7章 项目范围管理',
          importance: '必考',
          coreAnalysis: `### 一、项目范围基线组成（核心三要素）
1. **项目范围说明书（Scope Statement）**：详细描述项目范围、主要可交付成果、验收标准、假设条件与制约因素。
2. **工作分解结构（WBS）**：对项目团队为实现目标、创建可交付成果而执行的全部工作范围的层级分解树。
3. **WBS 词典（WBS Dictionary）**：对 WBS 各工作包进行详细技术描述、负责部门、资源估算与验收标准的配套定义文件。

### 二、WBS 拆解核心原则与黄金法则
- **100% 原则**：WBS 必须包含且仅包含项目 100% 的工作（既不遗漏也不多做，杜绝范围蔓延与镀金）。
- **面向可交付成果**：WBS 必须以可交付成果或产品组件为导向进行分解，而非按组织架构或人员分工分解。
- **底层工作包（Work Package）**：WBS 最底层为工作包，通常满足 8/80 准则（耗时在 8~80 小时间），具有唯一责任人且可独立估算核算。
- **唯一编码**：每个 WBS 元素均分配全局唯一编码标识。

### 三、范围确认（Validate Scope）vs 质量控制（Control Quality）
- **质量控制（QC）**：强调工作成果的“正确性”与技术指标达标，由项目内部团队/质检部门执行，通常先于范围确认。
- **范围确认**：强调客户/发起人对可交付成果的“正式验收与签字确认”，由外部干系人/客户执行，输出为验收的可交付成果。`,
          memoryTips: '口诀：范围基线三件套：说明书、WBS、词典好；100%分解不漏不少；内部质控查正确，外部范围确认客户签收单！',
          sort: 4,
        },
        {
          subjectId: 1,
          chapterId: 12,
          name: '风险识别与消极/积极风险应对策略',
          categoryTag: '项目风险管理',
          sourceBook: '《教程》第12章 项目风险管理',
          importance: '必考',
          coreAnalysis: `### 一、消极风险（威胁 Threat）四大应对策略
1. **规避（Avoid）**：改变项目管理计划以彻底消除威胁（如取消高风险模块、采用成熟技术、更换合格供应商）。
2. **转移（Transfer）**：将风险的所有权及应对后果转移给第三方（如购买商业保险、签署固定总价合同、业务外包）。
3. **减轻（Mitigate）**：采取前期行动降低风险发生的概率或减少其负面影响（如增加单元测试、采用冗余双备份架构、设计原型验证）。
4. **接受（Accept）**：
   - **主动接受**：建立应急储备（应急预算/应急时间）以应对已知风险；
   - **被动接受**：不采取任何预防措施，仅在风险发生时记录并应对。

### 二、积极风险（机会 Opportunity）四大应对策略
1. **开拓（Exploit）**：采取 100% 确保机会得以实现的行动（如指派公司最资深架构师攻坚）。
2. **提高（Enhance）**：提高机会发生的概率或积极影响（如提前追加资源争取提前完工奖励）。
3. **分享（Share）**：将机会部分或全部分配给最能捕捉该机会的第三方（如组建联合体/合资企业共同投标）。
4. **接受（Accept）**：乐于利用机会带来的利益，但不主动投入资源去追求。

### 三、应急应对策略 vs 弹回计划
- **应急应对策略（Contingency Plan）**：仅在特定触发条件满足时才执行的预备方案；
- **弹回计划（Fallback Plan）**：当主要应对策略无效时使用的备用次选方案。`,
          memoryTips: '口诀：消极四策略——规避转移减轻接受；积极四策略——开拓提高分享接受；买保险签固定合同叫转移，设应急备用金叫主动接受！',
          sort: 5,
        },
        {
          subjectId: 1,
          chapterId: 10,
          name: '沟通渠道计算与干系人管理策略 (权力-利益方格)',
          categoryTag: '项目沟通与干系人管理',
          sourceBook: '《教程》第10章 项目沟通与干系人',
          importance: '必考',
          coreAnalysis: `### 一、沟通渠道数量计算公式
- **潜在沟通渠道数公式**：\`M = N × (N - 1) / 2\`
  - \`N\`：参与沟通的干系人总人数（**必须包含项目经理本人**）。
  - **新增渠道数计算**：若团队人数从 N 人增加到 N + K 人，新增沟通渠道为 \`(N+K)(N+K-1)/2 - N(N-1)/2\`。

### 二、干系人权力-利益方格（Power/Interest Grid）四大分类与应对策略
1. **高权力 - 高利益（重点管理 Manage Closely）**：
   - 特征：对项目有关键决策权且利益休戚相关（如项目发起人、主要客户主管）。
   - 策略：必须时刻密切关注其期望，定期深入重点沟通与汇报。
2. **高权力 - 低利益（令其满意 Keep Satisfied）**：
   - 特征：拥有重大行政/审批权力但不过多关注细节（如公司高管、监管机构）。
   - 策略：满足其管理诉求，保持良好关系，防止其滥用权力阻碍项目。
3. **低权力 - 高利益（随时告知 Keep Informed）**：
   - 特征：深受项目影响但决策权力有限（如最终系统操作用户、社区公众）。
   - 策略：充分告知项目进展与变动，征求其意见反馈，争取其全力支持。
4. **低权力 - 低利益（监督观察 Monitor）**：
   - 特征：既无权力也不太受影响。
   - 策略：花费最少精力进行常规监控与通用信息发布即可。`,
          memoryTips: '口诀：沟通渠道N乘N减一除以二；高权高利重点管，高权低利令满意；低权高利随时告知，低权低利省力监督！',
          sort: 6,
        },
        {
          subjectId: 1,
          chapterId: 13,
          name: '项目采购合同类型与风险承担对比',
          categoryTag: '项目采购管理',
          sourceBook: '《教程》第13章 项目采购管理',
          importance: '必考',
          coreAnalysis: `### 一、三大类项目采购合同与适用场景对比
1. **总价合同（Fixed-Price Contracts）**：
   - **固定总价合同（FFP, Firm Fixed Price）**：最常用，价格不可变更。**买方风险最小，卖方风险最大**。适用于范围非常清晰、规范明确的项目。
   - **总价加激励费用（FPIF）**：设有目标成本、目标利润、最高限价与分摊比例（买方:卖方）。
   - **总价加经济价格调整（FP-EPA）**：适用于跨年度、受通货膨胀或汇率波动大的长期项目。

2. **成本补偿合同（Cost-Reimbursable Contracts）**：
   - **买方承担主要成本风险，卖方风险较小**。适用于项目范围初期不明确、处于研发探索阶段的项目。
   - **成本加固定费用（CPFF）**：报销实际成本 + 固定利润。
   - **成本加激励费用（CPIF）**：报销实际成本 + 节约分摊奖励。计算公式：\`实际支付 = 实际成本 + 目标利润 + (目标成本 - 实际成本) × 卖方分摊比例\`。
   - **成本加奖励费用（CPAF）**：报销成本 + 完全由买方主观评定的奖励。

3. **工料合同（T&M, Time and Material Contracts）**：
   - 混合型合同，按预定单价（工时费率、材料单价）乘以实际消耗量结算。
   - 适用于紧急工作、需要人员增补或无法预估详细工作量的小型短期任务。通常应设定**最高限额（Not-to-Exceed Ceiling）**以控制买方风险。

### 二、合同类型买卖双方风险对比矩阵
| 合同类型 | 买方（业主）风险 | 卖方（乙方）风险 | 范围明确度要求 |
| :--- | :--- | :--- | :--- |
| **固定总价合同 (FFP)** | 🟢 最小 | 🔴 最大 | 必须极其清晰明确 |
| **总价加激励费用 (FPIF)** | 🟡 较小 | 🟠 较大 | 比较明确 |
| **工料合同 (T&M)** | 🟠 中等偏高 | 🟡 中等偏低 | 初步明确 / 快速补充 |
| **成本加激励费用 (CPIF)** | 🟠 较大 | 🟡 较小 | 不太明确 |
| **成本加固定费用 (CPFF)** | 🔴 最大 | 🟢 最小 | 完全不明确 / 探索研发 |`,
          memoryTips: '口诀：范围清楚签总价，卖方承担风险大；范围不清成本加，买方买单风险高；紧急招人签工料，最高限额不可少！',
          sort: 7,
        },
      ];

      for (const kp of keyPoints) {
        let existing: any = null;
        try {
          existing = await this.knowledgePointRepository
            .createQueryBuilder('k')
            .where('k.name = :name OR k.name LIKE :likeName', {
              name: kp.name,
              likeName: `%${kp.name.slice(0, 4)}%`,
            })
            .getOne();
        } catch {
          existing = null;
        }

        if (existing) {
          existing.name = kp.name;
          existing.categoryTag = kp.categoryTag;
          existing.sourceBook = kp.sourceBook;
          existing.importance = kp.importance;
          existing.coreAnalysis = kp.coreAnalysis;
          existing.memoryTips = kp.memoryTips;
          existing.sort = kp.sort;
          existing.subjectId = kp.subjectId;
          existing.chapterId = kp.chapterId;
          await this.knowledgePointRepository.save(existing);
        } else {
          const item = this.knowledgePointRepository.create(kp as any);
          await this.knowledgePointRepository.save(item);
        }
      }
      this.logger.log('ensureKeyKnowledgePoints: 7 大核心必考考点已全部同步入库并置顶排序！');
    } catch (err: any) {
      this.logger.warn(`ensureKeyKnowledgePoints error: ${err.message}`);
    }
  }

  /**
   * 自动检查并补齐数据库表缺失字段，防止线上生产因历史旧结构出现 500
   */
  private async ensureTablesSchema() {
    try {
      const alterQueries = [
        'ALTER TABLE `knowledge_points` ADD COLUMN `subjectId` BIGINT NULL COMMENT "科目ID"',
        'ALTER TABLE `knowledge_points` ADD COLUMN `categoryTag` VARCHAR(100) NULL COMMENT "分类标签"',
        'ALTER TABLE `knowledge_points` ADD COLUMN `sourceBook` VARCHAR(200) NULL COMMENT "教材出处"',
        'ALTER TABLE `knowledge_points` ADD COLUMN `importance` VARCHAR(50) NULL DEFAULT "必考" COMMENT "重要级别"',
        'ALTER TABLE `knowledge_points` ADD COLUMN `coreAnalysis` LONGTEXT NULL COMMENT "逻辑框架"',
        'ALTER TABLE `knowledge_points` ADD COLUMN `memoryTips` TEXT NULL COMMENT "记忆口诀"',
        'ALTER TABLE `knowledge_points` ADD COLUMN `description` TEXT NULL COMMENT "描述"',
        'ALTER TABLE `knowledge_points` ADD COLUMN `tags` JSON NULL COMMENT "标签"',
        'ALTER TABLE `knowledge_points` ADD COLUMN `questionCount` INT NULL DEFAULT 0 COMMENT "题目数"',
        'ALTER TABLE `knowledge_points` ADD COLUMN `sort` INT NULL DEFAULT 0 COMMENT "排序"',
        'ALTER TABLE `knowledge_points` ADD COLUMN `subject_id` BIGINT NULL',
        'ALTER TABLE `knowledge_points` ADD COLUMN `chapter_id` BIGINT NULL',
        'ALTER TABLE `knowledge_points` ADD COLUMN `category_tag` VARCHAR(100) NULL',
        'ALTER TABLE `knowledge_points` ADD COLUMN `source_book` VARCHAR(200) NULL',
        'ALTER TABLE `knowledge_points` ADD COLUMN `core_analysis` LONGTEXT NULL',
        'ALTER TABLE `knowledge_points` ADD COLUMN `memory_tips` TEXT NULL',
        'ALTER TABLE `knowledge_points` ADD COLUMN `question_count` INT NULL DEFAULT 0',
        'ALTER TABLE `chapters` ADD COLUMN `question_count` INT NULL DEFAULT 0',
        'ALTER TABLE `questions` ADD COLUMN `chapter_id` BIGINT NULL',
        'ALTER TABLE `questions` ADD COLUMN `knowledge_point_ids` JSON NULL',
        'ALTER TABLE `questions` ADD COLUMN `tags` JSON NULL',
        'ALTER TABLE `questions` MODIFY COLUMN `knowledge_point_ids` JSON NULL',
        'ALTER TABLE `questions` MODIFY COLUMN `tags` JSON NULL',
      ];

      for (const q of alterQueries) {
        try {
          await this.knowledgePointRepository.query(q);
        } catch {
          // 字段已存在，忽略
        }
      }
    } catch (e: any) {
      this.logger.warn(`ensureTablesSchema warning: ${e.message}`);
    }
  }

  /**
   * 自动初始化科目、章节及试卷体系
   */
  private async seedInitialExamData() {
    try {
      const subCount = await this.subjectRepository.count();
      if (subCount === 0) {
      const initialSubjects = [
        {
          name: '系统集成项目管理工程师',
          code: 'ruankao_soft',
          icon: 'FolderOpened',
          description: '全国计算机技术与软件专业技术资格（水平）考试 - 中级资格',
          sort: 1,
          status: 1,
        },
        {
          name: '信息系统项目管理师',
          code: 'ruankao_high',
          icon: 'DocumentChecked',
          description: '全国计算机技术与软件专业技术资格（水平）考试 - 高级资格',
          sort: 2,
          status: 1,
        },
        {
          name: '软件设计师',
          code: 'ruankao_designer',
          icon: 'Notebook',
          description: '计算机软件与工程设计专业技能水平认证 - 中级资格',
          sort: 3,
          status: 1,
        },
        {
          name: '网络工程师',
          code: 'ruankao_network',
          icon: 'Connection',
          description: '计算机网络系统架构设计与运维管理 - 中级资格',
          sort: 4,
          status: 1,
        },
      ];

      for (const s of initialSubjects) {
        const item = this.subjectRepository.create(s);
        await this.subjectRepository.save(item);
      }
    }

    const chCount = await this.chapterRepository.count();
    if (chCount === 0) {
      const initialChapters = [
        { subjectId: 1, name: '第1章 信息化知识与发展', sort: 1 },
        { subjectId: 1, name: '第2章 信息系统集成及服务管理', sort: 2 },
        { subjectId: 1, name: '第3章 信息系统集成专业技术知识', sort: 3 },
        { subjectId: 1, name: '第4章 项目管理一般知识与生命周期', sort: 4 },
        { subjectId: 1, name: '第5章 项目立项管理与招投标', sort: 5 },
        { subjectId: 1, name: '第6章 项目整体管理', sort: 6 },
        { subjectId: 1, name: '第7章 项目范围管理', sort: 7 },
        { subjectId: 1, name: '第8章 项目进度管理', sort: 8 },
        { subjectId: 1, name: '第9章 项目成本管理', sort: 9 },
        { subjectId: 1, name: '第10章 项目质量管理', sort: 10 },
        { subjectId: 2, name: '第1章 信息化战略与企业架构', sort: 1 },
        { subjectId: 2, name: '第2章 项目集与项目组合管理', sort: 2 },
        { subjectId: 2, name: '第3章 高级项目范围与进度管控', sort: 3 },
        { subjectId: 3, name: '第1章 计算机系统基础与体系结构', sort: 1 },
        { subjectId: 3, name: '第2章 面向对象设计与设计模式', sort: 2 },
        { subjectId: 3, name: '第3章 数据库设计与SQL编程', sort: 3 },
        { subjectId: 4, name: '第1章 计算机网络体系结构与协议', sort: 1 },
        { subjectId: 4, name: '第2章 交换机与路由配置技术', sort: 2 },
      ];

      for (const c of initialChapters) {
        const chapter = this.chapterRepository.create({
          subjectId: c.subjectId,
          name: c.name,
          sort: c.sort,
          questionCount: 0,
        });
        await this.chapterRepository.save(chapter);
      }
    }

    const paperCount = await this.paperRepository.count();
    if (paperCount === 0) {
      const initialPapers = [
        {
          subjectId: 1,
          name: '2024年下半年系统集成项目管理工程师真题（上午综合知识）',
          year: 2024,
          type: 'real',
          duration: 150,
          totalScore: 75,
          status: 'published',
        },
        {
          subjectId: 1,
          name: '2024年上半年系统集成项目管理工程师真题（上午综合知识）',
          year: 2024,
          type: 'real',
          duration: 150,
          totalScore: 75,
          status: 'published',
        },
        {
          subjectId: 1,
          name: '2025年考前密押冲刺模拟试卷（一）',
          year: 2025,
          type: 'mock',
          duration: 150,
          totalScore: 75,
          status: 'published',
        },
        {
          subjectId: 2,
          name: '2024年信息系统项目管理师真题试卷',
          year: 2024,
          type: 'real',
          duration: 150,
          totalScore: 75,
          status: 'published',
        },
      ];

      const questions = await this.questionRepository.find({ select: ['id'] });
      const qIds = questions.map((q) => Number(q.id));

      for (const p of initialPapers) {
        const entity = this.paperRepository.create({
          subjectId: p.subjectId,
          name: p.name,
          year: p.year,
          type: p.type as any,
          duration: p.duration,
          totalScore: p.totalScore,
          questionIds: qIds,
          status: 1,
        });
        await this.paperRepository.save(entity);
      }
    }

    const kpCount = await this.knowledgePointRepository.count();
    if (kpCount === 0) {
      const initialKnowledgePoints = [
        {
          subjectId: 1,
          chapterId: 9,
          name: '净值管理(EVM)关键公式与绩效指标分析',
          categoryTag: '项目成本与进度管理',
          sourceBook: '《教程》第9章 项目成本管理',
          importance: '必考',
          coreAnalysis: `### 一、净值管理（EVM）核心三参数
1. **计划价值（PV, Planned Value）**：截至某一时间点，按计划应完成工作的预算金额。\`PV = 计划工时 × 预算单价\`
2. **实际成本（AC, Actual Cost）**：截至某一时间点，完成工作实际耗费的全部成本。
3. **挣值（EV, Earned Value）**：截至某一时间点，实际已完成工作的预算金额。\`EV = 实际完工比例 × 总预算(BAC)\`

### 二、两大偏差与绩效指数公式
- **进度偏差（SV）**：\`SV = EV - PV\`（>0 进度提前，<0 进度滞后）
- **成本偏差（CV）**：\`CV = EV - AC\`（>0 成本节约，<0 成本超支）
- **进度绩效指数（SPI）**：\`SPI = EV / PV\`（>1 提前，<1 滞后）
- **成本绩效指数（CPI）**：\`CPI = EV / AC\`（>1 节约，<1 超支）

### 三、完工估算（EAC）计算法则
- **非典型偏差（后续按原计划预算执行）**：\`EAC = AC + (BAC - EV)\`
- **典型偏差（后续保持当前CPI绩效趋势）**：\`EAC = BAC / CPI\`
- **综合考虑进度与成本（兼顾SPI与CPI）**：\`EAC = AC + (BAC - EV) / (CPI × SPI)\``,
          memoryTips: '口诀：EV在前面，减去谁算谁；减PV是进度偏差，减AC是成本偏差；大于0好，小于0差！除法同理，大于1赚，小于1亏！',
          sort: 1,
        },
        {
          subjectId: 1,
          chapterId: 8,
          name: '关键路径法(CPM)与三点估算(PERT)公式',
          categoryTag: '项目进度管理',
          sourceBook: '《教程》第8章 项目进度管理',
          importance: '必考',
          coreAnalysis: `### 一、关键路径法（CPM）核心原则
1. **关键路径定义**：项目中历时最长、决定最短工期的活动路径序列。
2. **总时差（Float/Slack）**：在不影响项目总工期前提下，活动可延误的时间。\`TF = LS - ES = LF - EF\`（关键路径上总时差通常为0）。
3. **自由时差（Free Float）**：在不影响紧后活动最早开始的前提下可推迟的时间。\`FF = Min(紧后活动ES) - 本活动EF\`。

### 二、PERT 三点估算公式
- **期望工期（Te）**：\`Te = (To + 4Tm + Tp) / 6\`
  - \`To\`：最乐观时间（Optimistic）
  - \`Tm\`：最可能时间（Most Likely）
  - \`Tp\`：最悲观时间（Pessimistic）
- **标准差（σ）**：\`σ = (Tp - To) / 6\`
- **方差（σ²）**：\`σ² = [(Tp - To) / 6]²\`
- **概率区间（正态分布）**：
  - \`Te ± 1σ\`：约 68.26% 概率完成
  - \`Te ± 2σ\`：约 95.46% 概率完成
  - \`Te ± 3σ\`：约 99.73% 概率完成`,
          memoryTips: '口诀：一乐一悲四可能，加和除以六得工期；悲减乐再除六，标准差算方差平方走；正负一西格玛六十八，二西格玛九十五拿捏下！',
          sort: 2,
        },
        {
          subjectId: 1,
          chapterId: 6,
          name: '整体变更控制流程与 CCB 决策机制',
          categoryTag: '项目变更与配置管理',
          sourceBook: '《教程》第14章 项目变更管理',
          importance: '必考',
          coreAnalysis: `### 一、变更控制委员会（CCB）职责
- CCB（Change Control Board）负责审查、评估、批准或否决对项目基准的变更。
- CCB 是决策机构而非执行机构，项目经理通常负责提出建议和落实批准的变更。

### 二、标准整体变更控制 7 步标准流程
1. **提出变更申请**：项目干系人以书面形式提出变更请求（CR）。
2. **评估影响分析**：项目经理组织团队全面分析变更对范围、成本、进度、质量等基准的影响。
3. **提交CCB审批**：将变更方案及影响评估报告提交 CCB 审议。
4. **CCB 做出决策**：CCB 决议批准、拒绝或推迟。
5. **更新项目基准与管理计划**：批准后更新计划、基准及配置项状态。
6. **通知受影响干系人**：将变更决议及新计划下发至团队及客户。
7. **监控执行与效果验证**：跟踪变更落地执行情况，确保符合预期。`,
          memoryTips: '口诀：变更必须走书面，先评估再报CCB审；批准改基准通知全员，跟踪验证保闭环！',
          sort: 3,
        },
        {
          subjectId: 1,
          chapterId: 7,
          name: '项目范围基线、WBS 拆解原则与范围确认',
          categoryTag: '项目范围管理',
          sourceBook: '《教程》第7章 项目范围管理',
          importance: '必考',
          coreAnalysis: `### 一、项目范围基线组成（三要素）
1. **项目范围说明书（Scope Statement）**：描述项目范围、主要可交付成果、假设条件与制约因素。
2. **工作分解结构（WBS）**：对项目团队为实现目标、创建可交付成果而执行的全部工作范围的层级分解。
3. **WBS 词典（WBS Dictionary）**：对 WBS 各工作包进行详细技术与管理定义的配套文件。

### 二、WBS 拆解 100% 原则与要点
- **100% 原则**：WBS 必须包含且仅包含项目 100% 的工作（既不漏项也不多做，避免范围蔓延）。
- **工作包规模**：最底层为工作包（Work Package），通常以 80 小时（8/80准则）或可独立核算为适宜粒度。
- **WBS 面向可交付成果**：按成果/产品组件分解，而非按组织架构分解。

### 三、范围确认 vs 质量控制
- **质量控制**：强调工作成果的“正确性”与是否符合技术标准，内部团队执行。
- **范围确认**：强调客户/发起人对可交付成果的“正式验收”，外部干系人签字。`,
          memoryTips: '口诀：范围基线三件套：说明书、WBS、词典好；100%分解不漏不少；内部质控查正确，外部范围确认签收单！',
          sort: 4,
        },
        {
          subjectId: 1,
          chapterId: 10,
          name: '风险识别与消极/积极风险应对策略',
          categoryTag: '项目风险管理',
          sourceBook: '《教程》第12章 项目风险管理',
          importance: '高频',
          coreAnalysis: `### 【消极风险（威胁）应对策略】：
- **规避 (Avoid)**：改变计划消除威胁（如取消高风险模块、改变供应商）。
- **转移 (Transfer)**：将风险及应对后果转交给第三方（如买保险、签固定总价合同、外包）。
- **减轻 (Mitigate)**：降低风险发生的概率或减轻后果（如增加测试、使用冗余设计）。
- **接受 (Accept)**：建立应急储备（主动接受）或不采取任何预防措施（被动接受）。

### 【积极风险（机会）应对策略】：
- **开拓 (Exploit)**：确保机会100%实现（如指派最顶尖专家）。
- **提高 (Enhance)**：提高机会发生的概率或积极影响。
- **分享 (Share)**：将机会分配给最能捕捉该机会的第三方（如成立合资企业）。
- **接受 (Accept)**：乐于利用机会但不主动追求。`,
          memoryTips: '口诀：消极四策略——规避转移减轻接受；积极四策略——开拓提高分享接受；买保险签合同叫转移，设备备叫接受！',
          sort: 5,
        },
        {
          subjectId: 1,
          chapterId: 10,
          name: '沟通渠道计算与干系人管理策略 (权力-利益方格)',
          categoryTag: '项目沟通与干系人管理',
          sourceBook: '《教程》第10章 项目沟通与干系人',
          importance: '高频',
          coreAnalysis: `### 一、沟通渠道数量计算公式
- 沟通渠道数公式：\`M = N × (N - 1) / 2\`
  - \`N\`：参与沟通的干系人总人数（包括项目经理本人）。
  - 若人数从 N 增加到 N+K，新增沟通渠道为 \`(N+K)(N+K-1)/2 - N(N-1)/2\`。

### 二、权力-利益方格四大应对策略
1. **高权力 - 高利益（重点管理）**：\`Manage Closely\`，必须时刻密切关注其期望，重点沟通。
2. **高权力 - 低利益（令其满意）**：\`Keep Satisfied\`，保持满意，防止滥用权力阻碍项目。
3. **低权力 - 高利益（随时告知）**：\`Keep Informed\`，充分沟通并及时告知项目进展。
4. **低权力 - 低利益（监督观察）**：\`Monitor\`，花费最少精力进行常规监督即可。`,
          memoryTips: '口诀：沟通渠道N乘N减一除二；高权高利重点管，高权低利令满意；低权高利多告知，低权低利省力气！',
          sort: 6,
        },
      ];

      for (const kp of initialKnowledgePoints) {
        try {
          const item = this.knowledgePointRepository.create(kp as any);
          await this.knowledgePointRepository.save(item);
        } catch {
          // ignore
        }
      }
    }
  } catch (err: any) {
    this.logger.warn(`seedInitialExamData error: ${err.message}`);
  }
}

  // ==================== 科目管理 ====================

  /**
   * 获取科目列表（含题目数）
   */
  async getSubjects(): Promise<any[]> {
    try {
      const subjects = await this.subjectRepository.find({
        order: { sort: 'ASC', createdAt: 'ASC' },
      });

      const result = [];
      for (const sub of subjects) {
        let qCount = 0;
        try {
          qCount = await this.questionRepository.count({
            where: { subjectId: Number(sub.id), status: 'published' },
          });
        } catch {
          qCount = 0;
        }
        result.push({
          id: Number(sub.id),
          name: sub.name,
          code: sub.code,
          icon: sub.icon,
          description: sub.description,
          sort: sub.sort,
          status: sub.status === 1 ? 'enabled' : 'disabled',
          questionCount: qCount,
          createdAt: sub.createdAt,
        });
      }
      return result;
    } catch (err: any) {
      this.logger.error(`getSubjects failed: ${err.message}`);
      return [];
    }
  }

  /**
   * 获取科目详情
   */
  async getSubject(id: number): Promise<Subject> {
    const subject = await this.subjectRepository.findOne({ where: { id } });
    if (!subject) {
      throw new NotFoundException('科目不存在');
    }
    return subject;
  }

  /**
   * 创建科目
   */
  async createSubject(dto: CreateSubjectDto | any): Promise<Subject> {
    const subject = this.subjectRepository.create({
      name: dto.name,
      code: dto.code || dto.name.toLowerCase(),
      description: dto.description || '',
      icon: dto.icon || '',
      sort: dto.sort || 0,
      status: dto.status === 'disabled' || dto.status === 0 ? 0 : 1,
    });
    return this.subjectRepository.save(subject);
  }

  /**
   * 更新科目
   */
  async updateSubject(id: number, dto: Partial<CreateSubjectDto> | any): Promise<Subject> {
    const subject = await this.getSubject(id);
    if (dto.name !== undefined) subject.name = dto.name;
    if (dto.code !== undefined) subject.code = dto.code;
    if (dto.description !== undefined) subject.description = dto.description;
    if (dto.icon !== undefined) subject.icon = dto.icon;
    if (dto.sort !== undefined) subject.sort = dto.sort;
    if (dto.status !== undefined) subject.status = dto.status === 'disabled' || dto.status === 0 ? 0 : 1;
    return this.subjectRepository.save(subject);
  }

  /**
   * 删除科目
   */
  async deleteSubject(id: number): Promise<void> {
    const result = await this.subjectRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException('科目不存在');
    }
  }

  /**
   * 解析 subjectId 或 code/name 为数值 id
   */
  async resolveSubjectId(subjectIdOrCode?: number | string): Promise<number> {
    if (!subjectIdOrCode) {
      const first = await this.subjectRepository.findOne({ order: { sort: 'ASC', id: 'ASC' } });
      return first ? Number(first.id) : 1;
    }

    if (typeof subjectIdOrCode === 'number' && !isNaN(subjectIdOrCode)) {
      return subjectIdOrCode;
    }

    const str = String(subjectIdOrCode).trim();
    if (!isNaN(Number(str)) && Number(str) > 0) {
      return Number(str);
    }

    const found = await this.subjectRepository
      .createQueryBuilder('s')
      .where('s.code = :str OR s.name = :str OR s.code LIKE :like OR s.name LIKE :like', {
        str,
        like: `%${str}%`,
      })
      .getOne();

    if (found) {
      return Number(found.id);
    }

    return 1;
  }

  // ==================== 章节管理 ====================

  /**
   * 别名方法：兼容 exam.controller.ts getChapters
   */
  async getChapters(subjectId?: number | string): Promise<any[]> {
    return this.getChapterTree(subjectId);
  }

  /**
   * 获取章节树（含题目数和知识点）
   */
  async getChapterTree(subjectId?: number | string): Promise<any[]> {
    const resolvedSubjectId = await this.resolveSubjectId(subjectId);

    const chapters = await this.chapterRepository.find({
      where: { subjectId: resolvedSubjectId },
      order: { sort: 'ASC', id: 'ASC' },
    });

    let knowledgePoints: any[] = [];
    try {
      knowledgePoints = await this.knowledgePointRepository.find();
    } catch {
      try {
        knowledgePoints = await this.knowledgePointRepository.query(
          'SELECT id, IFNULL(chapterId, chapter_id) as chapterId, name FROM knowledge_points',
        );
      } catch {
        knowledgePoints = [];
      }
    }

    const chapterMap = new Map<number, any>();
    for (const c of chapters) {
      let qCount = 0;
      try {
        qCount = await this.questionRepository.count({
          where: { chapterId: Number(c.id), status: 'published' },
        });
      } catch {
        qCount = 0;
      }

      chapterMap.set(Number(c.id), {
        id: Number(c.id),
        subjectId: Number(c.subjectId),
        parentId: c.parentId ? Number(c.parentId) : null,
        name: c.name,
        sort: c.sort,
        questionCount: qCount,
        progress: 0,
        knowledgePoints: (knowledgePoints || [])
          .filter((kp) => Number(kp.chapterId || kp.chapter_id) === Number(c.id))
          .map((kp) => ({
            id: Number(kp.id),
            chapterId: Number(kp.chapterId || kp.chapter_id),
            name: kp.name,
          })),
        children: [],
      });
    }

    // 组装树形结构
    const tree: any[] = [];
    for (const item of chapterMap.values()) {
      if (item.parentId && chapterMap.has(item.parentId)) {
        const parent = chapterMap.get(item.parentId);
        parent.children.push(item);
      } else {
        tree.push(item);
      }
    }

    return tree;
  }

  /**
   * 创建章节
   */
  async createChapter(dto: CreateChapterDto | any): Promise<Chapter> {
    const chapter = this.chapterRepository.create({
      subjectId: dto.subjectId,
      parentId: dto.parentId || null,
      name: dto.name,
      sort: dto.sort || 0,
      questionCount: 0,
    });
    return this.chapterRepository.save(chapter);
  }

  /**
   * 更新章节
   */
  async updateChapter(id: number, dto: Partial<CreateChapterDto> | any): Promise<Chapter> {
    const chapter = await this.chapterRepository.findOne({ where: { id } });
    if (!chapter) {
      throw new NotFoundException('章节不存在');
    }
    if (dto.name !== undefined) chapter.name = dto.name;
    if (dto.parentId !== undefined) chapter.parentId = dto.parentId;
    if (dto.sort !== undefined) chapter.sort = dto.sort;
    return this.chapterRepository.save(chapter);
  }

  /**
   * 删除章节
   */
  async deleteChapter(id: number): Promise<void> {
    const result = await this.chapterRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException('章节不存在');
    }
  }

  // ==================== 知识点管理 ====================

  /**
   * 知识库考点列表与综合过滤（支持前台与后台）
   */
  async getKnowledgeBase(params: {
    subjectId?: number | string;
    chapterId?: number | string;
    category?: string;
    keyword?: string;
    importance?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ list: any[]; categories: string[]; total: number }> {
    const resolvedSubjectId = await this.resolveSubjectId(params.subjectId);

    const qb = this.knowledgePointRepository.createQueryBuilder('kp');

    if (resolvedSubjectId) {
      qb.where('(kp.subjectId = :subId OR kp.subjectId IS NULL)', { subId: resolvedSubjectId });
    }

    if (params.chapterId && Number(params.chapterId) > 0) {
      qb.andWhere('kp.chapterId = :chapterId', { chapterId: Number(params.chapterId) });
    }

    if (params.category && params.category !== '全部' && params.category !== 'all') {
      qb.andWhere('(kp.categoryTag = :category OR kp.categoryTag LIKE :catLike)', {
        category: params.category,
        catLike: `%${params.category}%`,
      });
    }

    if (params.importance && params.importance !== '全部') {
      qb.andWhere('kp.importance = :importance', { importance: params.importance });
    }

    if (params.keyword && params.keyword.trim()) {
      const kw = params.keyword.trim();
      qb.andWhere(
        '(kp.name LIKE :kw OR kp.coreAnalysis LIKE :kw OR kp.memoryTips LIKE :kw OR kp.sourceBook LIKE :kw OR kp.categoryTag LIKE :kw)',
        { kw: `%${kw}%` },
      );
    }

    qb.orderBy(
      'CASE WHEN kp.importance = "必考" THEN 1 WHEN kp.importance = "高频" THEN 2 WHEN kp.importance = "常考" THEN 3 ELSE 4 END',
      'ASC',
    )
      .addOrderBy('kp.sort', 'ASC')
      .addOrderBy('kp.id', 'ASC');

    try {
      const [rawList, total] = await qb.getManyAndCount();

      // 动态统计所有分类供前端胶囊标签展示
      const allKpForCategories = await this.knowledgePointRepository.find({
        select: ['categoryTag', 'importance'],
      });

      const categorySet = new Set<string>();
      categorySet.add('全部');
      for (const item of allKpForCategories) {
        if (item.categoryTag && item.categoryTag.trim()) {
          categorySet.add(item.categoryTag.trim());
        }
      }

      // 关联配套试题数量
      const list = await Promise.all(
        rawList.map(async (kp) => {
          let qCount = kp.questionCount || 0;
          if (!qCount) {
            try {
              const c = await this.questionRepository
                .createQueryBuilder('q')
                .where('q.status = :status', { status: 'published' })
                .andWhere(
                  '(q.chapterId = :chapterId OR q.content LIKE :kpName OR q.knowledgePointIds LIKE :kpId)',
                  {
                    chapterId: kp.chapterId,
                    kpName: `%${kp.name.slice(0, 4)}%`,
                    kpId: `%"${kp.id}"%`,
                  },
                )
                .getCount();
              qCount = c > 0 ? c : 1;
            } catch {
              qCount = 1;
            }
          }

          return {
            id: Number(kp.id),
            subjectId: kp.subjectId ? Number(kp.subjectId) : resolvedSubjectId,
            chapterId: Number(kp.chapterId),
            name: kp.name,
            categoryTag: kp.categoryTag || '核心考点',
            sourceBook: kp.sourceBook || `《教程》对应章节`,
            importance: kp.importance || '必考',
            coreAnalysis: kp.coreAnalysis || kp.description || '',
            memoryTips: kp.memoryTips || '',
            tags: kp.tags || [],
            questionCount: qCount,
            sort: kp.sort || 0,
            createdAt: kp.createdAt,
            updatedAt: kp.updatedAt,
          };
        }),
      );

      return {
        list,
        categories: Array.from(categorySet),
        total,
      };
    } catch (err: any) {
      this.logger.error(`getKnowledgeBase error: ${err.message}`);
      return {
        list: [],
        categories: ['全部', '核心考点'],
        total: 0,
      };
    }
  }

  /**
   * 获取知识点单条详情及配套题目
   */
  async getKnowledgePointDetail(id: number): Promise<any> {
    const kp = await this.knowledgePointRepository.findOne({ where: { id } });
    if (!kp) {
      throw new NotFoundException('知识点不存在');
    }

    const questions = await this.questionRepository
      .createQueryBuilder('q')
      .where('q.status = :status', { status: 'published' })
      .andWhere(
        '(q.chapterId = :chapterId OR q.content LIKE :kpName OR q.knowledgePointIds LIKE :kpId)',
        {
          chapterId: kp.chapterId,
          kpName: `%${kp.name.slice(0, 4)}%`,
          kpId: `%"${kp.id}"%`,
        },
      )
      .take(10)
      .getMany();

    let mappedQuestions = questions.map((q) => ({
      id: Number(q.id),
      type: q.type,
      content: q.content,
      options: q.options || [],
      answer: q.answer || 'A',
      analysis: q.analysis || '',
      difficulty: q.difficulty || 3,
      score: (q as any).score || 1,
    }));

    // 若暂无关联题目，提供高质量精选典型例题
    if (mappedQuestions.length === 0) {
      let sampleQ: any = null;
      if (kp.name.includes('净值') || kp.name.includes('EVM')) {
        sampleQ = {
          id: 10000 + Number(kp.id),
          type: 'single_choice',
          content: '某项目进行到第6个月末，计划价值PV=100万元，实际成本AC=110万元，挣值EV=90万元。则该项目的成本偏差(CV)和进度偏差(SV)分别为（ ）。',
          options: [
            { key: 'A', content: '-20万元，-10万元' },
            { key: 'B', content: '-20万元，10万元' },
            { key: 'C', content: '20万元，-10万元' },
            { key: 'D', content: '-10万元，-20万元' },
          ],
          answer: 'A',
          analysis: '【解析】成本偏差 CV = EV - AC = 90 - 110 = -20万元（成本超支）；进度偏差 SV = EV - PV = 90 - 100 = -10万元（进度延误）。故选A。',
          difficulty: 3,
          score: 1,
        };
      } else if (kp.name.includes('关键路径') || kp.name.includes('CPM') || kp.name.includes('PERT') || kp.name.includes('三点估算')) {
        sampleQ = {
          id: 10000 + Number(kp.id),
          type: 'single_choice',
          content: '某活动的乐观时间为4天，最可能时间为6天，悲观时间为14天。采用PERT（贝塔分布）进行三点估算，该活动的期望工期和标准差分别为（ ）。',
          options: [
            { key: 'A', content: '7天，1.67天' },
            { key: 'B', content: '8天，1.67天' },
            { key: 'C', content: '7天，1.4天' },
            { key: 'D', content: '6天，2天' },
          ],
          answer: 'A',
          analysis: '【解析】期望工期 Te = (To + 4Tm + Tp) / 6 = (4 + 4×6 + 14) / 6 = 42 / 6 = 7天；标准差 σ = (Tp - To) / 6 = (14 - 4) / 6 = 10 / 6 ≈ 1.67天。故选A。',
          difficulty: 3,
          score: 1,
        };
      } else if (kp.name.includes('变更') || kp.name.includes('CCB')) {
        sampleQ = {
          id: 10000 + Number(kp.id),
          type: 'single_choice',
          content: '在项目整体变更控制流程中，项目经理在收到客户提出的书面变更申请后，下一步应当首先开展的工作是（ ）。',
          options: [
            { key: 'A', content: '直接修改范围基准和项目管理计划' },
            { key: 'B', content: '组织团队全面评估该变更对范围、成本、进度及质量等基准的综合影响' },
            { key: 'C', content: '立即提交CCB进行投票决议' },
            { key: 'D', content: '直接拒绝客户的不合理变更要求' },
          ],
          answer: 'B',
          analysis: '【解析】整体变更控制标准流程：提出变更申请 -> 评估变更影响 -> 提交CCB审批 -> CCB决议 -> 更新基准与计划 -> 通知干系人 -> 监控实施。因此收到变更后第一步必须先组织评估影响，再报CCB。故选B。',
          difficulty: 3,
          score: 1,
        };
      } else if (kp.name.includes('范围基线') || kp.name.includes('WBS')) {
        sampleQ = {
          id: 10000 + Number(kp.id),
          type: 'single_choice',
          content: '关于工作分解结构（WBS）的拆解原则与规范，下列说法中不正确的是（ ）。',
          options: [
            { key: 'A', content: 'WBS 必须遵循 100% 原则，下层所有元素的总和等于上一层元素' },
            { key: 'B', content: 'WBS 应当以可交付成果为导向进行分解' },
            { key: 'C', content: 'WBS 最底层的工作单元称为工作包' },
            { key: 'D', content: 'WBS 中应详细定义各项活动之间的前后逻辑依赖关系' },
          ],
          answer: 'D',
          analysis: '【解析】WBS 本身只展现范围层次结构，不体现活动之间的先后逻辑依赖关系（活动先后排序属于进度管理的前导图法PDM），故D选项说法错误。',
          difficulty: 3,
          score: 1,
        };
      } else if (kp.name.includes('风险应对') || kp.name.includes('风险管理')) {
        sampleQ = {
          id: 10000 + Number(kp.id),
          type: 'single_choice',
          content: '项目经理为了应对技术难度极高的核心模块开发风险，决定将该模块以固定总价合同形式外包给一家经验丰富的专业公司。这种风险应对策略属于（ ）。',
          options: [
            { key: 'A', content: '风险规避' },
            { key: 'B', content: '风险转移' },
            { key: 'C', content: '风险减轻' },
            { key: 'D', content: '风险开拓' },
          ],
          answer: 'B',
          analysis: '【解析】将风险的后果连同应对的权力转移给第三方（如购买保险、签订固定总价合同外包），属于典型的风险转移策略。故选B。',
          difficulty: 3,
          score: 1,
        };
      } else if (kp.name.includes('沟通渠道') || kp.name.includes('干系人') || kp.name.includes('权力-利益')) {
        sampleQ = {
          id: 10000 + Number(kp.id),
          type: 'single_choice',
          content: '某项目团队最初由项目经理和4名工程师组成（共5人），后因工期紧张又增加了3名开发人员。则该项目团队的潜在沟通渠道数增加了（ ）个。',
          options: [
            { key: 'A', content: '18' },
            { key: 'B', content: '28' },
            { key: 'C', content: '10' },
            { key: 'D', content: '15' },
          ],
          answer: 'A',
          analysis: '【解析】原沟通渠道 M1 = 5 × (5 - 1) / 2 = 10条；增加3人后人数为8人，M2 = 8 × (8 - 1) / 2 = 28条。新增沟通渠道数 = 28 - 10 = 18条。故选A。',
          difficulty: 3,
          score: 1,
        };
      } else if (kp.name.includes('采购') || kp.name.includes('合同类型')) {
        sampleQ = {
          id: 10000 + Number(kp.id),
          type: 'single_choice',
          content: '在项目采购管理中，当项目工作范围极其清晰明确、技术规范非常完整时，买方（业主）为了将自身成本风险降至最低，最适宜采用的合同类型是（ ）。',
          options: [
            { key: 'A', content: '固定总价合同（FFP）' },
            { key: 'B', content: '成本加固定费用合同（CPFF）' },
            { key: 'C', content: '工料合同（T&M）' },
            { key: 'D', content: '成本加激励费用合同（CPIF）' },
          ],
          answer: 'A',
          analysis: '【解析】固定总价合同（FFP）中价格固定不变，买方风险最小，卖方承担全部成本超支风险，适用于工作范围定义非常明确的项目。故选A。',
          difficulty: 3,
          score: 1,
        };
      } else {
        sampleQ = {
          id: 10000 + Number(kp.id),
          type: 'single_choice',
          content: `在项目管理与软考实践中，关于【${kp.name}】的核心原则与要点，下列说法中正确的是（ ）。`,
          options: [
            { key: 'A', content: '必须严格遵循标准规范与核心逻辑框架' },
            { key: 'B', content: '可以随意跳过变更控制与审批流程' },
            { key: 'C', content: '无需制定任何风险应对与预防策略' },
            { key: 'D', content: '仅在项目收尾阶段才进行质量与进度把控' },
          ],
          answer: 'A',
          analysis: `【解析】${kp.name} 是软考重点考核要点。项目管理活动必须严格遵循标准规范，建立清晰的逻辑框架和控制机制。`,
          difficulty: 3,
          score: 1,
        };
      }
      mappedQuestions = [sampleQ];
    }

    return {
      ...kp,
      id: Number(kp.id),
      chapterId: Number(kp.chapterId),
      questionCount: mappedQuestions.length,
      questions: mappedQuestions,
    };
  }

  /**
   * 获取知识点列表
   */
  async getKnowledgePoints(chapterId: number): Promise<KnowledgePoint[]> {
    return this.knowledgePointRepository.find({
      where: { chapterId },
      order: { id: 'ASC' },
    });
  }

  /**
   * 创建知识点
   */
  async createKnowledgePoint(dto: CreateKnowledgePointDto): Promise<KnowledgePoint> {
    const kp = this.knowledgePointRepository.create(dto);
    return this.knowledgePointRepository.save(kp);
  }

  /**
   * 更新知识点
   */
  async updateKnowledgePoint(
    id: number,
    dto: Partial<CreateKnowledgePointDto>,
  ): Promise<KnowledgePoint> {
    const kp = await this.knowledgePointRepository.findOne({ where: { id } });
    if (!kp) {
      throw new NotFoundException('知识点不存在');
    }
    Object.assign(kp, dto);
    return this.knowledgePointRepository.save(kp);
  }

  /**
   * 删除知识点
   */
  async deleteKnowledgePoint(id: number): Promise<void> {
    const result = await this.knowledgePointRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException('知识点不存在');
    }
  }

  // ==================== 试卷管理 ====================

  /**
   * 获取试卷列表
   */
  async getPapers(
    subjectId?: number,
    type?: string,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<{ list: any[]; total: number }> {
    const where: Record<string, unknown> = {};
    if (subjectId) where.subjectId = subjectId;
    if (type) where.type = type;

    const [list, total] = await this.paperRepository.findAndCount({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { createdAt: 'DESC' },
    });

    const subjects = await this.subjectRepository.find();
    const subjectMap = new Map(subjects.map((s) => [Number(s.id), s.name]));

    const parseSeason = (name: string): string => {
      if (name.includes('下半年') || name.includes('11月')) return '下半年';
      if (name.includes('上半年') || name.includes('5月')) return '上半年';
      if (name.includes('模拟') || name.includes('押题')) return '模考';
      return '真题';
    };

    const parseYear = (p: Paper): number => {
      if (p.year) return Number(p.year);
      const m = p.name.match(/(20\d{2})/);
      if (m) return Number(m[1]);
      return new Date(p.createdAt).getFullYear();
    };

    const formattedList = list.map((p) => {
      const year = parseYear(p);
      const season = parseSeason(p.name);
      return {
        id: Number(p.id),
        subjectId: Number(p.subjectId),
        subjectName: subjectMap.get(Number(p.subjectId)) || '系统集成项目管理工程师',
        name: p.name,
        year,
        season,
        type: p.type,
        description: `考试时长 ${p.duration} 分钟，总分 ${p.totalScore} 分`,
        totalTime: p.duration,
        duration: p.duration,
        totalScore: p.totalScore,
        questionCount: (p.questionIds && p.questionIds.length) || 0,
        passScore: Math.round(p.totalScore * 0.6),
        status: p.status === 1 ? 1 : 0,
        createdAt: p.createdAt,
      };
    });

    return { list: formattedList, total };
  }

  /**
   * 获取试卷详情（含完整题目列表，用于全景预览与编辑）
   */
  async getPaper(id: number): Promise<any> {
    const paper = await this.paperRepository.findOne({ where: { id } });
    if (!paper) {
      throw new NotFoundException('试卷不存在');
    }
    const subject = await this.subjectRepository.findOne({ where: { id: paper.subjectId } });

    let questions: any[] = [];
    if (paper.questionIds && Array.isArray(paper.questionIds) && paper.questionIds.length > 0) {
      const qList = await this.questionRepository
        .createQueryBuilder('q')
        .where('q.id IN (:...ids)', { ids: paper.questionIds })
        .getMany();

      const qMap = new Map(qList.map((q) => [Number(q.id), q]));
      questions = paper.questionIds
        .map((qid) => {
          const found = qMap.get(Number(qid));
          if (!found) return null;
          let options = found.options;
          if (typeof options === 'string') {
            try {
              options = JSON.parse(options);
            } catch {
              options = [];
            }
          }
          return {
            ...found,
            id: Number(found.id),
            options: options || [],
            score: (found as any).score || 1,
          };
        })
        .filter(Boolean);
    }

    const parseSeason = (name: string): string => {
      if (name.includes('下半年') || name.includes('11月')) return '下半年';
      if (name.includes('上半年') || name.includes('5月')) return '上半年';
      if (name.includes('模拟') || name.includes('押题')) return '模考';
      return '真题';
    };

    const parseYear = (p: Paper): number => {
      if (p.year) return Number(p.year);
      const m = p.name.match(/(20\d{2})/);
      if (m) return Number(m[1]);
      return new Date(p.createdAt).getFullYear();
    };

    const year = parseYear(paper);
    const season = parseSeason(paper.name);

    return {
      ...paper,
      id: Number(paper.id),
      subjectId: Number(paper.subjectId),
      subjectName: subject ? subject.name : '软考科目',
      year,
      season,
      questionCount: (paper.questionIds && paper.questionIds.length) || questions.length,
      totalTime: paper.duration,
      duration: paper.duration,
      passScore: Math.round(paper.totalScore * 0.6),
      questions,
    };
  }

  /**
   * 创建试卷
   */
  async createPaper(dto: CreatePaperDto | any): Promise<Paper> {
    const questionIds = dto.questionIds || [];
    const paper = this.paperRepository.create({
      subjectId: dto.subjectId || 1,
      name: dto.name,
      year: dto.year || (dto.name ? Number((dto.name.match(/(20\d{2})/) || [])[1]) || undefined : undefined),
      type: dto.type || 'real',
      duration: dto.totalTime || dto.duration || 150,
      totalScore: dto.totalScore || (questionIds.length > 0 ? questionIds.length : 75),
      questionIds,
      status: dto.status === 0 || dto.status === 'draft' ? 0 : 1,
    });
    return this.paperRepository.save(paper);
  }

  /**
   * 更新试卷
   */
  async updatePaper(id: number, dto: Partial<CreatePaperDto> | any): Promise<Paper> {
    const paper = await this.paperRepository.findOne({ where: { id } });
    if (!paper) {
      throw new NotFoundException('试卷不存在');
    }
    if (dto.name !== undefined) paper.name = dto.name;
    if (dto.subjectId !== undefined) paper.subjectId = dto.subjectId;
    if (dto.year !== undefined) paper.year = dto.year;
    if (dto.type !== undefined) paper.type = dto.type;
    if (dto.totalTime !== undefined) paper.duration = dto.totalTime;
    if (dto.duration !== undefined) paper.duration = dto.duration;
    if (dto.totalScore !== undefined) paper.totalScore = dto.totalScore;
    if (dto.questionIds !== undefined) {
      paper.questionIds = dto.questionIds;
      if (dto.totalScore === undefined) {
        paper.totalScore = dto.questionIds.length || paper.totalScore;
      }
    }
    if (dto.status !== undefined) paper.status = dto.status === 0 || dto.status === 'draft' ? 0 : 1;
    return this.paperRepository.save(paper);
  }

  /**
   * 删除试卷，并同步级联删除题库中该试卷所包含的全部试题
   */
  async deletePaper(id: number): Promise<{ deletedQuestionsCount: number; message: string }> {
    const paper = await this.paperRepository.findOne({ where: { id } });
    if (!paper) {
      throw new NotFoundException('试卷不存在');
    }

    let deletedQuestionsCount = 0;
    const qIds = Array.isArray(paper.questionIds)
      ? paper.questionIds
          .map((qid: any) => Number(qid))
          .filter((num: number) => !isNaN(num) && num > 0)
      : [];

    if (qIds.length > 0) {
      try {
        const delRes = await this.questionRepository.delete(qIds);
        deletedQuestionsCount = delRes.affected || qIds.length;
        this.logger.log(
          `deletePaper: 成功删除试卷 [${paper.name}](ID:${id}) 及关联的 ${deletedQuestionsCount} 道题库试题`,
        );
      } catch (err: any) {
        this.logger.error(`deletePaper: 级联删除试题失败: ${err.message}`);
        for (const qid of qIds) {
          try {
            await this.questionRepository.delete(qid);
            deletedQuestionsCount++;
          } catch {
            // ignore
          }
        }
      }
    }

    await this.paperRepository.delete(id);

    return {
      deletedQuestionsCount,
      message: `试卷删除成功，已同步彻底清理题库中对应的 ${deletedQuestionsCount} 道试题`,
    };
  }

  /**
   * 批量删除试卷，并同步级联删除题库中对应的全部试题
   */
  async batchDeletePapers(ids: number[]): Promise<{
    deletedPapersCount: number;
    deletedQuestionsCount: number;
    message: string;
  }> {
    if (!ids || ids.length === 0) {
      return {
        deletedPapersCount: 0,
        deletedQuestionsCount: 0,
        message: '未选择任何试卷',
      };
    }

    const papers = await this.paperRepository.find({
      where: { id: In(ids) },
    });

    const allQIdsSet = new Set<number>();
    for (const paper of papers) {
      if (Array.isArray(paper.questionIds)) {
        paper.questionIds.forEach((qid: any) => {
          const num = Number(qid);
          if (!isNaN(num) && num > 0) allQIdsSet.add(num);
        });
      }
    }

    const qIds = Array.from(allQIdsSet);
    let deletedQuestionsCount = 0;

    if (qIds.length > 0) {
      try {
        const delRes = await this.questionRepository.delete(qIds);
        deletedQuestionsCount = delRes.affected || qIds.length;
        this.logger.log(
          `batchDeletePapers: 批量删除 ${papers.length} 套试卷关联的 ${deletedQuestionsCount} 道题库试题`,
        );
      } catch (err: any) {
        this.logger.error(`batchDeletePapers: 批量删除试题异常: ${err.message}`);
        for (const qid of qIds) {
          try {
            await this.questionRepository.delete(qid);
            deletedQuestionsCount++;
          } catch {
            // ignore
          }
        }
      }
    }

    const paperDelRes = await this.paperRepository.delete(ids);
    const deletedPapersCount = paperDelRes.affected || papers.length;

    return {
      deletedPapersCount,
      deletedQuestionsCount,
      message: `成功批量删除 ${deletedPapersCount} 套试卷，并同步彻底清理题库中 ${deletedQuestionsCount} 道试题`,
    };
  }

  /**
   * 组卷 - 按规则自动生成试卷
   */
  async generatePaper(dto: GeneratePaperDto | any): Promise<Paper> {
    const questionIds: number[] = [];

    const qb = this.questionRepository
      .createQueryBuilder('q')
      .where('q.status = :status', { status: 'published' });

    if (dto.subjectId) {
      qb.andWhere('q.subjectId = :subjectId', { subjectId: dto.subjectId });
    }

    if (dto.chapterIds && dto.chapterIds.length > 0) {
      qb.andWhere('q.chapterId IN (:...chapterIds)', {
        chapterIds: dto.chapterIds,
      });
    }

    // 按题型比例或数量抽题
    const totalCount = dto.questionCount || 75;
    const questions = await qb
      .orderBy('RAND()')
      .take(totalCount)
      .getMany();

    questionIds.push(...questions.map((q) => Number(q.id)));

    const paper = this.paperRepository.create({
      subjectId: dto.subjectId || 1,
      name: dto.name || `智能组卷_${new Date().toLocaleDateString()}`,
      type: dto.type || 'mock',
      duration: dto.duration || dto.totalTime || 150,
      totalScore: questionIds.length || 75,
      questionIds,
      status: 1,
    });

    return this.paperRepository.save(paper);
  }

  /**
   * 导入试卷（支持解析题目并建卷，或绑定已有题目建卷）
   */
  async importPaper(dto: any): Promise<any> {
    const subjectId = Number(dto.subjectId || 1);
    const questionIds: number[] = [];

    const toDbType = (t?: string) => {
      const str = String(t || '').toLowerCase().trim();
      if (str === 'multiple' || str === 'multiple_choice' || str.includes('多选')) return 'multiple_choice';
      if (str === 'judge' || str === 'true_false' || str.includes('判断')) return 'true_false';
      if (str === 'case' || str === 'case_analysis' || str.includes('案例')) return 'case_analysis';
      if (str === 'essay' || str === 'subjective' || str.includes('问答') || str.includes('简答') || str.includes('论述')) return 'subjective';
      return 'single_choice';
    };

    const toPaperType = (t?: string) => {
      if (['real', 'mock', 'practice'].includes(String(t))) return String(t);
      return 'real';
    };

    if (Array.isArray(dto.questionIds)) {
      questionIds.push(...dto.questionIds.map((id: any) => Number(id)));
    }

    // 如果携带了解析后的题目列表，则先写入题库并绑定
    if (Array.isArray(dto.questions) && dto.questions.length > 0) {
      for (const q of dto.questions) {
        if (!q.content && !q.title) continue;
        const newQ = this.questionRepository.create({
          subjectId,
          chapterId: q.chapterId ? Number(q.chapterId) : undefined,
          knowledgePointIds: q.knowledgePointId ? [Number(q.knowledgePointId)] : [],
          type: toDbType(q.type),
          difficulty: Number(q.difficulty) || 3,
          content: q.content || q.title,
          options: q.options || [],
          answer: q.answer || 'A',
          analysis: q.analysis || '',
          tags: [],
          status: 'published',
          source: 'word',
        } as any);
        const savedQ: any = await this.questionRepository.save(newQ);
        if (savedQ && savedQ.id) {
          questionIds.push(Number(savedQ.id));
        }
      }
    }

    const totalQuestions = questionIds.length;
    const totalScore = dto.totalScore || (totalQuestions > 0 ? totalQuestions : 75);

    const paper = this.paperRepository.create({
      subjectId,
      name: dto.name,
      year: dto.year || new Date().getFullYear(),
      type: toPaperType(dto.type) as any,
      duration: dto.duration || dto.totalTime || 150,
      totalScore,
      questionIds,
      status: 1,
    });

    const savedPaper = await this.paperRepository.save(paper);
    return {
      paperId: Number(savedPaper.id),
      paper: savedPaper,
      questionCount: questionIds.length,
      message: '试卷导入成功',
    };
  }

  /**
   * 关联/添加题目至试卷
   */
  async addQuestionsToPaper(paperId: number, questionIds: number[]): Promise<Paper> {
    const paper = await this.paperRepository.findOne({ where: { id: paperId } });
    if (!paper) {
      throw new NotFoundException('试卷不存在');
    }
    const currentIds = new Set(paper.questionIds || []);
    for (const qId of questionIds) {
      currentIds.add(Number(qId));
    }
    paper.questionIds = Array.from(currentIds);
    paper.totalScore = paper.questionIds.length;
    return this.paperRepository.save(paper);
  }
}
