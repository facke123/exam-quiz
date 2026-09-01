<template>
  <div class="paper-manage-page">
    <div class="table-panel">
      <!-- 筛选与操作栏 -->
      <div class="table-toolbar">
        <div class="filter-bar">
          <el-select
            v-model="query.subjectId"
            placeholder="全部科目"
            clearable
            style="width: 220px"
            @change="fetchList"
          >
            <el-option
              v-for="s in subjects"
              :key="s.value"
              :label="s.label"
              :value="s.value"
            />
          </el-select>

          <el-select
            v-model="query.type"
            placeholder="试卷类型"
            clearable
            style="width: 140px"
            @change="fetchList"
          >
            <el-option label="历年真题" value="real" />
            <el-option label="全真模拟" value="mock" />
            <el-option label="专项精练" value="practice" />
          </el-select>

          <el-button type="primary" @click="fetchList">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </div>

        <div class="action-bar">
          <el-button type="primary" plain :icon="'MagicStick'" @click="openAiPaperDialog">
            🤖 AI 一键出整卷
          </el-button>
          <el-button type="warning" @click="openImportDialog">
            📥 导入试卷
          </el-button>
          <el-button type="primary" @click="openCreatePaperDialog">
            + 手动新建试卷
          </el-button>
          <el-button type="success" @click="openAutoDialog">
            ⚡ 智能组卷
          </el-button>
        </div>
      </div>

      <!-- 试卷表格 -->
      <el-table v-loading="loading" :data="list" class="custom-table" border stripe>
        <el-table-column prop="id" label="ID" width="70" align="center" />

        <el-table-column label="试卷名称" min-width="260">
          <template #default="{ row }">
            <div class="paper-title-cell">
              <span class="p-type-tag" :class="row.type || row.paperType">
                {{ formatType(row.type || row.paperType) }}
              </span>
              <span class="p-name">{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="subjectName" label="所属科目" min-width="160" />

        <el-table-column label="题量 / 总分" width="130" align="center">
          <template #default="{ row }">
            <div class="score-info">
              <span class="q-count-badge">{{ row.questionCount || (row.questionIds ? row.questionIds.length : 0) }} 题</span>
              <span class="sep">/</span>
              <span>{{ row.totalScore || 75 }} 分</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="考试时长" width="110" align="center">
          <template #default="{ row }">
            <span>⏱️ {{ row.duration || row.totalTime || 150 }} 分钟</span>
          </template>
        </el-table-column>

        <el-table-column label="及格线" width="100" align="center">
          <template #default="{ row }">
            <span class="pass-score">{{ row.passScore || 45 }} 分</span>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 || row.status === 'published' ? 'success' : 'info'" size="small">
              {{ row.status === 1 || row.status === 'published' ? '已发布' : '草稿' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="220" align="center" fixed="right">
          <template #default="{ row }">
            <div class="table-ops">
              <el-button link type="primary" size="small" @click="handlePreview(row)">
                👁️ 预览
              </el-button>
              <el-button link type="primary" size="small" @click="openEditPaperDialog(row)">
                ✏️ 编辑试卷
              </el-button>
              <el-button link type="danger" size="small" @click="handleDeletePaper(row)">
                🗑️ 删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 📝 手动新建/编辑试卷弹窗 -->
    <el-dialog
      v-model="paperDialogVisible"
      :title="paperForm.id ? `✏️ 编辑试卷 (ID: ${paperForm.id})` : '📝 手动新建试卷'"
      width="920px"
      destroy-on-close
      :close-on-click-modal="false"
      class="paper-edit-dialog"
    >
      <div v-loading="paperDialogLoading">
        <el-form :model="paperForm" label-width="95px" class="paper-base-form">
          <el-row :gutter="16">
            <el-col :span="8">
              <el-form-item label="所属科目" required>
                <el-select v-model="paperForm.subjectId" style="width: 100%" @change="onPaperSubjectChange">
                  <el-option
                    v-for="s in subjects"
                    :key="s.value"
                    :label="s.label"
                    :value="s.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="试卷类型" required>
                <el-select v-model="paperForm.type" style="width: 100%">
                  <el-option label="历年真题" value="real" />
                  <el-option label="全真模拟" value="mock" />
                  <el-option label="专项精练" value="practice" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="试卷年份">
                <el-input-number v-model="paperForm.year" :min="2015" :max="2035" style="width: 100%" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="试卷名称" required>
            <el-input
              v-model="paperForm.name"
              placeholder="如：2026年上半年系统集成项目管理工程师真题（上午综合知识）"
            />
          </el-form-item>

          <el-row :gutter="16">
            <el-col :span="8">
              <el-form-item label="考试时长">
                <el-input-number v-model="paperForm.duration" :min="10" :max="300" :step="10" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="试卷总分">
                <el-input-number v-model="paperForm.totalScore" :min="1" :max="300" style="width: 100%" @change="onTotalScoreChange" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="及格分值">
                <el-input-number v-model="paperForm.passScore" :min="1" :max="paperForm.totalScore" style="width: 100%" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="发布状态">
            <el-radio-group v-model="paperForm.status">
              <el-radio value="published">立即发布（考生可见）</el-radio>
              <el-radio value="draft">保存为草稿</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-form>

        <!-- 试卷题目配置板块 -->
        <div class="paper-questions-section">
          <div class="pqs-header">
            <div class="pqs-title">
              <span>📚 试卷试题列表</span>
              <span class="pqs-stat">
                已选 <strong>{{ paperForm.selectedQuestions.length }}</strong> 道试题
                <span class="pqs-types">
                  (单选 {{ getQuestionTypeCount('single') }} · 多选 {{ getQuestionTypeCount('multiple') }} · 判断 {{ getQuestionTypeCount('judge') }} · 案例 {{ getQuestionTypeCount('case') + getQuestionTypeCount('subjective') }})
                </span>
              </span>
            </div>
            <div class="pqs-actions">
              <el-button type="primary" size="small" @click="openQuestionPicker">
                + 从题库挑选试题
              </el-button>
              <el-button
                v-if="paperForm.selectedQuestions.length > 0"
                type="danger"
                plain
                size="small"
                @click="clearAllSelectedQuestions"
              >
                清空已选题
              </el-button>
            </div>
          </div>

          <!-- 已选试题列表 -->
          <div v-if="paperForm.selectedQuestions.length > 0" class="selected-q-table-wrap">
            <el-table :data="paperForm.selectedQuestions" max-height="360" size="small" border stripe>
              <el-table-column label="序号" width="60" align="center">
                <template #default="{ $index }">
                  <strong>{{ $index + 1 }}</strong>
                </template>
              </el-table-column>

              <el-table-column label="题型" width="90" align="center">
                <template #default="{ row }">
                  <el-tag size="small" :type="getTypeTagType(row.type)">
                    {{ formatQType(row.type) }}
                  </el-tag>
                </template>
              </el-table-column>

              <el-table-column label="题干摘要" min-width="320">
                <template #default="{ row }">
                  <div class="q-content-snippet" :title="row.title || row.content">
                    {{ row.title || row.content }}
                  </div>
                </template>
              </el-table-column>

              <el-table-column label="难度" width="80" align="center">
                <template #default="{ row }">
                  <span class="diff-tag" :class="row.difficulty || 'medium'">
                    {{ formatDifficulty(row.difficulty) }}
                  </span>
                </template>
              </el-table-column>

              <el-table-column label="分值" width="70" align="center">
                <template #default="{ row }">
                  <span>{{ row.score || 1 }} 分</span>
                </template>
              </el-table-column>

              <el-table-column label="排序/操作" width="150" align="center">
                <template #default="{ $index }">
                  <el-button
                    link
                    type="primary"
                    size="small"
                    :disabled="$index === 0"
                    @click="moveQuestionUp($index)"
                  >
                    ⬆️
                  </el-button>
                  <el-button
                    link
                    type="primary"
                    size="small"
                    :disabled="$index === paperForm.selectedQuestions.length - 1"
                    @click="moveQuestionDown($index)"
                  >
                    ⬇️
                  </el-button>
                  <el-button
                    link
                    type="danger"
                    size="small"
                    @click="removeQuestion($index)"
                  >
                    移除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <div v-else class="empty-q-box">
            <div class="eq-icon">📋</div>
            <div class="eq-text">当前试卷尚未添加任何试题</div>
            <div class="eq-sub">点击右上角「+ 从题库挑选试题」自由检索并勾选题目录入试卷，或可先保存稍后配置</div>
            <el-button type="primary" plain size="small" style="margin-top: 12px" @click="openQuestionPicker">
              + 立即从题库选题
            </el-button>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="paperDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="paperDialogLoading" @click="submitPaperForm">
          确认保存试卷
        </el-button>
      </template>
    </el-dialog>

    <!-- 🔍 题库试题选择抽屉/弹窗 -->
    <el-dialog
      v-model="questionPickerVisible"
      title="🔍 从题库挑选试题加入试卷"
      width="960px"
      destroy-on-close
      append-to-body
      class="question-picker-dialog"
    >
      <div v-loading="pickerLoading" class="picker-container">
        <!-- 题库检索工具栏 -->
        <div class="picker-filter-bar">
          <el-select
            v-model="pickerQuery.subjectId"
            placeholder="科目"
            style="width: 180px"
            @change="onPickerSubjectChange"
          >
            <el-option
              v-for="s in subjects"
              :key="s.value"
              :label="s.label"
              :value="s.value"
            />
          </el-select>

          <el-select
            v-model="pickerQuery.chapterId"
            placeholder="全部章节"
            clearable
            style="width: 200px"
            @change="fetchPickerQuestions"
          >
            <el-option
              v-for="c in pickerChapters"
              :key="c.value"
              :label="c.label"
              :value="c.value"
            />
          </el-select>

          <el-select
            v-model="pickerQuery.type"
            placeholder="全部题型"
            clearable
            style="width: 120px"
            @change="fetchPickerQuestions"
          >
            <el-option label="单选题" value="single" />
            <el-option label="多选题" value="multiple" />
            <el-option label="判断题" value="judge" />
            <el-option label="案例题" value="case" />
          </el-select>

          <el-input
            v-model="pickerQuery.keyword"
            placeholder="搜索题干关键词..."
            clearable
            style="width: 200px"
            @keyup.enter="fetchPickerQuestions"
          />

          <el-button type="primary" @click="fetchPickerQuestions">搜索</el-button>
        </div>

        <!-- 题库试题表格 -->
        <el-table
          ref="pickerTableRef"
          :data="pickerQuestionList"
          row-key="id"
          max-height="420"
          class="picker-table"
          border
          stripe
          @selection-change="handlePickerSelectionChange"
        >
          <el-table-column type="selection" width="50" align="center" :selectable="isQuestionSelectable" />

          <el-table-column prop="id" label="ID" width="65" align="center" />

          <el-table-column label="题型" width="85" align="center">
            <template #default="{ row }">
              <el-tag size="small" :type="getTypeTagType(row.type)">
                {{ formatQType(row.type) }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="题干内容" min-width="360">
            <template #default="{ row }">
              <div class="picker-q-content">
                <div class="pqc-title">{{ row.title || row.content }}</div>
                <div v-if="row.options && row.options.length" class="pqc-opts">
                  <span v-for="opt in row.options" :key="opt.label || opt.key" class="pqc-opt-item">
                    {{ opt.label || opt.key }}. {{ opt.content }}
                  </span>
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="chapterName" label="章节" width="140" show-overflow-tooltip />

          <el-table-column label="难度" width="75" align="center">
            <template #default="{ row }">
              <span class="diff-tag" :class="row.difficulty || 'medium'">
                {{ formatDifficulty(row.difficulty) }}
              </span>
            </template>
          </el-table-column>
        </el-table>

        <!-- 题库分页 -->
        <div class="picker-pagination">
          <span class="picker-tip">
            当前已勾选 <strong>{{ pickerSelectedRows.length }}</strong> 道新试题
            <span v-if="paperForm.selectedQuestions.length > 0">（试卷中已有 {{ paperForm.selectedQuestions.length }} 题）</span>
          </span>
          <el-pagination
            v-model:current-page="pickerQuery.page"
            v-model:page-size="pickerQuery.pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="pickerTotal"
            layout="total, sizes, prev, pager, next"
            small
            @size-change="fetchPickerQuestions"
            @current-change="fetchPickerQuestions"
          />
        </div>
      </div>

      <template #footer>
        <el-button @click="questionPickerVisible = false">取消</el-button>
        <el-button
          type="primary"
          :disabled="pickerSelectedRows.length === 0"
          @click="confirmAddSelectedQuestions"
        >
          确认添加勾选题入卷 (+{{ pickerSelectedRows.length }} 题)
        </el-button>
      </template>
    </el-dialog>

    <!-- 👁️ 试卷内容全景预览抽屉 -->
    <el-drawer
      v-model="previewDrawerVisible"
      title="📑 试卷内容全景预览"
      size="820px"
      destroy-on-close
      class="paper-preview-drawer"
    >
      <div v-loading="previewLoading" class="preview-drawer-content">
        <template v-if="previewPaper">
          <!-- 试卷头部信息卡片 -->
          <div class="preview-hero-card">
            <div class="phc-top">
              <span class="phc-type" :class="previewPaper.type">
                {{ formatType(previewPaper.type) }}
              </span>
              <h2 class="phc-name">{{ previewPaper.name }}</h2>
            </div>

            <div class="phc-meta-bar">
              <span class="pm-item">📚 <strong>{{ previewPaper.subjectName || '软考科目' }}</strong></span>
              <span class="pm-sep">|</span>
              <span class="pm-item">⏱️ 时长: <strong>{{ previewPaper.duration || previewPaper.totalTime || 150 }} 分钟</strong></span>
              <span class="pm-sep">|</span>
              <span class="pm-item">📊 总分: <strong>{{ previewPaper.totalScore || 75 }} 分</strong></span>
              <span class="pm-sep">|</span>
              <span class="pm-item">🎯 及格线: <strong>{{ previewPaper.passScore || 45 }} 分</strong></span>
              <span class="pm-sep">|</span>
              <span class="pm-item">📝 题量: <strong>{{ previewPaper.questions ? previewPaper.questions.length : previewPaper.questionCount || 0 }} 题</strong></span>
            </div>

            <!-- 控制工具栏 -->
            <div class="phc-toolbar">
              <el-switch
                v-model="previewExpandAnalysis"
                active-text="展开答案与考点解析"
                inactive-text="仅看题目选项"
              />
              <div class="phc-btn-group">
                <el-button size="small" @click="copyPaperText">
                  📋 复制试卷纯文本
                </el-button>
                <el-button size="small" type="primary" plain @click="openEditPaperDialog(previewPaper)">
                  ✏️ 编辑这套试卷
                </el-button>
              </div>
            </div>
          </div>

          <!-- 试卷主体双栏布局 -->
          <div class="preview-body-layout">
            <!-- 左侧试题全景列表 -->
            <div class="preview-questions-flow">
              <template v-if="previewPaper.questions && previewPaper.questions.length > 0">
                <div
                  v-for="(q, idx) in previewPaper.questions"
                  :id="`preview-q-${idx}`"
                  :key="q.id || idx"
                  class="preview-question-card"
                >
                  <!-- 题目头部 -->
                  <div class="pqc-card-header">
                    <div class="pqc-left">
                      <span class="pqc-index">第 {{ idx + 1 }} 题</span>
                      <el-tag size="small" :type="getTypeTagType(q.type)">
                        {{ formatQType(q.type) }}
                      </el-tag>
                      <span v-if="q.difficulty" class="diff-tag" :class="q.difficulty">
                        {{ formatDifficulty(q.difficulty) }}
                      </span>
                    </div>
                    <div class="pqc-right">
                      <span class="pqc-score">{{ q.score || 1 }} 分</span>
                    </div>
                  </div>

                  <!-- 题干 (支持富文本/SVG图表/Markdown配图) -->
                  <div class="pqc-stem" v-html="formatQuestionContent(q.title || q.content)" />

                  <!-- 选项列表 (单选/多选/判断) -->
                  <div v-if="q.options && q.options.length" class="pqc-options-list">
                    <div
                      v-for="opt in q.options"
                      :key="opt.label || opt.key"
                      class="pqc-option-row"
                      :class="{ 'is-correct': isOptionCorrect(q.answer, opt.label || opt.key) && previewExpandAnalysis }"
                    >
                      <span class="opt-prefix">{{ opt.label || opt.key }}.</span>
                      <span class="opt-text">{{ opt.content }}</span>
                      <span
                        v-if="isOptionCorrect(q.answer, opt.label || opt.key) && previewExpandAnalysis"
                        class="opt-correct-badge"
                      >
                        ✓ 正确答案
                      </span>
                    </div>
                  </div>

                  <!-- 答案与解析 (可折叠) -->
                  <div v-if="previewExpandAnalysis" class="pqc-answer-box">
                    <div class="pqc-ans-line">
                      <span class="ans-label">【标准答案】</span>
                      <div class="ans-val" v-html="formatAnalysisHtml(q.answer || '详见解析')" />
                    </div>
                    <div v-if="q.analysis" class="pqc-ana-line">
                      <span class="ana-label">【名师解析】</span>
                      <div class="ana-content" v-html="formatAnalysisHtml(q.analysis)" />
                    </div>
                  </div>
                </div>
              </template>

              <div v-else class="preview-empty-tip">
                <el-empty description="该试卷暂未关联具体题目数据" />
              </div>
            </div>

            <!-- 右侧题号快速导航答题卡 -->
            <div v-if="previewPaper.questions && previewPaper.questions.length > 0" class="preview-index-nav">
              <div class="pin-title">📋 答题卡快速定位</div>
              <div class="pin-grid">
                <button
                  v-for="(q, idx) in previewPaper.questions"
                  :key="idx"
                  class="pin-btn"
                  @click="scrollToQuestion(idx)"
                >
                  {{ idx + 1 }}
                </button>
              </div>
            </div>
          </div>
        </template>
      </div>
    </el-drawer>

    <!-- 📥 导入试卷弹窗 -->
    <el-dialog
      v-model="importDialogVisible"
      title="📥 导入完整试卷 (Word / Excel / 文本批量解析入卷)"
      width="780px"
      destroy-on-close
    >
      <el-form :model="importForm" label-width="95px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="所属科目" required>
              <el-select v-model="importForm.subjectId" style="width: 100%">
                <el-option
                  v-for="s in subjects"
                  :key="s.value"
                  :label="s.label"
                  :value="s.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="试卷类型" required>
              <el-select v-model="importForm.type" style="width: 100%">
                <el-option label="历年真题" value="real" />
                <el-option label="全真模拟" value="mock" />
                <el-option label="专项精练" value="practice" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="试卷名称" required>
          <el-input
            v-model="importForm.name"
            placeholder="如：2024年下半年系统集成项目管理工程师真题（上午综合知识）"
          />
        </el-form-item>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="考试时长">
              <el-input-number v-model="importForm.duration" :min="30" :max="240" :step="10" />
              <span style="margin-left: 8px; color: var(--text-muted)">分钟</span>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="试卷年份">
              <el-input-number v-model="importForm.year" :min="2010" :max="2035" />
              <span style="margin-left: 8px; color: var(--text-muted)">年</span>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="试卷文档">
          <div style="width: 100%">
            <div style="display: flex; gap: 12px; margin-bottom: 10px; align-items: center">
              <el-button type="primary" plain @click="triggerPaperUpload">
                📎 上传 Word (.docx) / Excel (.xlsx) 试卷文件
              </el-button>
              <span v-if="parsedQuestions.length > 0" style="color: var(--success); font-weight: 600">
                ✅ 已解析出 {{ parsedQuestions.length }} 道试题
              </span>
              <span v-else style="color: var(--text-muted); font-size: 13px">
                支持标准题干、选项A/B/C/D、答案与解析自动提取
              </span>
            </div>
            <input
              ref="paperFileInputRef"
              type="file"
              accept=".docx,.xlsx,.xls,.txt"
              style="display: none"
              @change="onPaperFileSelected"
            >
          </div>
        </el-form-item>

        <el-form-item label="或粘贴试卷">
          <el-input
            v-model="paperRawText"
            type="textarea"
            :rows="6"
            placeholder="也可直接粘贴整套试卷文本内容，自动提取题干、选项、答案与解析..."
            @input="onPaperTextInput"
          />
        </el-form-item>

        <!-- 试题解析列表预览 -->
        <div v-if="parsedQuestions.length > 0" style="margin-top: 10px">
          <div style="font-size: 13px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px">
            试卷题目解析预览（前 3 题展示）：
          </div>
          <div class="parsed-preview-box">
            <div
              v-for="(q, idx) in parsedQuestions.slice(0, 3)"
              :key="idx"
              class="preview-q-item"
            >
              <div class="pqi-title">
                <strong>{{ idx + 1 }}. [{{ q.type === 'single' ? '单选' : q.type === 'multiple' ? '多选' : '问答' }}]</strong>
                {{ q.content }}
              </div>
              <div v-if="q.options && q.options.length" class="pqi-opts">
                <span v-for="opt in q.options" :key="opt.key" style="margin-right: 12px">
                  {{ opt.key }}. {{ opt.content }}
                </span>
              </div>
              <div class="pqi-ans">
                <span style="color: var(--success); font-weight: 600">【答案】{{ q.answer }}</span>
                <span v-if="q.analysis" style="margin-left: 12px; color: var(--text-muted)">【解析】{{ q.analysis }}</span>
              </div>
            </div>
            <div v-if="parsedQuestions.length > 3" style="text-align: center; color: var(--text-muted); font-size: 12px; padding-top: 4px">
              ... 及其他 {{ parsedQuestions.length - 3 }} 道题目，全部将一并入库建卷
            </div>
          </div>
        </div>
      </el-form>

      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="importLoading"
          :disabled="parsedQuestions.length === 0 && !paperRawText.trim()"
          @click="submitImportPaper"
        >
          确认导入试卷并生成 (共 {{ parsedQuestions.length }} 题)
        </el-button>
      </template>
    </el-dialog>

    <!-- ⚡ 智能组卷弹窗 -->
    <el-dialog
      v-model="autoDialogVisible"
      title="⚡ 软考智能组卷引擎"
      width="560px"
      destroy-on-close
    >
      <el-form :model="autoForm" label-width="100px">
        <el-form-item label="目标科目" required>
          <el-select v-model="autoForm.subjectId" style="width: 100%">
            <el-option
              v-for="s in subjects"
              :key="s.value"
              :label="s.label"
              :value="s.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="试卷名称" required>
          <el-input v-model="autoForm.name" placeholder="如：2026年系统集成全真模拟卷（一）" />
        </el-form-item>

        <el-form-item label="试卷类型">
          <el-select v-model="autoForm.type" style="width: 100%">
            <el-option label="全真模拟" value="mock" />
            <el-option label="历年真题" value="real" />
            <el-option label="专项精练" value="practice" />
          </el-select>
        </el-form-item>

        <el-form-item label="考试时长">
          <el-input-number v-model="autoForm.totalTime" :min="30" :max="240" :step="10" />
          <span style="margin-left: 10px; color: var(--gray-5)">分钟</span>
        </el-form-item>

        <el-form-item label="试卷题量">
          <el-input-number v-model="autoForm.questionCount" :min="5" :max="150" :step="5" />
          <span style="margin-left: 10px; color: var(--gray-5)">道题</span>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="autoDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="autoLoading" @click="submitAutoPaper">
          开始自动组卷并生成
        </el-button>
      </template>
    </el-dialog>

    <!-- AI 一键出整卷弹窗 -->
    <el-dialog
      v-model="aiPaperDialogVisible"
      title="🤖 AI 大模型一键生成整套试卷并入库"
      width="820px"
      :close-on-click-modal="false"
    >
      <el-form label-width="110px">
        <el-form-item label="试卷架构" required>
          <el-radio-group v-model="aiPaperForm.questionTypeCategory" @change="onPaperCategoryChange">
            <el-radio-button label="case">📑 案例分析大题整卷 (国考下午科目二·推荐)</el-radio-button>
            <el-radio-button label="single">🎯 客观单选综合卷 (国考上午科目一)</el-radio-button>
            <el-radio-button label="mixed">🌟 全景综合全套卷 (客观单选 + 案例大题)</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="考点配图支持">
          <div style="display: flex; align-items: center; gap: 12px">
            <el-switch
              v-model="aiPaperForm.includeImages"
              active-text="包含考点专业图表配图 (双代号时标网络图/EVM曲线/网络拓扑/架构图)"
            />
            <el-tag v-if="aiPaperForm.includeImages" type="success" size="small">矢量高清 SVG / 自适应缩放</el-tag>
          </div>
        </el-form-item>

        <el-form-item label="基座模型">
          <el-select
            v-model="aiPaperForm.model"
            filterable
            allow-create
            default-first-option
            placeholder="请选择基座模型（留空使用系统默认配置）"
            style="width: 100%"
          >
            <el-option label="⚙️ 系统默认配置模型 (当前生效)" value="" />
            <el-option label="💎 Gemini 2.5 Flash (推荐 / 秒级高速出题)" value="gemini-2.5-flash" />
            <el-option label="⚡ Gemini 2.0 Flash (极速推理)" value="gemini-2.0-flash" />
            <el-option label="🧠 Gemini 1.5 Pro (深度逻辑与高阶推理)" value="gemini-1.5-pro" />
            <el-option label="🐳 DeepSeek-Chat (深度求索 V3)" value="deepseek-chat" />
            <el-option label="🔬 DeepSeek-Reasoner (R1 深度思考)" value="deepseek-reasoner" />
            <el-option label="🌟 Qwen-Plus (阿里通义千问)" value="qwen-plus" />
            <el-option label="✨ GLM-4-Flash (智谱清言)" value="glm-4-flash" />
          </el-select>
        </el-form-item>

        <el-form-item label="目标科目" required>
          <el-select v-model="aiPaperForm.subjectId" style="width: 100%" @change="onAiSubjectChange">
            <el-option
              v-for="s in subjects"
              :key="s.value"
              :label="s.label"
              :value="s.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="试卷名称" required>
          <div style="display: flex; gap: 8px; width: 100%">
            <el-input v-model="aiPaperForm.paperName" placeholder="如：2026年系统集成【全国统考下午案例分析全真模拟卷·第1套】" style="flex: 1" />
            <el-button type="info" plain :icon="'MagicStick'" @click="generateAiRandomName">🎲 随机名称</el-button>
          </div>
        </el-form-item>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="试卷类型">
              <el-select v-model="aiPaperForm.paperType" style="width: 100%">
                <el-option label="全真模拟卷" value="mock" />
                <el-option label="历年真题仿真" value="real" />
                <el-option label="专项精练冲刺" value="practice" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="考试时长">
              <el-input-number v-model="aiPaperForm.duration" :min="30" :max="240" :step="10" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="整卷题量">
              <el-select v-if="aiPaperForm.questionTypeCategory === 'case'" v-model="aiPaperForm.questionCount" style="width: 100%">
                <el-option label="3 道大题 (核心案例模考 · 75分)" :value="3" />
                <el-option label="4 道大题 (软考官方下午标准大卷·推荐 · 75分)" :value="4" />
                <el-option label="5 道大题 (攻坚冲刺套卷 · 100分)" :value="5" />
              </el-select>
              <el-select v-else-if="aiPaperForm.questionTypeCategory === 'mixed'" v-model="aiPaperForm.questionCount" style="width: 100%">
                <el-option label="32 题 (30单选 + 2案例大题)" :value="32" />
                <el-option label="53 题 (50单选 + 3案例大题)" :value="53" />
                <el-option label="78 题 (75单选 + 3案例大题·推荐)" :value="78" />
              </el-select>
              <el-select v-else v-model="aiPaperForm.questionCount" style="width: 100%">
                <el-option label="10 题 (考前速测)" :value="10" />
                <el-option label="25 题 (章节单元冲刺)" :value="25" />
                <el-option label="50 题 (精选题量)" :value="50" />
                <el-option label="75 题 (软考国家官方标准卷·推荐)" :value="75" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="难度等级">
              <el-select v-model="aiPaperForm.difficulty" style="width: 100%">
                <el-option label="基础巩固 (2星)" :value="2" />
                <el-option label="核心考点 (3星)" :value="3" />
                <el-option label="进阶提升 (4星)" :value="4" />
                <el-option label="压轴冲刺 (5星)" :value="5" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="出题风格">
          <el-select v-model="aiPaperForm.promptStyle" style="width: 100%">
            <el-option label="🎯 历年真题风 (标准规范)" value="standard" />
            <el-option label="⚠️ 易错陷阱风 (避坑精练)" value="trap" />
            <el-option label="🧮 实战计算风 (网络图与EVM攻坚)" value="calculation" />
            <el-option label="📖 概念辨析风 (流程与规范)" value="concept" />
          </el-select>
        </el-form-item>
      </el-form>

      <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 10px 14px; font-size: 13px; color: #1e40af; line-height: 1.5; margin-top: 10px">
        ℹ️ 点击「开始生成」后，AI 将自动针对所选科目核心考点并发命题（涵盖背景案例材料、专业图表、分问拆解与采分标准），生成完成后试卷将直接上架并在列表中刷新呈现！
      </div>

      <template #footer>
        <el-button @click="aiPaperDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="aiPaperLoading"
          @click="submitAiPaper"
        >
          🚀 开始生成整套试卷 ({{ aiPaperForm.questionCount }} 题)
        </el-button>
      </template>
    </el-dialog>

    <!-- AI 出卷实时进度动画弹窗（彻底杜绝 524 超时与白屏等待） -->
    <el-dialog
      v-model="aiProgressVisible"
      title="🤖 AI 大模型整套试卷命制中"
      width="460px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
      center
    >
      <div style="text-align: center; padding: 15px 10px 5px">
        <el-progress
          type="circle"
          :percentage="aiProgressPercent"
          :status="aiProgressPercent >= 100 ? 'success' : undefined"
          :stroke-width="8"
          :width="120"
        />
        <div style="margin-top: 18px; font-size: 15px; font-weight: 600; color: #1e293b">
          {{ aiProgressStepText }}
        </div>
        <div style="margin-top: 8px; font-size: 12px; color: #64748b; line-height: 1.6">
          正在调用国家软考命题专家大模型进行宏批次命题，全程智能防重复与结构化解析校验...
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as XLSX from 'xlsx'
import mammoth from 'mammoth'
import {
  getPaperList,
  getPaperDetail,
  createPaper,
  updatePaper,
  deletePaper,
  autoGeneratePaper,
  importPaper,
  getAllSubjects,
  getChapterTree,
} from '@/api/exam'
import { generateEntirePaper, generateEntirePaperAsync, getAITaskDetail, getAIConfig } from '@/api/ai'
import { getQuestionList, type Question, type QuestionType } from '@/api/question'

const loading = ref(false)
const list = ref<any[]>([])
const subjects = ref<{ label: string; value: number }[]>([])

const query = reactive<any>({
  page: 1,
  pageSize: 50,
  subjectId: undefined,
  type: '',
})

// ==================== 手动新建/编辑试卷 ====================
const paperDialogVisible = ref(false)
const paperDialogLoading = ref(false)
const paperForm = reactive<{
  id?: number
  name: string
  subjectId: number
  type: string
  year: number
  duration: number
  totalScore: number
  passScore: number
  status: 'published' | 'draft'
  selectedQuestions: any[]
}>({
  id: undefined,
  name: '',
  subjectId: 1,
  type: 'real',
  year: new Date().getFullYear(),
  duration: 150,
  totalScore: 75,
  passScore: 45,
  status: 'published',
  selectedQuestions: [],
})

function openCreatePaperDialog() {
  paperForm.id = undefined
  paperForm.name = ''
  paperForm.subjectId = query.subjectId || (subjects.value[0]?.value || 1)
  paperForm.type = 'real'
  paperForm.year = new Date().getFullYear()
  paperForm.duration = 150
  paperForm.totalScore = 75
  paperForm.passScore = 45
  paperForm.status = 'published'
  paperForm.selectedQuestions = []
  paperDialogVisible.value = true
}

async function openEditPaperDialog(row: any) {
  paperForm.id = row.id
  paperForm.name = row.name
  paperForm.subjectId = row.subjectId || 1
  paperForm.type = row.type || 'real'
  paperForm.year = row.year || new Date().getFullYear()
  paperForm.duration = row.duration || row.totalTime || 150
  paperForm.totalScore = row.totalScore || 75
  paperForm.passScore = row.passScore || Math.round((row.totalScore || 75) * 0.6)
  paperForm.status = row.status === 1 || row.status === 'published' ? 'published' : 'draft'
  paperForm.selectedQuestions = []
  paperDialogVisible.value = true

  paperDialogLoading.value = true
  try {
    const res = await getPaperDetail(row.id)
    if (res?.data) {
      const data = res.data
      paperForm.name = data.name
      paperForm.subjectId = data.subjectId
      paperForm.type = data.type || 'real'
      paperForm.year = data.year || new Date().getFullYear()
      paperForm.duration = data.duration || data.totalTime || 150
      paperForm.totalScore = data.totalScore || 75
      paperForm.passScore = data.passScore || Math.round((data.totalScore || 75) * 0.6)
      paperForm.status = data.status === 1 || data.status === 'published' ? 'published' : 'draft'
      if (Array.isArray(data.questions)) {
        paperForm.selectedQuestions = [...data.questions]
      }
    }
  } catch (err: any) {
    ElMessage.error(err.message || '获取试卷详情失败')
  } finally {
    paperDialogLoading.value = false
  }
}

function onPaperSubjectChange() {
  // 当更换科目时，已选试题若不在该科目下可由用户自行决定保留或清空
}

function onTotalScoreChange(val: number) {
  paperForm.passScore = Math.round(val * 0.6)
}

function getQuestionTypeCount(type: string): number {
  if (type === 'single') {
    return paperForm.selectedQuestions.filter((q) => q.type === 'single' || q.type === 'single_choice').length
  }
  if (type === 'multiple') {
    return paperForm.selectedQuestions.filter((q) => q.type === 'multiple' || q.type === 'multiple_choice').length
  }
  if (type === 'judge') {
    return paperForm.selectedQuestions.filter((q) => q.type === 'judge' || q.type === 'true_false').length
  }
  if (type === 'case') {
    return paperForm.selectedQuestions.filter((q) => q.type === 'case' || q.type === 'case_analysis' || q.type === 'subjective' || q.type === 'essay').length
  }
  return paperForm.selectedQuestions.filter((q) => q.type === type).length
}

function moveQuestionUp(index: number) {
  if (index <= 0) return
  const temp = paperForm.selectedQuestions[index]
  paperForm.selectedQuestions[index] = paperForm.selectedQuestions[index - 1]
  paperForm.selectedQuestions[index - 1] = temp
}

function moveQuestionDown(index: number) {
  if (index >= paperForm.selectedQuestions.length - 1) return
  const temp = paperForm.selectedQuestions[index]
  paperForm.selectedQuestions[index] = paperForm.selectedQuestions[index + 1]
  paperForm.selectedQuestions[index + 1] = temp
}

function removeQuestion(index: number) {
  paperForm.selectedQuestions.splice(index, 1)
  if (paperForm.selectedQuestions.length > 0) {
    paperForm.totalScore = paperForm.selectedQuestions.length
    paperForm.passScore = Math.round(paperForm.totalScore * 0.6)
  }
}

function clearAllSelectedQuestions() {
  paperForm.selectedQuestions = []
}

async function submitPaperForm() {
  if (!paperForm.name.trim()) return ElMessage.warning('请输入试卷名称')
  paperDialogLoading.value = true
  try {
    const qIds = paperForm.selectedQuestions.map((q) => Number(q.id))
    const payload = {
      name: paperForm.name.trim(),
      subjectId: Number(paperForm.subjectId),
      type: paperForm.type,
      year: Number(paperForm.year),
      duration: Number(paperForm.duration),
      totalTime: Number(paperForm.duration),
      totalScore: Number(paperForm.totalScore) || (qIds.length > 0 ? qIds.length : 75),
      passScore: Number(paperForm.passScore) || Math.round((Number(paperForm.totalScore) || 75) * 0.6),
      status: paperForm.status,
      questionIds: qIds,
    }

    if (paperForm.id) {
      await updatePaper(paperForm.id, payload)
      ElMessage.success('试卷修改成功')
    } else {
      await createPaper(payload)
      ElMessage.success('试卷创建成功')
    }
    paperDialogVisible.value = false
    fetchList()
  } catch (err: any) {
    ElMessage.error(err.message || '保存试卷失败')
  } finally {
    paperDialogLoading.value = false
  }
}

// ==================== 题库挑选试题 ====================
const questionPickerVisible = ref(false)
const pickerLoading = ref(false)
const pickerTableRef = ref<any>(null)
const pickerChapters = ref<{ label: string; value: number }[]>([])
const pickerQuestionList = ref<Question[]>([])
const pickerTotal = ref(0)
const pickerSelectedRows = ref<Question[]>([])

const pickerQuery = reactive({
  subjectId: 1,
  chapterId: undefined as number | undefined,
  type: '' as QuestionType | '',
  keyword: '',
  page: 1,
  pageSize: 10,
})

async function openQuestionPicker() {
  pickerQuery.subjectId = paperForm.subjectId || 1
  pickerQuery.chapterId = undefined
  pickerQuery.type = ''
  pickerQuery.keyword = ''
  pickerQuery.page = 1
  pickerSelectedRows.value = []
  questionPickerVisible.value = true

  await loadPickerChapters()
  fetchPickerQuestions()
}

async function loadPickerChapters() {
  try {
    const res = await getChapterTree(pickerQuery.subjectId)
    if (res?.data) {
      pickerChapters.value = res.data.map((c: any) => ({ label: c.name, value: Number(c.id) }))
    } else {
      pickerChapters.value = []
    }
  } catch {
    pickerChapters.value = []
  }
}

async function onPickerSubjectChange() {
  pickerQuery.chapterId = undefined
  await loadPickerChapters()
  fetchPickerQuestions()
}

async function fetchPickerQuestions() {
  pickerLoading.value = true
  try {
    const res = await getQuestionList({
      page: pickerQuery.page,
      pageSize: pickerQuery.pageSize,
      subjectId: pickerQuery.subjectId,
      chapterId: pickerQuery.chapterId,
      type: pickerQuery.type || undefined,
      keyword: pickerQuery.keyword || undefined,
    } as any)

    if (res?.data?.list) {
      pickerQuestionList.value = res.data.list
      pickerTotal.value = res.data.total || res.data.list.length
    } else if (Array.isArray(res?.data)) {
      pickerQuestionList.value = res.data
      pickerTotal.value = res.data.length
    }
  } catch (err: any) {
    ElMessage.error(err.message || '获取题库列表失败')
  } finally {
    pickerLoading.value = false
  }
}

function isQuestionSelectable(row: Question) {
  // 检查是否已经在当前试卷列表中
  return !paperForm.selectedQuestions.some((q) => Number(q.id) === Number(row.id))
}

function handlePickerSelectionChange(rows: Question[]) {
  pickerSelectedRows.value = rows
}

function confirmAddSelectedQuestions() {
  if (pickerSelectedRows.value.length === 0) return
  let addedCount = 0
  for (const q of pickerSelectedRows.value) {
    if (!paperForm.selectedQuestions.some((item) => Number(item.id) === Number(q.id))) {
      paperForm.selectedQuestions.push({ ...q })
      addedCount++
    }
  }

  paperForm.totalScore = paperForm.selectedQuestions.length
  paperForm.passScore = Math.round(paperForm.totalScore * 0.6)

  ElMessage.success(`已成功添加 ${addedCount} 道试题至当前试卷！`)
  questionPickerVisible.value = false
}

// ==================== 试卷全景预览 ====================
const previewDrawerVisible = ref(false)
const previewLoading = ref(false)
const previewPaper = ref<any>(null)
const previewExpandAnalysis = ref(true)

async function handlePreview(row: any) {
  previewDrawerVisible.value = true
  previewLoading.value = true
  previewPaper.value = { ...row, questions: [] }

  try {
    const res = await getPaperDetail(row.id)
    if (res?.data) {
      previewPaper.value = res.data
    }
  } catch (err: any) {
    ElMessage.error(err.message || '获取试卷详情失败')
  } finally {
    previewLoading.value = false
  }
}

function isOptionCorrect(answer: string, key: string): boolean {
  if (!answer || !key) return false
  return answer.toUpperCase().includes(key.toUpperCase())
}

function scrollToQuestion(idx: number) {
  nextTick(() => {
    const el = document.getElementById(`preview-q-${idx}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  })
}

function copyPaperText() {
  if (!previewPaper.value || !previewPaper.value.questions) return
  let text = `【试卷名称】${previewPaper.value.name}\n`
  text += `【所属科目】${previewPaper.value.subjectName || ''}\n`
  text += `【考试时长】${previewPaper.value.duration || 150}分钟 | 总分: ${previewPaper.value.totalScore || 75}分\n\n`

  previewPaper.value.questions.forEach((q: any, i: number) => {
    text += `${i + 1}. [${formatQType(q.type)}] ${q.title || q.content}\n`
    if (q.options && q.options.length) {
      q.options.forEach((opt: any) => {
        text += `   ${opt.label || opt.key}. ${opt.content}\n`
      })
    }
    text += `   【答案】${q.answer || ''}\n`
    if (q.analysis) {
      text += `   【解析】${q.analysis}\n`
    }
    text += `\n`
  })

  navigator.clipboard.writeText(text).then(() => {
    ElMessage.success('整套试卷文本已成功复制到剪贴板！')
  })
}

// ==================== 智能组卷 ====================
const autoDialogVisible = ref(false)
const autoLoading = ref(false)
const autoForm = reactive({
  subjectId: 1,
  name: '2026年系统集成全真模拟卷（一）',
  type: 'mock',
  totalTime: 150,
  questionCount: 75,
})

function openAutoDialog() {
  autoDialogVisible.value = true
}

async function submitAutoPaper() {
  autoLoading.value = true
  try {
    await autoGeneratePaper({
      subjectId: autoForm.subjectId,
      name: autoForm.name,
      totalTime: autoForm.totalTime,
      totalScore: autoForm.questionCount,
      passScore: Math.round(autoForm.questionCount * 0.6),
      rules: [
        {
          type: 'single',
          difficulty: 'medium',
          chapterIds: [],
          count: autoForm.questionCount,
          scorePerQuestion: 1,
        },
      ],
    })
    ElMessage.success('智能组卷成功，已自动抽取题库试题完成组卷！')
    autoDialogVisible.value = false
    fetchList()
  } catch (err: any) {
    ElMessage.error(err.message || '智能组卷失败')
  } finally {
    autoLoading.value = false
  }
}

function parseMarkdownTable(text: string) {
  return text.replace(/((?:\|[^\n\r]+\|\r?\n?){2,})/g, (match) => {
    const rawLines = match.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
    if (rawLines.length < 2) return match
    if (!rawLines[1].includes('-')) return match

    const parseRow = (line: string) => {
      const parts = line.split('|').map((p) => p.trim())
      if (parts[0] === '') parts.shift()
      if (parts[parts.length - 1] === '') parts.pop()
      return parts
    }

    const headerCells = parseRow(rawLines[0])
    const bodyRows = rawLines.slice(2).map(parseRow)

    let html = '<div class="q-table-responsive"><table class="q-case-table"><thead><tr>'
    headerCells.forEach((h) => {
      html += `<th>${h}</th>`
    })
    html += '</tr></thead><tbody>'
    bodyRows.forEach((row) => {
      html += '<tr>'
      row.forEach((cell) => {
        html += `<td>${cell}</td>`
      })
      html += '</tr>'
    })
    html += '</tbody></table></div>'
    return html
  })
}

function formatQuestionContent(content: string) {
  if (!content) return ''
  let html = String(content)

  // 1. Markdown 图片语法 ![alt](url) 转为响应式图片
  html = html.replace(
    /!\[(.*?)\]\((.*?)\)/g,
    '<div class="q-img-wrap"><img src="$2" alt="$1" class="q-diagram-img" /><span class="q-img-caption">$1</span></div>'
  )

  // 2. Markdown 表格转为专业考卷响应式表格
  html = parseMarkdownTable(html)

  // 3. 案例分节与小问加粗排版
  html = html
    .replace(/(【案例背景】|【案例说明】|【说明】)/g, '<div class="case-section-title">$1</div>')
    .replace(/(【问题\s*\d+】[（(][^）)]*[）)]|【问题\s*\d+】)/g, '<div class="case-question-title">$1</div>')
    .replace(/\n/g, '<br/>')

  return html
}

function formatAnalysisHtml(analysis: string) {
  if (!analysis) return '<span style="color: var(--text-muted)">暂无详细解析</span>'
  return String(analysis)
    .replace(/【(.*?)】/g, '<strong style="color: var(--primary); display: inline-block; margin-top: 6px;">【$1】</strong>')
    .replace(/\n/g, '<br/>')
}

// ==================== AI 一键整卷生成 ====================
const aiPaperDialogVisible = ref(false)
const aiPaperLoading = ref(false)
const aiPaperForm = reactive({
  model: '',
  subjectId: 1,
  paperName: '',
  questionTypeCategory: 'case',
  includeImages: true,
  paperType: 'mock',
  duration: 150,
  questionCount: 4,
  difficulty: 3,
  promptStyle: 'standard',
})

function generateAiRandomName() {
  const sub = subjects.value.find((s) => s.value === aiPaperForm.subjectId)
  const subName = sub ? sub.label : '系统集成项目管理'
  const year = new Date().getFullYear()
  let names: string[] = []

  if (aiPaperForm.questionTypeCategory === 'case') {
    names = [
      `${year}年${subName}【全国统考下午案例分析全真模拟卷·第1套】`,
      `${year}年${subName}【名师密押案例分析专项突破套卷·A卷】`,
      `${year}年${subName}【案例计算与网络拓扑综合攻坚卷·标准卷】`,
      `${year}年${subName}【高频案例必考考点仿真大卷·强化卷】`,
    ]
  } else if (aiPaperForm.questionTypeCategory === 'mixed') {
    names = [
      `${year}年${subName}【综合知识+案例分析全真全景模考卷】`,
      `${year}年${subName}【考前两周全科仿真终极密押卷·A卷】`,
      `${year}年${subName}【国家统考全真考场全要素综合试卷】`,
    ]
  } else {
    names = [
      `${year}年${subName}【考前冲刺全真模拟押题卷·第1套】`,
      `${year}年${subName}【名师密押高频考点仿真套卷·A卷】`,
      `${year}年${subName}【国家软考全真考场模拟试卷·标准卷】`,
      `${year}年${subName}【易错陷阱与核心计算专项模考卷】`,
    ]
  }
  aiPaperForm.paperName = names[Math.floor(Math.random() * names.length)]
}

function onPaperCategoryChange(val: string) {
  if (val === 'case') {
    aiPaperForm.questionCount = 4
    aiPaperForm.duration = 150
  } else if (val === 'mixed') {
    aiPaperForm.questionCount = 78
    aiPaperForm.duration = 180
  } else {
    aiPaperForm.questionCount = 75
    aiPaperForm.duration = 150
  }
  generateAiRandomName()
}

async function openAiPaperDialog() {
  aiPaperForm.subjectId = query.subjectId || (subjects.value[0]?.value || 1)
  if (!aiPaperForm.questionTypeCategory) {
    aiPaperForm.questionTypeCategory = 'case'
  }
  try {
    const cfgRes: any = await getAIConfig()
    if (cfgRes?.data?.model) {
      aiPaperForm.model = cfgRes.data.model
    }
  } catch {
    // ignore
  }
  generateAiRandomName()
  aiPaperDialogVisible.value = true
}

function onAiSubjectChange() {
  generateAiRandomName()
}

const aiProgressVisible = ref(false)
const aiProgressPercent = ref(10)
const aiProgressStepText = ref('AI 正在深度解析科目考点大纲...')
let aiTaskPollTimer: any = null

async function submitAiPaper() {
  if (!aiPaperForm.paperName || !aiPaperForm.paperName.trim()) {
    generateAiRandomName()
  }
  aiPaperLoading.value = true
  aiProgressPercent.value = 10
  aiProgressStepText.value = '正在创建 AI 命题任务与考点规划...'
  aiProgressVisible.value = true
  aiPaperDialogVisible.value = false

  try {
    const res = await generateEntirePaperAsync({
      model: aiPaperForm.model,
      subjectId: aiPaperForm.subjectId,
      paperName: aiPaperForm.paperName,
      questionTypeCategory: aiPaperForm.questionTypeCategory,
      includeImages: aiPaperForm.includeImages,
      paperType: aiPaperForm.paperType,
      questionCount: aiPaperForm.questionCount,
      duration: aiPaperForm.duration,
      difficulty: aiPaperForm.difficulty,
      promptStyle: aiPaperForm.promptStyle,
    })

    const taskId = res?.data?.taskId
    if (!taskId) {
      throw new Error('未获取到命题任务ID')
    }

    // 启动轮询
    let pollCount = 0
    const maxPoll = 120 // 最长等待 180 秒 (120 * 1.5s)
    
    if (aiTaskPollTimer) clearInterval(aiTaskPollTimer)
    aiTaskPollTimer = setInterval(async () => {
      pollCount++
      try {
        const taskRes = await getAITaskDetail(taskId)
        const task = taskRes?.data
        if (!task) return

        if (task.status === 'processing') {
          const remoteProgress = task.result?.progress
          if (remoteProgress) {
            aiProgressPercent.value = Math.min(Math.max(Number(remoteProgress), 15), 95)
          } else {
            aiProgressPercent.value = Math.min(aiProgressPercent.value + 5, 90)
          }
          if (task.result?.step) {
            aiProgressStepText.value = String(task.result.step)
          }
        } else if (task.status === 'completed') {
          clearInterval(aiTaskPollTimer)
          aiTaskPollTimer = null
          aiProgressPercent.value = 100
          aiProgressStepText.value = '🎉 试卷生成完成，已自动入库！'
          setTimeout(() => {
            aiProgressVisible.value = false
            ElMessage.success(task.result?.message || '🎉 AI 大模型成功生成整套试卷并已同步入库！')
            fetchList()
          }, 800)
        } else if (task.status === 'failed') {
          clearInterval(aiTaskPollTimer)
          aiTaskPollTimer = null
          aiProgressVisible.value = false
          ElMessage.error(task.result?.error || 'AI 试卷生成失败，请检查 AI 配置或重试')
        }
      } catch {
        // 网络短暂抖动，继续等待
      }

      if (pollCount >= maxPoll) {
        clearInterval(aiTaskPollTimer)
        aiTaskPollTimer = null
        aiProgressVisible.value = false
        ElMessage.warning('出卷任务已在后台执行，请稍后刷新试卷列表查看！')
        fetchList()
      }
    }, 1500)
  } catch (err: any) {
    aiProgressVisible.value = false
    ElMessage.error(err.message || 'AI 整套试卷任务创建失败')
  } finally {
    aiPaperLoading.value = false
  }
}

// ==================== 导入试卷逻辑 ====================
const importDialogVisible = ref(false)
const importLoading = ref(false)
const paperFileInputRef = ref<HTMLInputElement | null>(null)
const paperRawText = ref('')
const parsedQuestions = ref<any[]>([])
const importForm = reactive({
  subjectId: 1,
  name: '',
  type: 'real',
  duration: 150,
  year: 2024,
})

function openImportDialog() {
  importForm.name = `2024年软考真题试卷_${new Date().getMonth() + 1}月`
  importForm.subjectId = query.subjectId || (subjects.value[0]?.value || 1)
  importForm.type = 'real'
  importForm.duration = 150
  importForm.year = 2024
  paperRawText.value = ''
  parsedQuestions.value = []
  importDialogVisible.value = true
}

function triggerPaperUpload() {
  paperFileInputRef.value?.click()
}

async function onPaperFileSelected(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (!files || !files.length) return
  const file = files[0]
  
  let cleanBaseName = file.name.replace(/\.[^/.]+$/, '')
  cleanBaseName = cleanBaseName.replace(/[_\- ]*文字版$/i, '').trim()
  if (cleanBaseName && cleanBaseName.length >= 3) {
    importForm.name = cleanBaseName
  }

  ElMessage.info(`正在解析试卷「${file.name}」...`)
  try {
    if (file.name.endsWith('.docx')) {
      const buffer = await file.arrayBuffer()
      const result = await mammoth.extractRawText({ arrayBuffer: buffer })
      const text = (result.value || '').trim()
      const count = parseTextToQuestions(text)
      if (count === 0) {
        ElMessageBox.alert(
          `文档「${file.name}」中未能提取到可识别的试题文本内容。\n\n【原因分析】\n检测到该文件可能为纯图片扫描版。\n【解决方案】\n1. 请上传包含文字可编辑版的文档；\n2. 或将试题文字直接复制粘贴至「或粘贴试卷」输入框中。`,
          '试卷文档解析提示',
          { type: 'warning', confirmButtonText: '我知道了' }
        )
      }
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data, { type: 'array' })
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
      const rows: any[] = XLSX.utils.sheet_to_json(firstSheet, { defval: '' })
      parseExcelToQuestions(rows)
    } else {
      const text = await file.text()
      parseTextToQuestions(text)
    }
  } catch (err: any) {
    ElMessage.error(`试卷解析失败: ${err.message}`)
  } finally {
    if (paperFileInputRef.value) paperFileInputRef.value.value = ''
  }
}

function onPaperTextInput() {
  if (paperRawText.value.trim()) {
    parseTextToQuestions(paperRawText.value)
  }
}

function parseExcelToQuestions(rows: any[]) {
  const questions: any[] = []
  rows.forEach((r: any, idx: number) => {
    const content = String(r['题干'] || r['题目'] || r['content'] || r['title'] || '').trim()
    if (!content) return
    const answer = String(r['答案'] || r['正确答案'] || r['answer'] || 'A').trim().toUpperCase()
    const analysis = String(r['解析'] || r['试题解析'] || r['analysis'] || '').trim()
    const options: any[] = []
    ;['A', 'B', 'C', 'D', 'E'].forEach((k) => {
      const opt = String(r[`选项${k}`] || r[k] || '').trim()
      if (opt) options.push({ key: k, label: k, content: opt })
    })
    questions.push({
      rowNo: idx + 1,
      type: options.length > 0 ? (answer.length > 1 ? 'multiple' : 'single') : 'essay',
      content,
      options,
      answer,
      analysis,
      score: 1,
    })
  })
  parsedQuestions.value = questions
  ElMessage.success(`从 Excel 成功解析出 ${questions.length} 道试题！`)
}

function parseTextToQuestions(rawText: string): number {
  // eslint-disable-next-line no-control-regex
  const cleanText = rawText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim()
  const lines = cleanText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0)
  const questions: any[] = []
  let currentQ: any = null
  let currentChapter = '第1章 信息化发展'
  let currentTypeFromTag = ''

  function isHeaderOrInstruction(line: string): boolean {
    if (/^(?:系统集成|信息系统|软考|全国计算机|中级|高级|基础知识|应用技术).*模拟试卷/i.test(line)) return true
    if (/^（依据《.*》.*编写）/.test(line)) return true
    if (/^(?:试卷说明|考试科目|合格分数线|建议用时|使用说明|满分|题量|题型|说明|项目)$/.test(line)) return true
    if (/^\d+\s*分(?:（含\s*\d+\s*分）)?$/.test(line)) return true
    if (/^\d+\s*分钟$/.test(line)) return true
    if (/^共\s*\d+\s*题/.test(line)) return true
    if (/^第[一二三四五六七八九十]+部分/.test(line)) return true
    if (/^[一二三四五六七八九十]+[、.．\s].*（第\s*\d+.*题）/.test(line)) return true
    if (/^-\(全国卷\)/.test(line)) return true
    if (/(?:微信搜索|手机端题库|PC端题库|公众号|版权所有|软考达人|www\.ruankaodaren)/i.test(line)) return true
    return false
  }

  function extractChapterFromHeader(line: string) {
    const chMatch = line.match(/^(?:第\s*(\d{1,2})\s*章|[一二三四五六七八九十]+[、.．\s])\s*([^（(\n\r]+)/)
    if (chMatch) {
      return line.trim()
    }
    return null
  }

  function extractQuestionStart(line: string) {
    if (isHeaderOrInstruction(line)) return null

    // 匹配各种真题格式：
    // 1. 第1题. / 第1题：/ 第 1 题 / 第1题 / 试题1. / 试题1 / 【试题1】
    // 2. 1. / 1、 / 1． / 1: / 1：
    // 3. (1) / （1） / [1] / 【1】
    const qPattern = /^(?:【?(?:单选|多选|判断|问答|案例|论述)题?】?\s*)?(?:【?(?:试题\s*|第\s*)?(\d{1,3})\s*(?:题)?[\)）\]】]?[\.、．:：\-\—_\s]\s*|(?:试题\s*|第\s*)(\d{1,3})\s*题[\.、．:：\-\—_\s]*|[\(（\[【](\d{1,3})[\)）\]】][\.、．:：\-\—_\s]*)(.*)/
    const m = line.match(qPattern)
    if (m) {
      const numStr = m[1] || m[2] || m[3]
      const num = parseInt(numStr, 10)
      const content = (m[4] || '').trim()
      if (num >= 1 && num <= 200) {
        return { num, content }
      }
    }
    return null
  }

  function saveCurrentQ() {
    if (!currentQ || !currentQ.content) return
    if (!currentQ.answer && currentQ.options.length > 0) {
      currentQ.answer = 'A'
    }
    questions.push({
      num: currentQ.num || (questions.length + 1),
      type: currentQ.type || (currentQ.options.length > 0 ? (currentQ.answer.length > 1 ? 'multiple' : 'single') : 'essay'),
      chapter: currentQ.chapter || currentChapter,
      content: currentQ.content.trim(),
      options: currentQ.options,
      answer: currentQ.answer.trim().toUpperCase(),
      analysis: currentQ.analysis.trim(),
      knowledgePoint: currentQ.knowledgePoint,
      score: 1,
    })
    currentQ = null
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (/^【(单选题|多选题|判断题|问答题|案例分析题|论述题)】$/.test(line)) {
      currentTypeFromTag = line.replace(/[【】]/g, '')
      continue
    }
    const ch = extractChapterFromHeader(line)
    if (ch && !line.includes('。') && !line.includes('？') && line.length < 30) {
      currentChapter = ch
      continue
    }
    if (isHeaderOrInstruction(line)) continue

    const qStart = extractQuestionStart(line)
    if (qStart) {
      saveCurrentQ()
      let type = 'single'
      const fullContent = (currentTypeFromTag + ' ' + qStart.content)
      if (fullContent.includes('多选')) type = 'multiple'
      else if (fullContent.includes('判断')) type = 'judge'
      else if (fullContent.includes('问答') || fullContent.includes('案例') || fullContent.includes('论述')) type = 'essay'

      currentQ = {
        num: qStart.num,
        type,
        chapter: currentChapter,
        content: qStart.content.replace(/【(?:单选|多选|判断|问答|案例|论述)题?】/g, '').trim(),
        options: [],
        answer: '',
        analysis: '',
        knowledgePoint: '',
        state: 'stem',
      }
      continue
    }

    if (!currentQ) continue

    // 答案识别
    const ansMatch = line.match(/^【?(?:参考|正确)?答案】?[:：\s]*([A-Za-z对错正确错误√×]+)/i)
    if (ansMatch) {
      currentQ.state = 'answer'
      currentQ.answer = ansMatch[1].trim().toUpperCase()
      continue
    }

    // 考点识别
    const kpMatch = line.match(/^【?(?:核心)?考点(?:定位)?】?[:：\s]*(.*)/i)
    if (kpMatch) {
      currentQ.state = 'kp'
      currentQ.knowledgePoint = kpMatch[1].trim()
      if (currentQ.analysis) {
        currentQ.analysis += '\n【考点定位】' + kpMatch[1].trim()
      } else {
        currentQ.analysis = '【考点定位】' + kpMatch[1].trim()
      }
      continue
    }

    // 解析识别
    const anaMatch = line.match(/^【?(?:答案|试题)?解析】?[:：\s]*(.*)/i)
    if (anaMatch) {
      currentQ.state = 'analysis'
      const anaText = anaMatch[1].trim()
      if (currentQ.analysis) {
        currentQ.analysis += '\n【名师解析】' + anaText
      } else {
        currentQ.analysis = '【名师解析】' + anaText
      }
      continue
    }

    // 易错点 / 避坑口诀 / 名师点拨
    const extraMatch = line.match(/^【(易错点|避坑口诀|名师点拨|考前速记)】[:：\s]*(.*)/i)
    if (extraMatch) {
      currentQ.state = 'analysis'
      currentQ.analysis += '\n【' + extraMatch[1] + '】' + extraMatch[2].trim()
      continue
    }

    // 选项识别 - 单行多个选项
    if (/[A-Da-d][.、．:：\s].+[B-Eb-e][.、．:：\s]/.test(line)) {
      const inlineRegex = /([A-Ga-g])[.、．:：\s]\s*([^A-Ga-g]+)/g
      let m: RegExpExecArray | null
      let count = 0
      while ((m = inlineRegex.exec(line)) !== null) {
        count++
        const key = m[1].toUpperCase()
        currentQ.options.push({ key, label: key, content: m[2].trim() })
      }
      if (count > 0) {
        currentQ.state = 'option'
        continue
      }
    }

    // 独立选项: A. / A、 / A． / (A) / （A） / A: / A
    const optMatch = line.match(/^[\(（]?([A-Ga-g])[\)）]?\s*[.、．:：\s]\s*(.*)/)
    if (optMatch && currentQ.state !== 'analysis' && currentQ.state !== 'kp') {
      currentQ.state = 'option'
      const key = optMatch[1].toUpperCase()
      currentQ.options.push({ key, label: key, content: optMatch[2].trim() })
      continue
    }

    // 状态续行
    if (currentQ.state === 'analysis' || currentQ.state === 'kp') {
      currentQ.analysis += '\n' + line
    } else if (currentQ.state === 'option' && currentQ.options.length > 0) {
      currentQ.options[currentQ.options.length - 1].content += '\n' + line
    } else if (currentQ.state === 'stem') {
      currentQ.content += '\n' + line
    }
  }

  saveCurrentQ()
  parsedQuestions.value = questions
  if (questions.length > 0) {
    ElMessage.success(`试卷解析完毕，共提取出 ${questions.length} 道试题！`)
  }
  return questions.length
}

async function submitImportPaper() {
  if (!importForm.name.trim()) return ElMessage.warning('请输入试卷名称')
  if (parsedQuestions.value.length === 0) return ElMessage.warning('试题列表为空，请先上传文档或粘贴试卷')

  importLoading.value = true
  try {
    const res = await importPaper({
      subjectId: importForm.subjectId,
      name: importForm.name,
      type: importForm.type,
      duration: importForm.duration,
      year: importForm.year,
      totalScore: parsedQuestions.value.length,
      passScore: Math.round(parsedQuestions.value.length * 0.6),
      questions: parsedQuestions.value,
    })
    ElMessage.success(`试卷「${importForm.name}」导入成功，共包含 ${res.data?.questionCount || parsedQuestions.value.length} 道试题！`)
    importDialogVisible.value = false
    fetchList()
  } catch (err: any) {
    ElMessage.error(err.message || '导入试卷失败')
  } finally {
    importLoading.value = false
  }
}

async function handleDeletePaper(row: any) {
  try {
    await ElMessageBox.confirm(`确定要删除试卷「${row.name}」吗？`, '删除确认', {
      type: 'warning',
    })
    await deletePaper(row.id)
    ElMessage.success('删除成功')
    fetchList()
  } catch {
    // cancel
  }
}

// ==================== 通用格式化辅助 ====================
function formatType(type: string) {
  if (type === 'real') return '真题'
  if (type === 'mock') return '模拟'
  if (type === 'practice') return '精练'
  return '试卷'
}

function formatQType(type: string) {
  const map: Record<string, string> = {
    single: '单选题',
    single_choice: '单选题',
    multiple: '多选题',
    multiple_choice: '多选题',
    judge: '判断题',
    true_false: '判断题',
    case: '案例分析',
    case_analysis: '案例分析',
    subjective: '问答题',
    essay: '问答题',
  }
  return map[type] || '试题'
}

function getTypeTagType(type: string) {
  if (type === 'single' || type === 'single_choice') return 'primary'
  if (type === 'multiple' || type === 'multiple_choice') return 'warning'
  if (type === 'judge' || type === 'true_false') return 'info'
  if (type === 'case' || type === 'case_analysis' || type === 'subjective' || type === 'essay') return 'danger'
  return ''
}

function formatDifficulty(diff: any) {
  if (typeof diff === 'number') {
    if (diff <= 2) return '简单'
    if (diff === 3) return '中等'
    return '较难'
  }
  const map: Record<string, string> = {
    easy: '简单',
    medium: '中等',
    hard: '较难',
  }
  return map[diff] || '中等'
}

function resetQuery() {
  query.subjectId = undefined
  query.type = ''
  fetchList()
}

async function loadSubjects() {
  try {
    const res = await getAllSubjects()
    if (res?.data) {
      subjects.value = res.data.map((s: any) => ({ label: s.name, value: Number(s.id) }))
      if (subjects.value.length > 0) {
        autoForm.subjectId = subjects.value[0].value
        importForm.subjectId = subjects.value[0].value
      }
    }
  } catch {
    // ignore
  }
}

async function fetchList() {
  loading.value = true
  try {
    const res = await getPaperList({
      page: query.page,
      pageSize: query.pageSize,
      subjectId: query.subjectId || undefined,
      status: undefined,
    })
    if (res?.data?.list) {
      list.value = res.data.list
    }
  } catch (err: any) {
    ElMessage.error(err.message || '获取试卷列表失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadSubjects()
  fetchList()
})
</script>

<style scoped lang="scss">
.paper-manage-page {
  padding: 24px;
}

.table-panel {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  padding: 16px;
}

.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.filter-bar {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.action-bar {
  display: flex;
  gap: 12px;
}

.paper-title-cell {
  display: flex;
  align-items: center;
  gap: 8px;

  .p-type-tag {
    font-size: 12px;
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: 500;
    white-space: nowrap;

    &.real {
      background: #eff6ff;
      color: #2563eb;
      border: 1px solid #bfdbfe;
    }
    &.mock {
      background: #f0fdf4;
      color: #16a34a;
      border: 1px solid #bbf7d0;
    }
    &.practice {
      background: #faf5ff;
      color: #9333ea;
      border: 1px solid #e9d5ff;
    }
  }

  .p-name {
    font-weight: 500;
    color: var(--text-primary, #1e293b);
  }
}

.score-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 13px;

  .q-count-badge {
    color: #2563eb;
    font-weight: 600;
  }
  .sep {
    color: #cbd5e1;
  }
}

.pass-score {
  color: #16a34a;
  font-weight: 600;
}

.table-ops {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
}

.diff-tag {
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 4px;
  font-weight: 500;

  &.easy {
    background: #ecfdf5;
    color: #059669;
  }
  &.medium {
    background: #fffbeb;
    color: #d97706;
  }
  &.hard {
    background: #fef2f2;
    color: #dc2626;
  }
}

/* 试卷配置板块 */
.paper-questions-section {
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px dashed #e2e8f0;

  .pqs-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;

    .pqs-title {
      font-size: 15px;
      font-weight: 600;
      color: #1e293b;
      display: flex;
      align-items: center;
      gap: 12px;

      .pqs-stat {
        font-size: 13px;
        color: #64748b;
        font-weight: normal;

        strong {
          color: #2563eb;
        }
        .pqs-types {
          margin-left: 6px;
          color: #94a3b8;
        }
      }
    }
  }

  .q-content-snippet {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: #334155;
  }

  .empty-q-box {
    text-align: center;
    padding: 32px 16px;
    background: #f8fafc;
    border-radius: 8px;
    border: 1px dashed #cbd5e1;

    .eq-icon {
      font-size: 32px;
      margin-bottom: 8px;
    }
    .eq-text {
      font-size: 14px;
      font-weight: 600;
      color: #475569;
      margin-bottom: 4px;
    }
    .eq-sub {
      font-size: 12px;
      color: #94a3b8;
    }
  }
}

/* 题库选择弹窗 */
.picker-container {
  .picker-filter-bar {
    display: flex;
    gap: 10px;
    margin-bottom: 14px;
    flex-wrap: wrap;
  }

  .picker-q-content {
    .pqc-title {
      font-weight: 500;
      color: #1e293b;
      margin-bottom: 4px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .pqc-opts {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      font-size: 12px;
      color: #64748b;
    }
  }

  .picker-pagination {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 14px;

    .picker-tip {
      font-size: 13px;
      color: #475569;
      strong {
        color: #2563eb;
      }
    }
  }
}

/* 试卷全景预览抽屉 */
.preview-drawer-content {
  padding: 0 8px 24px;

  .preview-hero-card {
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 16px 20px;
    margin-bottom: 20px;

    .phc-top {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 12px;

      .phc-type {
        font-size: 12px;
        padding: 3px 8px;
        border-radius: 4px;
        font-weight: 600;

        &.real { background: #dbeafe; color: #1d4ed8; }
        &.mock { background: #dcfce7; color: #15803d; }
        &.practice { background: #f3e8ff; color: #7e22ce; }
      }

      .phc-name {
        margin: 0;
        font-size: 18px;
        font-weight: 700;
        color: #0f172a;
      }
    }

    .phc-meta-bar {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 10px;
      font-size: 13px;
      color: #475569;
      margin-bottom: 14px;

      .pm-sep {
        color: #cbd5e1;
      }
    }

    .phc-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 12px;
      border-top: 1px solid #e2e8f0;
    }
  }

  .preview-body-layout {
    display: flex;
    gap: 18px;
    align-items: flex-start;

    .preview-questions-flow {
      flex: 1;
      min-width: 0;

      .preview-question-card {
        background: #fff;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 16px;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);

        .pqc-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;

          .pqc-left {
            display: flex;
            align-items: center;
            gap: 8px;

            .pqc-index {
              font-weight: 700;
              color: #1e293b;
              font-size: 14px;
            }
          }

          .pqc-right {
            .pqc-score {
              font-size: 12px;
              color: #64748b;
              background: #f1f5f9;
              padding: 2px 6px;
              border-radius: 4px;
            }
          }
        }

        .pqc-stem {
          font-size: 15px;
          line-height: 1.6;
          color: #1e293b;
          margin-bottom: 12px;
          white-space: pre-wrap;
        }

        .pqc-options-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 12px;

          .pqc-option-row {
            display: flex;
            align-items: flex-start;
            gap: 8px;
            padding: 8px 12px;
            border-radius: 6px;
            background: #f8fafc;
            border: 1px solid #f1f5f9;
            font-size: 14px;
            color: #334155;

            &.is-correct {
              background: #f0fdf4;
              border-color: #bbf7d0;
              color: #166534;
              font-weight: 500;
            }

            .opt-prefix {
              font-weight: 600;
            }
            .opt-text {
              flex: 1;
            }
            .opt-correct-badge {
              font-size: 11px;
              background: #16a34a;
              color: #fff;
              padding: 2px 6px;
              border-radius: 4px;
            }
          }
        }

        .pqc-answer-box {
          margin-top: 12px;
          padding: 10px 14px;
          background: #eff6ff;
          border-radius: 6px;
          border-left: 3px solid #3b82f6;
          font-size: 13px;

          .pqc-ans-line {
            display: flex;
            align-items: center;
            gap: 6px;
            margin-bottom: 6px;

            .ans-label {
              font-weight: 600;
              color: #1e40af;
            }
            .ans-val {
              font-weight: 700;
              color: #16a34a;
              background: #dcfce7;
              padding: 1px 8px;
              border-radius: 4px;
            }
          }

          .pqc-ana-line {
            .ana-label {
              font-weight: 600;
              color: #1e40af;
              margin-bottom: 2px;
            }
            .ana-content {
              color: #334155;
              line-height: 1.5;
              white-space: pre-wrap;
            }
          }
        }
      }
    }

    /* 答题卡快速导航 */
    .preview-index-nav {
      width: 170px;
      position: sticky;
      top: 10px;
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);

      .pin-title {
        font-size: 13px;
        font-weight: 600;
        color: #1e293b;
        margin-bottom: 10px;
        text-align: center;
      }

      .pin-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 6px;
        max-height: 480px;
        overflow-y: auto;

        .pin-btn {
          height: 28px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          color: #475569;
          cursor: pointer;
          transition: all 0.15s ease;

          &:hover {
            background: #2563eb;
            color: #fff;
            border-color: #2563eb;
          }
        }
      }
    }
  }
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

:deep(.q-table-responsive) {
  width: 100%;
  overflow-x: auto;
  margin: 12px 0;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

  .q-case-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
    background: #ffffff;
    border: 1px solid #cbd5e1;

    th {
      background: #f1f5f9;
      color: #1e293b;
      font-weight: 700;
      padding: 8px 12px;
      border: 1px solid #cbd5e1;
      text-align: center;
      white-space: nowrap;
    }

    td {
      padding: 8px 12px;
      border: 1px solid #e2e8f0;
      color: #334155;
      text-align: center;
    }

    tr:nth-child(even) {
      background: #f8fafc;
    }

    tr:hover {
      background: #f0fdf4;
    }
  }
}
</style>
