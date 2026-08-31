<template>
  <div class="ai-generate-page">
    <!-- 顶部出题控制台卡片 -->
    <div class="panel generate-panel">
      <div class="panel-header">
        <div class="ph-left">
          <span class="ph-title">🤖 AI 智能命题引擎控制台</span>
          <span class="ph-badge">软考官方考纲 2026 最新增强版</span>
        </div>

        <!-- 模式切换选项卡 -->
        <div class="mode-tabs">
          <el-radio-group v-model="activeMode" size="default">
            <el-radio-button label="single">
              ⚡ 单题/批量出题 (题目池待审)
            </el-radio-button>
            <el-radio-button label="paper">
              📑 AI 一键出整卷 (同步至试卷管理)
            </el-radio-button>
          </el-radio-group>
        </div>

        <div class="ph-right">
          <span class="quota-pill">
            今日模型配额：<strong>{{ quota.used }}</strong> / {{ quota.total }} 次（剩余 <strong>{{ quota.remaining }}</strong> 次）
          </span>
          <el-button link type="primary" :icon="'Refresh'" @click="fetchQuota">刷新配额</el-button>
        </div>
      </div>

      <!-- 模式 1：单题 / 批量智能出题表单 -->
      <div v-show="activeMode === 'single'" class="generate-form-container">
        <div class="form-row">
          <div class="form-item">
            <span class="label">基座大模型：</span>
            <el-select v-model="generateForm.model" style="width: 220px">
              <el-option label="Gemini 3.7 Flash (推荐/极速)" value="gemini-3.7-flash" />
              <el-option label="Gemini 3.1 Pro (高阶深度推理)" value="gemini-3.1-pro" />
              <el-option label="DeepSeek-Chat (深度求索)" value="deepseek-chat" />
              <el-option label="DeepSeek-Reasoner (R1推理)" value="deepseek-reasoner" />
              <el-option label="Qwen-Plus (阿里通义千问)" value="qwen-plus" />
              <el-option label="GPT-4o-mini" value="gpt-4o-mini" />
            </el-select>
          </div>

          <div class="form-item">
            <span class="label">目标科目：</span>
            <el-select v-model="generateForm.subjectId" style="width: 230px" @change="onSubjectChange">
              <el-option
                v-for="s in subjects"
                :key="s.value"
                :label="s.label"
                :value="s.value"
              />
            </el-select>
          </div>

          <div class="form-item">
            <span class="label">核心章节：</span>
            <el-select
              v-model="generateForm.chapterId"
              placeholder="选择指定章节"
              style="width: 220px"
              @change="onChapterChange"
            >
              <el-option
                v-for="c in chapterOptions"
                :key="c.id"
                :label="c.name"
                :value="c.id"
              />
            </el-select>
          </div>

          <div class="form-item">
            <span class="label">细分知识点：</span>
            <el-select
              v-model="generateForm.knowledgePointId"
              clearable
              filterable
              placeholder="全部考点/指定知识点"
              style="width: 210px"
              @change="onKnowledgePointChange"
            >
              <el-option
                v-for="kp in currentKnowledgePoints"
                :key="kp.id"
                :label="kp.name"
                :value="kp.id"
              />
            </el-select>
          </div>
        </div>

        <div class="form-row secondary-row">
          <div class="form-item">
            <span class="label">生成题型：</span>
            <el-radio-group v-model="generateForm.type" size="default">
              <el-radio-button label="single">单选题 (4选项)</el-radio-button>
              <el-radio-button label="multiple">多选题</el-radio-button>
              <el-radio-button label="judge">判断题 (对/错)</el-radio-button>
              <el-radio-button label="case">案例分析题</el-radio-button>
            </el-radio-group>
          </div>

          <div class="form-item">
            <span class="label">出题风格：</span>
            <el-select v-model="generateForm.promptStyle" style="width: 170px">
              <el-option label="🎯 历年真题风 (标准)" value="standard" />
              <el-option label="⚠️ 易错陷阱风 (避坑)" value="trap" />
              <el-option label="🧮 实战计算风 (攻坚)" value="calculation" />
              <el-option label="📖 概念辨析风 (规范)" value="concept" />
            </el-select>
          </div>

          <div class="form-item">
            <span class="label">难度等级：</span>
            <el-select v-model="generateForm.difficulty" style="width: 140px">
              <el-option label="基础巩固 (2星)" :value="2" />
              <el-option label="核心考点 (3星)" :value="3" />
              <el-option label="进阶提升 (4星)" :value="4" />
              <el-option label="压轴冲刺 (5星)" :value="5" />
            </el-select>
          </div>

          <div class="form-item count-item">
            <span class="label">生成数量：</span>
            <el-input-number
              v-model="generateForm.count"
              :min="1"
              :max="50"
              :step="1"
              style="width: 130px"
            />
            <div class="quick-count-tags">
              <span
                v-for="c in [5, 10, 20, 30, 50]"
                :key="c"
                class="count-tag"
                :class="{ active: generateForm.count === c }"
                @click="generateForm.count = c"
              >
                {{ c }}道
              </span>
            </div>
          </div>

          <div class="form-item action-btn-item">
            <el-button
              type="primary"
              size="large"
              :loading="generateLoading"
              class="generate-btn"
              @click="handleGenerate"
            >
              ⚡ 一键开始智能命题 ({{ generateForm.count }}道)
            </el-button>
          </div>
        </div>
      </div>

      <!-- 模式 2：AI 智能整卷命题控制台 -->
      <div v-show="activeMode === 'paper'" class="paper-generate-container">
        <div class="paper-form-box">
          <div class="form-row category-row">
            <div class="form-item flex-1">
              <span class="label">试卷架构：</span>
              <el-radio-group v-model="paperForm.questionTypeCategory" @change="onPaperCategoryChange">
                <el-radio-button label="case">📑 案例分析大题整卷 (国考下午科目二·推荐)</el-radio-button>
                <el-radio-button label="single">🎯 客观单选综合卷 (国考上午科目一)</el-radio-button>
                <el-radio-button label="mixed">🌟 全景综合全套卷 (单选+案例大题)</el-radio-button>
              </el-radio-group>
            </div>

            <div class="form-item">
              <span class="label">考点配图：</span>
              <el-switch
                v-model="paperForm.includeImages"
                active-text="包含考点专业图表配图 (网络图/EVM曲线/拓扑图)"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-item">
              <span class="label">基座大模型：</span>
              <el-select v-model="paperForm.model" style="width: 220px">
                <el-option label="Gemini 3.7 Flash (推荐/极速)" value="gemini-3.7-flash" />
                <el-option label="Gemini 3.1 Pro (高阶深度推理)" value="gemini-3.1-pro" />
                <el-option label="DeepSeek-Chat (深度求索)" value="deepseek-chat" />
                <el-option label="DeepSeek-Reasoner (R1推理)" value="deepseek-reasoner" />
                <el-option label="Qwen-Plus (阿里通义千问)" value="qwen-plus" />
              </el-select>
            </div>

            <div class="form-item">
              <span class="label">目标科目：</span>
              <el-select v-model="paperForm.subjectId" style="width: 240px" @change="onPaperSubjectChange">
                <el-option
                  v-for="s in subjects"
                  :key="s.value"
                  :label="s.label"
                  :value="s.value"
                />
              </el-select>
            </div>

            <div class="form-item">
              <span class="label">试卷类型：</span>
              <el-select v-model="paperForm.paperType" style="width: 160px">
                <el-option label="全真模拟卷" value="mock" />
                <el-option label="历年真题仿真" value="real" />
                <el-option label="专项精练冲刺" value="practice" />
              </el-select>
            </div>

            <div class="form-item">
              <span class="label">考试时长：</span>
              <el-input-number v-model="paperForm.duration" :min="30" :max="240" :step="10" style="width: 130px" />
              <span class="unit-text">分钟</span>
            </div>
          </div>

          <div class="form-row name-row">
            <div class="form-item flex-1">
              <span class="label">试卷名称：</span>
              <el-input
                v-model="paperForm.paperName"
                placeholder="如：2026年系统集成【全国统考下午案例分析全真模拟卷·第1套】"
                clearable
                style="flex: 1"
              />
              <el-button type="info" plain :icon="'MagicStick'" @click="generateRandomPaperName">
                🎲 智能生成名称
              </el-button>
            </div>
          </div>

          <div class="form-row secondary-row">
            <div class="form-item count-item">
              <span class="label">整卷题量：</span>
              <el-input-number
                v-model="paperForm.questionCount"
                :min="2"
                :max="100"
                :step="paperForm.questionTypeCategory === 'case' ? 1 : 5"
                style="width: 120px"
              />
              <div class="quick-count-tags">
                <template v-if="paperForm.questionTypeCategory === 'case'">
                  <span
                    v-for="item in [
                      { label: '3道大题 (75分)', val: 3 },
                      { label: '4道大题 (标准卷·推荐)', val: 4 },
                      { label: '5道大题 (强化卷)', val: 5 },
                    ]"
                    :key="item.val"
                    class="count-tag"
                    :class="{ active: paperForm.questionCount === item.val }"
                    @click="paperForm.questionCount = item.val"
                  >
                    {{ item.label }}
                  </span>
                </template>
                <template v-else-if="paperForm.questionTypeCategory === 'mixed'">
                  <span
                    v-for="item in [
                      { label: '32题 (30单选+2案例)', val: 32 },
                      { label: '53题 (50单选+3案例)', val: 53 },
                      { label: '78题 (75单选+3案例)', val: 78 },
                    ]"
                    :key="item.val"
                    class="count-tag"
                    :class="{ active: paperForm.questionCount === item.val }"
                    @click="paperForm.questionCount = item.val"
                  >
                    {{ item.label }}
                  </span>
                </template>
                <template v-else>
                  <span
                    v-for="item in [
                      { label: '10题 (速测)', val: 10 },
                      { label: '25题 (单元冲刺)', val: 25 },
                      { label: '50题 (精选模考)', val: 50 },
                      { label: '75题 (国考标准卷)', val: 75 },
                    ]"
                    :key="item.val"
                    class="count-tag"
                    :class="{ active: paperForm.questionCount === item.val }"
                    @click="paperForm.questionCount = item.val"
                  >
                    {{ item.label }}
                  </span>
                </template>
              </div>
            </div>

            <div class="form-item">
              <span class="label">出题风格：</span>
              <el-select v-model="paperForm.promptStyle" style="width: 170px">
                <el-option label="🎯 历年真题风 (标准规范)" value="standard" />
                <el-option label="⚠️ 易错陷阱风 (避坑精练)" value="trap" />
                <el-option label="🧮 实战计算风 (网络图与EVM攻坚)" value="calculation" />
                <el-option label="📖 概念辨析风 (流程与规范)" value="concept" />
              </el-select>
            </div>

            <div class="form-item">
              <span class="label">难度等级：</span>
              <el-select v-model="paperForm.difficulty" style="width: 140px">
                <el-option label="基础巩固 (2星)" :value="2" />
                <el-option label="核心考点 (3星)" :value="3" />
                <el-option label="进阶提升 (4星)" :value="4" />
                <el-option label="压轴冲刺 (5星)" :value="5" />
              </el-select>
            </div>

            <div class="form-item action-btn-item">
              <el-button
                type="success"
                size="large"
                :loading="generatePaperLoading"
                class="generate-btn paper-btn"
                @click="handleGenerateEntirePaper"
              >
                🚀 启动大模型一键生成整套试卷 ({{ paperForm.questionCount }} 题)
              </el-button>
            </div>
          </div>

          <!-- 章节覆盖提示条 -->
          <div class="chapter-coverage-tip">
            <span class="tip-icon">ℹ️</span>
            <span class="tip-text">
              大模型整卷流水线将自动根据本科目全部 <strong>{{ chapterOptions.length }} 个章节</strong> 知识体系进行比例分配与并发命题，自动完成去重校验、试题入库与整卷关联，生成后即可直接在 <strong>「试卷管理」</strong> 进行发布、导出或学员模考。
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 待审核试题池卡片 -->
    <div class="panel table-panel">
      <!-- 搜索过滤栏 -->
      <div class="filter-bar">
        <div class="fb-items">
          <div class="fb-item">
            <span class="fb-label">题型：</span>
            <el-select v-model="query.type" clearable placeholder="全部题型" style="width: 120px" @change="fetchReviewList">
              <el-option label="全部题型" value="" />
              <el-option label="单选题" value="single" />
              <el-option label="多选题" value="multiple" />
              <el-option label="判断题" value="judge" />
              <el-option label="案例题" value="case" />
            </el-select>
          </div>

          <div class="fb-item">
            <span class="fb-label">难度：</span>
            <el-select v-model="query.difficulty" clearable placeholder="全部难度" style="width: 120px" @change="fetchReviewList">
              <el-option label="全部难度" value="" />
              <el-option label="2星 (基础)" :value="2" />
              <el-option label="3星 (核心)" :value="3" />
              <el-option label="4星 (进阶)" :value="4" />
              <el-option label="5星 (难题)" :value="5" />
            </el-select>
          </div>

          <div class="fb-item">
            <span class="fb-label">关键词：</span>
            <el-input
              v-model="query.keyword"
              placeholder="搜索题干或解析核心词..."
              clearable
              style="width: 220px"
              @keyup.enter="fetchReviewList"
              @clear="fetchReviewList"
            />
          </div>

          <el-button type="primary" :icon="'Search'" @click="fetchReviewList">查询</el-button>
          <el-button :icon="'Refresh'" @click="resetQuery">重置</el-button>
        </div>

        <div class="fb-actions">
          <el-button
            type="success"
            :disabled="!selectedRows.length"
            @click="handleBatchApprove"
          >
            ✓ 批量审核入库 ({{ selectedRows.length }})
          </el-button>
          <el-button
            type="danger"
            :disabled="!selectedRows.length"
            @click="handleBatchReject"
          >
            ✗ 批量驳回 ({{ selectedRows.length }})
          </el-button>
          <el-button
            type="warning"
            plain
            :disabled="total === 0"
            @click="handleClearAllPending"
          >
            🗑️ 清空待审池
          </el-button>
        </div>
      </div>

      <!-- 待审池状态栏 -->
      <div class="table-toolbar">
        <div class="tt-left">
          <span class="tt-title">📋 待审核 AI 智能题目池</span>
          <span class="tt-badge">{{ total }} 道待审</span>
          <span class="tt-desc">由 AI 命题生成并经过查重防撞校验的试题将在此暂存，经教研老师核验确认后正式发布入库</span>
        </div>
      </div>

      <!-- 题目列表 -->
      <el-table
        v-loading="loading"
        :data="list"
        row-key="id"
        class="custom-table"
        border
        @selection-change="onSelectionChange"
      >
        <el-table-column type="selection" width="45" align="center" />
        <el-table-column prop="id" label="ID" width="70" align="center" />

        <el-table-column label="题型" width="95" align="center">
          <template #default="{ row }">
            <span class="type-tag" :class="row.type">
              {{ typeMap[row.type] || row.type }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="难度" width="80" align="center">
          <template #default="{ row }">
            <span class="diff-stars" :title="`难度: ${row.difficulty || 3}星`">
              {{ '★'.repeat(row.difficulty || 3) }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="题干与选项 / 深度名师解析" min-width="460">
          <template #default="{ row }">
            <div class="stem-content">
              <!-- 题干 (支持富文本/SVG图表/Markdown配图) -->
              <div class="stem-title">
                <span class="q-id-tag">#{{ row.id }}</span>
                <div class="stem-html-box" v-html="formatQuestionContent(row.content || row.title)" />
              </div>

              <!-- 选项卡片 (单选/多选/判断) -->
              <div v-if="row.options && row.options.length" class="options-grid">
                <div
                  v-for="opt in row.options"
                  :key="opt.key || opt.label"
                  class="opt-item"
                  :class="{ 'is-correct': isOptionCorrect(row, opt.key || opt.label) }"
                >
                  <span class="opt-badge">{{ opt.key || opt.label }}</span>
                  <span class="opt-text">{{ opt.content }}</span>
                </div>
              </div>

              <!-- 正确答案与解析 -->
              <div class="stem-footer">
                <div class="stem-ans-row">
                  <span class="ans-label">正确答案：</span>
                  <span class="ans-badge">{{ row.answer }}</span>
                  <span class="ans-sep">｜</span>
                  <span class="analysis-toggle-btn" @click="toggleAnalysis(row.id)">
                    {{ expandedAnalysisIds.has(row.id) ? '▲ 收起深度解析' : '▼ 查看名师深度解析' }}
                  </span>
                </div>

                <!-- 展开的名师解析 -->
                <div v-show="expandedAnalysisIds.has(row.id)" class="analysis-box">
                  <div class="analysis-header">
                    <span>💡 名师深度解析与避坑指南</span>
                    <el-button link type="primary" size="small" :loading="rewritingId === row.id" @click="handleRewriteAnalysis(row)">
                      ✨ AI一键优化解析
                    </el-button>
                  </div>
                  <div class="analysis-body" v-html="formatAnalysisHtml(row.analysis)" />
                </div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="科目 / 考点章节" width="180">
          <template #default="{ row }">
            <div class="sub-info">
              <div class="sub-name">{{ row.subjectName || '系统集成项目管理' }}</div>
              <div class="ch-name">{{ row.chapterName || row.knowledgePoint || '核心章节' }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="AI 置信度" width="125" align="center">
          <template #default="{ row }">
            <div class="confidence-wrap">
              <div class="conf-bar">
                <div
                  class="conf-fill"
                  :style="{
                    width: (row.confidence || 95) + '%',
                    background: (row.confidence || 95) >= 90 ? 'var(--el-color-success)' : 'var(--el-color-warning)',
                  }"
                />
              </div>
              <span class="conf-text">{{ row.confidence || 95 }}%</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="createdAt" label="生成时间" width="150" align="center">
          <template #default="{ row }">
            <span class="time-text">{{ formatTime(row.createdAt) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="190" fixed="right" align="center">
          <template #default="{ row }">
            <div class="table-ops">
              <el-button type="success" link size="small" @click="handlePass(row)">
                入库
              </el-button>
              <el-button type="primary" link size="small" @click="openEditDialog(row)">
                修改
              </el-button>
              <el-button type="info" link size="small" @click="copyQuestion(row)">
                复制
              </el-button>
              <el-button type="danger" link size="small" @click="handleReject(row)">
                驳回
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页组件 -->
      <div class="table-pagination">
        <el-pagination
          v-model:current-page="query.page"
          v-model:page-size="query.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @change="fetchReviewList"
        />
      </div>
    </div>

    <!-- 编辑待审核试题弹窗 -->
    <el-dialog v-model="editDialogVisible" title="✏️ 编辑待审核试题与答案" width="720px">
      <el-form :model="editForm" label-width="90px">
        <el-form-item label="试题题型">
          <el-select v-model="editForm.type" style="width: 140px">
            <el-option label="单选题" value="single" />
            <el-option label="多选题" value="multiple" />
            <el-option label="判断题" value="judge" />
            <el-option label="案例分析" value="case" />
          </el-select>
        </el-form-item>

        <el-form-item label="题干内容" required>
          <el-input v-model="editForm.content" type="textarea" :rows="3" placeholder="请输入题干描述" />
        </el-form-item>

        <!-- 选项编辑 -->
        <el-form-item v-if="editForm.type !== 'case'" label="选项列表">
          <div class="dialog-options-list">
            <div v-for="(opt, idx) in editForm.options" :key="idx" class="dialog-opt-item">
              <span class="d-opt-key">{{ opt.key || opt.label }}.</span>
              <el-input v-model="opt.content" placeholder="选项描述内容" style="flex: 1" />
            </div>
          </div>
        </el-form-item>

        <el-form-item label="正确答案" required>
          <el-input v-model="editForm.answer" placeholder="如 A、ABC 或 正确/错误" style="width: 200px" />
        </el-form-item>

        <el-form-item label="名师解析">
          <el-input
            v-model="editForm.analysis"
            type="textarea"
            :rows="6"
            placeholder="包含考点定位、推导依据、干扰项辨析与考前口诀..."
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitEdit">保存修改</el-button>
      </template>
    </el-dialog>

    <!-- 整卷生成成果展示弹窗 -->
    <el-dialog
      v-model="showPaperSuccessModal"
      title="🎉 AI 智能整卷命题成功并已同步入库！"
      width="650px"
      :close-on-click-modal="false"
    >
      <div v-if="generatedPaperResult" class="paper-success-card">
        <div class="psc-header">
          <div class="psc-badge">试卷 ID: #{{ generatedPaperResult.paperId }}</div>
          <div class="psc-title">{{ generatedPaperResult.paper?.name }}</div>
        </div>

        <div class="psc-grid">
          <div class="psc-item">
            <span class="k">目标科目：</span>
            <span class="v">{{ generatedPaperResult.paper?.subjectName || '软考科目' }}</span>
          </div>
          <div class="psc-item">
            <span class="k">生成题量：</span>
            <span class="v highlight">{{ generatedPaperResult.questionCount || 75 }} 题</span>
          </div>
          <div class="psc-item">
            <span class="k">试卷满分：</span>
            <span class="v">{{ generatedPaperResult.paper?.totalScore || 75 }} 分</span>
          </div>
          <div class="psc-item">
            <span class="k">考试时长：</span>
            <span class="v">{{ generatedPaperResult.paper?.duration || 150 }} 分钟</span>
          </div>
          <div class="psc-item">
            <span class="k">及格标准：</span>
            <span class="v">45 分及格 (60%)</span>
          </div>
          <div class="psc-item">
            <span class="k">发布状态：</span>
            <el-tag type="success" size="small">已上架试卷管理</el-tag>
          </div>
        </div>

        <div class="psc-tip">
          ✨ 本套试卷内的所有题目已自动写入官方题库并与试卷建立绑定，支持在「试卷管理」中进行预览、下载导出试卷或安排线上模拟考试。
        </div>
      </div>

      <template #footer>
        <div class="psc-footer">
          <el-button @click="showPaperSuccessModal = false">留在本页</el-button>
          <el-button type="primary" :icon="'Tickets'" @click="goToPaperManage">
            📖 前往试卷管理查看
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getAIQuestionList,
  generateQuestions,
  generateEntirePaper,
  approveAIQuestion,
  rejectAIQuestion,
  batchApproveAIQuestions,
  batchRejectAIQuestions,
  clearPendingQuestions,
  rewriteQuestionAnalysis,
  updateAIQuestion,
  getAIQuota,
} from '@/api/ai'
import { getAllSubjects, getChapterTree } from '@/api/exam'

const router = useRouter()

const activeMode = ref<'single' | 'paper'>('single')
const loading = ref(false)
const generateLoading = ref(false)
const generatePaperLoading = ref(false)
const list = ref<any[]>([])
const total = ref(0)
const selectedRows = ref<any[]>([])
const expandedAnalysisIds = ref<Set<number>>(new Set())
const rewritingId = ref<number | null>(null)

const showPaperSuccessModal = ref(false)
const generatedPaperResult = ref<any>(null)

const quota = reactive({
  total: 5000,
  used: 150,
  remaining: 4850,
})

const query = reactive({
  page: 1,
  pageSize: 20,
  subjectId: undefined as any,
  chapterId: undefined as any,
  type: '',
  difficulty: '',
  keyword: '',
})

const subjects = ref<{ label: string; value: number }[]>([])
const chapterOptions = ref<any[]>([])
const currentKnowledgePoints = ref<any[]>([])

// 单题/批量出题表单
const generateForm = reactive<any>({
  model: 'gemini-3.7-flash',
  subjectId: 1,
  chapterId: 1,
  knowledgePointId: undefined,
  knowledgePoint: '',
  type: 'single',
  difficulty: 3,
  promptStyle: 'standard',
  count: 10,
})

// 整套试卷出题表单
const paperForm = reactive<any>({
  model: 'gemini-3.7-flash',
  subjectId: 1,
  paperName: '',
  questionTypeCategory: 'case',
  includeImages: true,
  paperType: 'mock',
  questionCount: 4,
  duration: 150,
  difficulty: 3,
  promptStyle: 'standard',
})

const typeMap: Record<string, string> = {
  single: '单选',
  single_choice: '单选',
  multiple: '多选',
  multiple_choice: '多选',
  judge: '判断',
  true_false: '判断',
  case: '案例',
  case_analysis: '案例',
}

const editDialogVisible = ref(false)
const editForm = reactive<any>({
  id: 0,
  type: 'single',
  content: '',
  options: [] as any[],
  answer: '',
  analysis: '',
})

function formatTime(t: string | Date | undefined) {
  if (!t) return '-'
  const d = new Date(t)
  if (isNaN(d.getTime())) return String(t)
  const pad = (n: number) => (n < 10 ? '0' + n : n)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function isOptionCorrect(row: any, key: string) {
  if (!row.answer || !key) return false
  const ans = String(row.answer).toUpperCase()
  const k = String(key).toUpperCase()
  return ans.includes(k)
}

function toggleAnalysis(id: number) {
  if (expandedAnalysisIds.value.has(id)) {
    expandedAnalysisIds.value.delete(id)
  } else {
    expandedAnalysisIds.value.add(id)
  }
}

function formatQuestionContent(content: string) {
  if (!content) return ''
  let html = content

  // 1. Markdown 图片语法 ![alt](url) 转为响应式图片
  html = html.replace(
    /!\[(.*?)\]\((.*?)\)/g,
    '<div class="q-img-wrap"><img src="$2" alt="$1" class="q-diagram-img" /><span class="q-img-caption">$1</span></div>'
  )

  // 2. 案例分节与小问加粗排版
  html = html
    .replace(/(【案例背景】|【案例说明】|【说明】)/g, '<div class="case-section-title">$1</div>')
    .replace(/(【问题\s*\d+】[（(][^）)]*[）)]|【问题\s*\d+】)/g, '<div class="case-question-title">$1</div>')
    .replace(/\n/g, '<br/>')

  return html
}

function formatAnalysisHtml(analysis: string) {
  if (!analysis) return '<span style="color: var(--el-text-color-secondary)">暂无详细解析</span>'
  return String(analysis)
    .replace(/【(.*?)】/g, '<strong style="color: var(--el-color-primary); display: inline-block; margin-top: 4px;">【$1】</strong>')
    .replace(/\n/g, '<br/>')
}

function generateRandomPaperName() {
  const sub = subjects.value.find((s) => s.value === paperForm.subjectId)
  const subName = sub ? sub.label : '系统集成项目管理工程师'
  const year = new Date().getFullYear()
  let templates: string[] = []

  if (paperForm.questionTypeCategory === 'case') {
    templates = [
      `${year}年${subName}【全国统考下午案例分析全真模拟卷·第1套】`,
      `${year}年${subName}【名师密押案例分析专项突破套卷·A卷】`,
      `${year}年${subName}【案例计算与网络拓扑综合攻坚卷·标准卷】`,
      `${year}年${subName}【高频案例必考考点仿真大卷·强化卷】`,
    ]
  } else if (paperForm.questionTypeCategory === 'mixed') {
    templates = [
      `${year}年${subName}【综合知识+案例分析全真全景模考卷】`,
      `${year}年${subName}【考前两周全科仿真终极密押卷·A卷】`,
      `${year}年${subName}【国家统考全真考场全要素综合试卷】`,
    ]
  } else {
    templates = [
      `${year}年${subName}【考前冲刺全真模拟押题卷·第1套】`,
      `${year}年${subName}【名师密押高频考点仿真套卷·A卷】`,
      `${year}年${subName}【国家软考全真考场模拟试卷·标准卷】`,
      `${year}年${subName}【易错陷阱与核心计算专项模考卷】`,
    ]
  }
  paperForm.paperName = templates[Math.floor(Math.random() * templates.length)]
}

function onPaperCategoryChange(val: string) {
  if (val === 'case') {
    paperForm.questionCount = 4
    paperForm.duration = 150
  } else if (val === 'mixed') {
    paperForm.questionCount = 78
    paperForm.duration = 180
  } else {
    paperForm.questionCount = 75
    paperForm.duration = 150
  }
  generateRandomPaperName()
}

async function loadSubjects() {
  try {
    const res = await getAllSubjects()
    if (res?.data && res.data.length > 0) {
      subjects.value = res.data.map((s: any) => ({ label: s.name, value: Number(s.id) }))
      generateForm.subjectId = subjects.value[0].value
      paperForm.subjectId = subjects.value[0].value
      generateRandomPaperName()
      loadChapters(generateForm.subjectId)
    }
  } catch {
    subjects.value = [
      { label: '系统集成项目管理工程师', value: 1 },
      { label: '信息系统项目管理师', value: 2 },
    ]
    generateRandomPaperName()
  }
}

async function onSubjectChange(subId: number) {
  generateForm.subjectId = subId
  await loadChapters(subId)
  fetchReviewList()
}

async function onPaperSubjectChange(subId: number) {
  paperForm.subjectId = subId
  generateRandomPaperName()
  await loadChapters(subId)
}

async function handleGenerateEntirePaper() {
  if (!paperForm.paperName || paperForm.paperName.trim().length === 0) {
    generateRandomPaperName()
  }
  generatePaperLoading.value = true
  try {
    const res = await generateEntirePaper({
      model: paperForm.model,
      subjectId: paperForm.subjectId,
      paperName: paperForm.paperName,
      questionTypeCategory: paperForm.questionTypeCategory,
      includeImages: paperForm.includeImages,
      paperType: paperForm.paperType,
      questionCount: paperForm.questionCount,
      duration: paperForm.duration,
      difficulty: paperForm.difficulty,
      promptStyle: paperForm.promptStyle,
    })
    if (res?.data) {
      generatedPaperResult.value = res.data
      showPaperSuccessModal.value = true
      ElMessage.success(`🎉 ${res.data.message || 'AI 成功生成整套试卷并已同步至试卷管理！'}`)
      fetchQuota()
    }
  } catch (err: any) {
    ElMessage.error(err.message || 'AI 整套试卷生成失败')
  } finally {
    generatePaperLoading.value = false
  }
}

function goToPaperManage() {
  showPaperSuccessModal.value = false
  router.push('/exam/paper')
}

async function loadChapters(subjectId: number) {
  try {
    const res = await getChapterTree(subjectId)
    if (res?.data && res.data.length > 0) {
      chapterOptions.value = res.data
      generateForm.chapterId = res.data[0].id
      onChapterChange(res.data[0].id)
    }
  } catch {
    chapterOptions.value = [
      { id: 1, name: '第1章 信息化与发展' },
      { id: 2, name: '第6章 项目整体管理' },
    ]
  }
}

function onChapterChange(chapterId: number) {
  generateForm.chapterId = chapterId
  const ch = chapterOptions.value.find((item) => item.id === chapterId)
  if (ch && Array.isArray(ch.knowledgePoints)) {
    currentKnowledgePoints.value = ch.knowledgePoints
  } else {
    currentKnowledgePoints.value = []
  }
  generateForm.knowledgePointId = undefined
  generateForm.knowledgePoint = ''
}

function onKnowledgePointChange(kpId: number) {
  const kp = currentKnowledgePoints.value.find((item) => item.id === kpId)
  generateForm.knowledgePoint = kp ? kp.name : ''
}

async function fetchQuota() {
  try {
    const res = await getAIQuota()
    if (res?.data) {
      quota.total = res.data.total
      quota.used = res.data.used
      quota.remaining = res.data.remaining
    }
  } catch {
    // ignore
  }
}

async function fetchReviewList() {
  loading.value = true
  try {
    const res = await getAIQuestionList(query)
    if (res?.data) {
      list.value = res.data.list || []
      total.value = res.data.total || 0
    }
  } catch (err: any) {
    ElMessage.error(err.message || '获取待审核题目失败')
  } finally {
    loading.value = false
  }
}

function onSelectionChange(rows: any[]) {
  selectedRows.value = rows
}

function resetQuery() {
  query.type = ''
  query.difficulty = ''
  query.keyword = ''
  query.page = 1
  fetchReviewList()
}

async function handleGenerate() {
  generateLoading.value = true
  try {
    const res = await generateQuestions(generateForm)
    const count = res?.data?.count || generateForm.count
    ElMessage.success(`🎉 AI 命题完成！成功生成并载入 ${count} 道题目至待审池（已自动去重）`)
    fetchQuota()
    fetchReviewList()
  } catch (err: any) {
    ElMessage.error(err.message || 'AI 出题请求失败')
  } finally {
    generateLoading.value = false
  }
}

async function handlePass(row: any) {
  try {
    await approveAIQuestion(row.id)
    ElMessage.success(`题目 [ID: ${row.id}] 审核通过并正式入库！`)
    fetchReviewList()
  } catch (err: any) {
    ElMessage.error(err.message || '审核操作失败')
  }
}

function openEditDialog(row: any) {
  editForm.id = row.id
  editForm.type = row.type || 'single'
  editForm.content = row.content || row.title
  editForm.options = Array.isArray(row.options) ? JSON.parse(JSON.stringify(row.options)) : []
  editForm.answer = row.answer
  editForm.analysis = row.analysis
  editDialogVisible.value = true
}

async function submitEdit() {
  try {
    await updateAIQuestion(editForm.id, editForm)
    ElMessage.success('已保存修改')
    editDialogVisible.value = false
    fetchReviewList()
  } catch (err: any) {
    ElMessage.error(err.message || '保存失败')
  }
}

async function handleRewriteAnalysis(row: any) {
  rewritingId.value = row.id
  try {
    const res = await rewriteQuestionAnalysis(row.id)
    if (res?.data?.analysis) {
      row.analysis = res.data.analysis
      expandedAnalysisIds.value.add(row.id)
      ElMessage.success('名师解析已成功由 AI 重新深度优化！')
    }
  } catch (err: any) {
    ElMessage.error(err.message || '优化解析失败')
  } finally {
    rewritingId.value = null
  }
}

function copyQuestion(row: any) {
  let text = `【题干】${row.content || row.title}\n`
  if (row.options && row.options.length) {
    row.options.forEach((opt: any) => {
      text += `${opt.key || opt.label}. ${opt.content}\n`
    })
  }
  text += `【正确答案】${row.answer}\n`
  text += `【名师解析】\n${row.analysis}\n`

  navigator.clipboard.writeText(text).then(() => {
    ElMessage.success('试题内容及解析已复制到剪贴板！')
  }).catch(() => {
    ElMessage.info('复制失败，请手动选择复制')
  })
}

async function handleReject(row: any) {
  try {
    await ElMessageBox.confirm(`确定驳回并丢弃题目 [ID: ${row.id}] 吗？`, '驳回确认', {
      type: 'warning',
    })
    await rejectAIQuestion(row.id, '人工核验不符合标准')
    ElMessage.warning(`题目 [ID: ${row.id}] 已驳回丢弃`)
    fetchReviewList()
  } catch {
    // cancel
  }
}

async function handleBatchApprove() {
  const ids = selectedRows.value.map((r) => r.id)
  try {
    await batchApproveAIQuestions(ids)
    ElMessage.success(`已批量审核通过 ${ids.length} 道题目并入库！`)
    fetchReviewList()
  } catch (err: any) {
    ElMessage.error(err.message || '批量审核失败')
  }
}

async function handleBatchReject() {
  const ids = selectedRows.value.map((r) => r.id)
  try {
    await ElMessageBox.confirm(`确定批量驳回选中的 ${ids.length} 道题目吗？`, '批量驳回确认', {
      type: 'warning',
    })
    await batchRejectAIQuestions(ids)
    ElMessage.warning(`已批量驳回 ${ids.length} 道题目`)
    fetchReviewList()
  } catch {
    // cancel
  }
}

async function handleClearAllPending() {
  try {
    await ElMessageBox.confirm('确定清空当前待审池中的所有待审核题目吗？清空后将不可恢复。', '清空待审池确认', {
      type: 'warning',
      confirmButtonText: '确定清空',
      confirmButtonClass: 'el-button--danger',
    })
    const res = await clearPendingQuestions()
    ElMessage.success(res?.data?.message || '已清空待审核池')
    fetchReviewList()
  } catch {
    // cancel
  }
}

onMounted(() => {
  loadSubjects()
  fetchQuota()
  fetchReviewList()
})
</script>

<style scoped lang="scss">
.ai-generate-page {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.panel {
  background: #fff;
  border-radius: 10px;
  padding: 22px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.generate-panel {
  border: 1px solid #e2e8f0;

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 14px;
    border-bottom: 1px solid #f1f5f9;

    .ph-left {
      display: flex;
      align-items: center;
      gap: 12px;

      .ph-title {
        font-size: 17px;
        font-weight: 700;
        color: #1e293b;
      }

      .ph-badge {
        font-size: 12px;
        background: #e0f2fe;
        color: #0284c7;
        padding: 2px 8px;
        border-radius: 12px;
        font-weight: 600;
      }
    }

    .ph-right {
      display: flex;
      align-items: center;
      gap: 12px;

      .quota-pill {
        font-size: 13px;
        color: #64748b;
        background: #f8fafc;
        padding: 4px 12px;
        border-radius: 20px;
        border: 1px solid #e2e8f0;

        strong {
          color: var(--el-color-primary);
        }
      }
    }
  }
}

.generate-form-container {
  display: flex;
  flex-direction: column;
  gap: 16px;

  .form-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 16px 24px;
  }

  .secondary-row {
    background: #f8fafc;
    padding: 16px;
    border-radius: 8px;
    border: 1px solid #edf2f7;
  }

  .form-item {
    display: flex;
    align-items: center;
    gap: 8px;

    .label {
      font-size: 13px;
      font-weight: 600;
      color: #475569;
      white-space: nowrap;
    }
  }

  .count-item {
    display: flex;
    align-items: center;
    gap: 8px;

    .quick-count-tags {
      display: flex;
      gap: 4px;

      .count-tag {
        font-size: 12px;
        padding: 2px 8px;
        background: #fff;
        border: 1px solid #cbd5e1;
        border-radius: 4px;
        cursor: pointer;
        color: #475569;
        transition: all 0.2s;

        &:hover {
          border-color: var(--el-color-primary);
          color: var(--el-color-primary);
        }

        &.active {
          background: var(--el-color-primary);
          color: #fff;
          border-color: var(--el-color-primary);
          font-weight: 600;
        }
      }
    }
  }

  .action-btn-item {
    margin-left: auto;

    .generate-btn {
      font-weight: 700;
      padding: 0 24px;
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);
    }
  }
}

.table-panel {
  border: 1px solid #e2e8f0;

  .filter-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 14px;
    margin-bottom: 16px;
    padding-bottom: 16px;
    border-bottom: 1px solid #f1f5f9;

    .fb-items {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 12px;

      .fb-item {
        display: flex;
        align-items: center;
        gap: 6px;

        .fb-label {
          font-size: 13px;
          color: #64748b;
          white-space: nowrap;
        }
      }
    }

    .fb-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }
  }

  .table-toolbar {
    margin-bottom: 14px;

    .tt-left {
      display: flex;
      align-items: center;
      gap: 8px;

      .tt-title {
        font-size: 15px;
        font-weight: 700;
        color: #1e293b;
      }

      .tt-badge {
        background: #eef2ff;
        color: var(--el-color-primary);
        font-size: 12px;
        padding: 1px 8px;
        border-radius: 10px;
        font-weight: 600;
      }

      .tt-desc {
        font-size: 12px;
        color: #94a3b8;
        margin-left: 6px;
      }
    }
  }
}

.type-tag {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;

  &.single,
  &.single_choice {
    background: #e0e7ff;
    color: #4338ca;
  }
  &.multiple,
  &.multiple_choice {
    background: #f3e8ff;
    color: #7e22ce;
  }
  &.judge,
  &.true_false {
    background: #ffedd5;
    color: #c2410c;
  }
  &.case,
  &.case_analysis {
    background: #fce7f3;
    color: #be185d;
  }
}

.diff-stars {
  color: #f59e0b;
  font-size: 13px;
  letter-spacing: 1px;
}

.stem-content {
  padding: 4px 0;

  .stem-title {
    font-size: 14px;
    font-weight: 600;
    color: #1e293b;
    line-height: 1.6;
    margin-bottom: 8px;

    .q-id-tag {
      font-size: 11px;
      color: #94a3b8;
      font-weight: normal;
      margin-right: 4px;
    }
  }

  .options-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 8px 16px;
    margin-bottom: 10px;

    .opt-item {
      display: flex;
      align-items: baseline;
      gap: 6px;
      font-size: 13px;
      color: #334155;
      background: #f8fafc;
      padding: 5px 10px;
      border-radius: 6px;
      border: 1px solid #f1f5f9;

      .opt-badge {
        font-weight: 700;
        color: #64748b;
        min-width: 16px;
      }

      &.is-correct {
        background: #f0fdf4;
        border-color: #bbf7d0;
        color: #166534;
        font-weight: 600;

        .opt-badge {
          color: #16a34a;
        }
      }
    }
  }

  .stem-footer {
    border-top: 1px dashed #e2e8f0;
    padding-top: 8px;
    margin-top: 6px;

    .stem-ans-row {
      display: flex;
      align-items: center;
      font-size: 13px;
      color: #475569;

      .ans-label {
        font-weight: 600;
      }

      .ans-badge {
        background: var(--el-color-primary);
        color: #fff;
        font-weight: 700;
        padding: 1px 8px;
        border-radius: 4px;
        font-size: 12px;
      }

      .ans-sep {
        margin: 0 10px;
        color: #cbd5e1;
      }

      .analysis-toggle-btn {
        color: var(--el-color-primary);
        cursor: pointer;
        font-size: 12px;
        user-select: none;

        &:hover {
          text-decoration: underline;
        }
      }
    }

    .analysis-box {
      margin-top: 10px;
      background: #fafafa;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 12px 14px;
      font-size: 13px;

      .analysis-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-weight: 700;
        color: #374151;
        margin-bottom: 6px;
        border-bottom: 1px solid #f3f4f6;
        padding-bottom: 6px;
      }

      .analysis-body {
        line-height: 1.7;
        color: #4b5563;
      }
    }
  }
}

.sub-info {
  .sub-name {
    font-size: 13px;
    font-weight: 600;
    color: #334155;
  }
  .ch-name {
    font-size: 12px;
    color: #64748b;
    margin-top: 3px;
  }
}

.confidence-wrap {
  display: flex;
  align-items: center;
  gap: 6px;

  .conf-bar {
    flex: 1;
    height: 6px;
    background: #e2e8f0;
    border-radius: 3px;
    overflow: hidden;

    .conf-fill {
      height: 100%;
      border-radius: 3px;
    }
  }

  .conf-text {
    font-size: 12px;
    font-weight: 700;
    color: #475569;
    width: 32px;
  }
}

.time-text {
  font-size: 12px;
  color: #64748b;
}

.table-ops {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
}

.dialog-options-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;

  .dialog-opt-item {
    display: flex;
    align-items: center;
    gap: 8px;

    .d-opt-key {
      font-weight: 700;
      font-size: 14px;
      width: 20px;
      color: #475569;
    }
  }
}

.table-pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.paper-generate-container {
  display: flex;
  flex-direction: column;
  gap: 16px;

  .name-row {
    margin-top: -4px;
  }

  .chapter-coverage-tip {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    border-radius: 6px;
    padding: 10px 14px;
    font-size: 13px;
    color: #1e40af;
    line-height: 1.5;

    .tip-icon {
      font-size: 15px;
    }
  }
}

.paper-success-card {
  display: flex;
  flex-direction: column;
  gap: 16px;

  .psc-header {
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 8px;
    padding: 16px;

    .psc-badge {
      font-size: 12px;
      font-weight: 700;
      color: #16a34a;
      margin-bottom: 4px;
    }

    .psc-title {
      font-size: 16px;
      font-weight: 700;
      color: #14532d;
    }
  }

  .psc-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px 20px;
    background: #f8fafc;
    padding: 16px;
    border-radius: 8px;
    border: 1px solid #e2e8f0;

    .psc-item {
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 6px;

      .k {
        color: #64748b;
      }
      .v {
        font-weight: 600;
        color: #1e293b;

        &.highlight {
          color: #16a34a;
          font-weight: 700;
        }
      }
    }
  }

  .psc-tip {
    font-size: 13px;
    color: #475569;
    line-height: 1.6;
    background: #faf5ff;
    border: 1px solid #f3e8ff;
    padding: 10px 14px;
    border-radius: 6px;
  }
}

.psc-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* 案例分析题与图表配图深度定制样式 */
:deep(.case-section-title) {
  font-size: 14px;
  font-weight: 700;
  color: #1e40af;
  background: #eff6ff;
  border-left: 3px solid #3b82f6;
  padding: 4px 10px;
  border-radius: 0 4px 4px 0;
  margin: 12px 0 6px 0;
  display: block;
}

:deep(.case-question-title) {
  font-size: 14px;
  font-weight: 700;
  color: #b45309;
  background: #fffbeb;
  border-left: 3px solid #f59e0b;
  padding: 4px 10px;
  border-radius: 0 4px 4px 0;
  margin: 12px 0 6px 0;
  display: block;
}

:deep(.q-img-wrap) {
  margin: 10px 0;
  text-align: center;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 10px;

  .q-diagram-img {
    max-width: 100%;
    height: auto;
    border-radius: 6px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    display: inline-block;
  }

  .q-img-caption {
    display: block;
    font-size: 12px;
    color: #64748b;
    margin-top: 6px;
    font-weight: 500;
  }
}

:deep(svg) {
  max-width: 100%;
  height: auto;
  margin: 8px 0;
  display: block;
}
</style>
