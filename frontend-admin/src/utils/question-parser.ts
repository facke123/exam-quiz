export interface ParsedOption {
  key: string
  label: string
  content: string
}

export interface SplitResult {
  stem: string
  options: ParsedOption[]
  answer?: string
  analysis?: string
}

export interface ParsedExamQuestion {
  num: number
  type: string
  chapter?: string
  content: string
  options: ParsedOption[]
  answer: string
  analysis: string
  knowledgePoint?: string
  score?: number
}

/**
 * 智能拆分题干与选项（前端客户端高容错算法）
 * 支持如下格式：
 * 1. 常见项目符号：· A. / • A. / ● A. / ◆ A. / ■ A. / ※ A. / - A. / * A. / + A.
 * 2. 常见标点：A. / A、 / A． / A: / A： / A - / A (空格)
 * 3. 常见括号：(A) / （A） / [A] / 【A】 / <A>
 * 4. 大小写：A/B/C/D 或 a/b/c/d
 * 5. 多行排列或单行内联排列（如 A. xxx B. yyy C. zzz D. kkk）
 * 6. 防误判：必须成对按序检测到选项 A 与选项 B，才触发拆分
 */
export function splitStemAndOptions(rawContent: string): SplitResult {
  if (!rawContent || typeof rawContent !== 'string') {
    return { stem: '', options: [] }
  }

  const clean = rawContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim()
  const lines = clean.split('\n')

  // 匹配单行起始的选项前缀
  const optLineStartRegex =
    /^[\s\t]*[·•●◆■※\-*+、\u00b7\u2022\u25cf\u25cb\u25aa\u25ab]*\s*(?:[\(（\[【<]?([A-Ga-g])[\)）\]】>]?[\.、．:：\-\—\s]\s*|[\(（\[【<]([A-Ga-g])[\)）\]】>]\s*)(.*)$/
  // 匹配行内嵌入的选项前缀
  const inlineOptRegex =
    /(?:^|\s+|[·•●◆■※\-*+、\u00b7\u2022\u25cf\u25cb\u25aa\u25ab]+)(?:[\(（\[【<]?([A-Ga-g])[\)）\]】>]?[\.、．:：\-\—\s]|[\(（\[【<]([A-Ga-g])[\)）\]】>])\s*/g
  // 匹配答案或解析标识截流行
  const ansOrAnaStartRegex =
    /^[\s\t]*(?:【(?:正确答案|参考答案|答案|试题解析|考点分析|名师解析|解析|考点定位)】[：:\s]*|【?(?:正确答案|参考答案|答案|试题解析|考点分析|名师解析|解析|考点定位)】?[：:])/i

  // ==================== 策略一：按行扫描拆分 ====================
  let firstOptIndex = -1
  let foundB = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const m = line.match(optLineStartRegex)
    if (m) {
      const key = (m[1] || m[2]).toUpperCase()
      if (firstOptIndex === -1) {
        if (key === 'A') {
          firstOptIndex = i
        }
      } else {
        if (key === 'B') foundB = true
      }
    }
  }

  // 如果成功检测到从某行开始进入选项 A，且后续存在选项 B
  if (firstOptIndex >= 0 && foundB) {
    const stemLines = lines.slice(0, firstOptIndex)
    const stem = stemLines.join('\n').trim()
    const optLines = lines.slice(firstOptIndex)
    const options: ParsedOption[] = []
    let currentOpt: ParsedOption | null = null
    let extractedAnswer: string | undefined = undefined
    let extractedAnalysis: string | undefined = undefined

    for (let idx = 0; idx < optLines.length; idx++) {
      const line = optLines[idx]
      const trimmedLine = line.trim()

      // 截流：答案或解析标识
      if (ansOrAnaStartRegex.test(trimmedLine)) {
        const remaining = optLines.slice(idx).join('\n')
        const ansMatch = remaining.match(/【?(?:正确答案|参考答案|答案)】?[：:\s]*([A-Za-z对错正确错误√×]+)/i)
        if (ansMatch) {
          extractedAnswer = ansMatch[1].trim().toUpperCase()
        }
        const anaMatch = remaining.match(/【?(?:试题解析|考点分析|名师解析|解析)】?[：:\s]*([\s\S]+)/i)
        if (anaMatch) {
          extractedAnalysis = anaMatch[1].trim()
        }
        break
      }

      // 检查当前行是否包含多个内联选项（如 · A. xxx · B. yyy）
      const inlineMatches: Array<{ key: string; start: number; contentStart: number }> = []
      let im: RegExpExecArray | null
      const testRegex = new RegExp(inlineOptRegex.source, 'g')
      while ((im = testRegex.exec(line)) !== null) {
        inlineMatches.push({
          key: (im[1] || im[2]).toUpperCase(),
          start: im.index,
          contentStart: testRegex.lastIndex,
        })
      }

      if (inlineMatches.length >= 2) {
        for (let j = 0; j < inlineMatches.length; j++) {
          const curr = inlineMatches[j]
          const nextStart = j + 1 < inlineMatches.length ? inlineMatches[j + 1].start : line.length
          const optContent = line
            .substring(curr.contentStart, nextStart)
            .trim()
            .replace(/[·•●◆■※\-*+、\u00b7\u2022\s]+$/, '')
          currentOpt = { key: curr.key, label: curr.key, content: optContent }
          options.push(currentOpt)
        }
        continue
      }

      // 单个独立选项行
      const m = line.match(optLineStartRegex)
      if (m) {
        const key = (m[1] || m[2]).toUpperCase()
        const optContent = (m[3] || '').trim()
        currentOpt = { key, label: key, content: optContent }
        options.push(currentOpt)
      } else if (currentOpt) {
        // 选项跨行续写
        currentOpt.content += '\n' + trimmedLine
      }
    }

    if (options.length >= 2) {
      return {
        stem,
        options,
        answer: extractedAnswer,
        analysis: extractedAnalysis,
      }
    }
  }

  // ==================== 策略二：单行或全文内联选项正则拆分 ====================
  const allInlineMatches: Array<{ key: string; start: number; contentStart: number }> = []
  let im: RegExpExecArray | null
  const testRegex = new RegExp(inlineOptRegex.source, 'g')
  while ((im = testRegex.exec(clean)) !== null) {
    allInlineMatches.push({
      key: (im[1] || im[2]).toUpperCase(),
      start: im.index,
      contentStart: testRegex.lastIndex,
    })
  }

  let aIdx = -1
  let bIdx = -1
  for (let i = 0; i < allInlineMatches.length; i++) {
    if (allInlineMatches[i].key === 'A' && aIdx === -1) {
      aIdx = i
    } else if (aIdx !== -1 && allInlineMatches[i].key === 'B' && bIdx === -1) {
      bIdx = i
      break
    }
  }

  if (aIdx !== -1 && bIdx !== -1) {
    const validMatches = allInlineMatches.slice(aIdx)
    const matchA = validMatches[0]
    const stem = clean.substring(0, matchA.start).trim()
    const options: ParsedOption[] = []

    for (let j = 0; j < validMatches.length; j++) {
      const curr = validMatches[j]
      const nextStart = j + 1 < validMatches.length ? validMatches[j + 1].start : clean.length
      let optContent = clean.substring(curr.contentStart, nextStart).trim()

      const stopM = optContent.match(
        /[\n\s]+(?:【(?:正确答案|参考答案|答案|试题解析|考点分析|名师解析|解析|考点定位)】[：:\s]*|【?(?:正确答案|参考答案|答案|试题解析|考点分析|名师解析|解析|考点定位)】?[：:])/i
      )
      if (stopM && stopM.index !== undefined) {
        optContent = optContent.substring(0, stopM.index).trim()
      }
      optContent = optContent.replace(/[·•●◆■※\-*+、\u00b7\u2022\s]+$/, '')
      options.push({ key: curr.key, label: curr.key, content: optContent })
    }

    if (options.length >= 2) {
      return { stem, options }
    }
  }

  return { stem: clean, options: [] }
}

/**
 * 清洗题干中残留的多余题号或题型前缀
 * 如：1. / 1、 / 试题1. / 【单选题】
 */
export function cleanStemPrefix(stem: string): string {
  if (!stem) return ''
  let res = stem.trim()
  res = res.replace(/^(?:【?(?:单选|多选|判断|问答|案例|论述)题?】?\s*)+/i, '')
  res = res.replace(/^(?:试题\s*\d+[\.、．:：\-\—_\s]*|\d+[\.、．:：\-\—_\s]+)/, '')
  res = res.replace(/^[（(]\d+[）)][\.、．\s]?\s*/, '')
  return res.trim()
}

/**
 * 试卷/文档高容错试题解析引擎
 * 支持：
 * 1. Word HTML（来自 mammoth.convertToHtml），完美保留 15+ 张 <img> 图片与 <table> 表格
 * 2. 避免小数/区间（如 49.6-49.8）误识别为题号
 * 3. 避免 HTML 实体解码早于标签清理导致标签误吞（如 SPI > 1, CV < 0）
 * 4. 支持单行多选项、独立多行选项、项目符号选项
 * 5. 自动智能判定题型（单选、多选、判断、问答）与兜底拆分
 */
export function parseDocxOrTextToQuestions(
  rawInput: string,
  defaultChapter = '第1章 信息化发展'
): ParsedExamQuestion[] {
  if (!rawInput || typeof rawInput !== 'string') return []

  const isHtml = /<[a-z][\s\S]*>/i.test(rawInput)
  const tables: string[] = []

  let text = rawInput

  if (isHtml) {
    // 1. 提取 <table>...</table> 为独立占位符，转换为响应式表格，避免表格内部单元格数字打断题目
    text = text.replace(/<table[^>]*>[\s\S]*?<\/table>/gi, (match) => {
      const styledTable = `<div class="q-table-responsive">${match.replace(/<table/i, '<table class="q-case-table"')}</div>`
      const token = `__TABLE_PLACEHOLDER_${tables.length}__`
      tables.push(styledTable)
      return `\n${token}\n`
    })

    // 2. 将图片与紧随的题型标识（如 <img .../>【单选题】）拆分到新行，保证归属于上一题的解析
    text = text.replace(/(<img[^>]*>)\s*(【(?:单选|多选|判断|问答|案例|论述)题?】)/gi, '$1\n$2')

    // 3. 段落与块级标签转换行
    text = text
      .replace(/<\/p>/gi, '\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<\/li>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      // 4. 清理除 <img> <strong> <b> <em> <i> 之外的 HTML 标签（注意保留我们的占位符）
      .replace(/<(?!\/?(?:img|strong|b|em|i)\b)[^>]+>/gi, '')
      // 5. 实体解码（必须在清理 HTML 标签之后执行，防止将如 SPI > 1, CV < 0 误判为 HTML 标签被吞掉！）
      .replace(/&nbsp;/gi, ' ')
      .replace(/&emsp;/gi, ' ')
      .replace(/&ensp;/gi, ' ')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&amp;/gi, '&')
  }

  // 清洗不可见控制字符
  // eslint-disable-next-line no-control-regex
  text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim()

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

    // 关键点：使用 \.(?!\d) 杜绝匹配 49.6 或 50.0 等浮点小数
    const qPattern =
      /^(?:【?(?:单选|多选|判断|问答|案例|论述)题?】?\s*)?(?:【?(?:试题\s*|第\s*)?(\d{1,3})\s*(?:题)?[\)）\]】]?(?:\.(?!\d)|[、．:：\-\—_\s])\s*|(?:试题\s*|第\s*)(\d{1,3})\s*题[\.、．:：\-\—_\s]*|[\(（\[【](\d{1,3})[\)）\]】][\.、．:：\-\—_\s]*)(.*)/
    const m = line.match(qPattern)
    if (m) {
      const numStr = m[1] || m[2] || m[3]
      const num = parseInt(numStr, 10)
      const content = (m[4] || '').trim()
      if (num >= 1 && num <= 300) {
        return { num, content }
      }
    }
    return null
  }

  function restoreTables(str: string): string {
    if (!str) return str
    return str.replace(/__TABLE_PLACEHOLDER_(\d+)__/g, (_, idx) => tables[parseInt(idx, 10)] || '')
  }

  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0)
  const questions: ParsedExamQuestion[] = []
  let currentQ: any = null
  let currentChapter = defaultChapter
  let currentTypeFromTag = ''

  function saveCurrentQ() {
    if (!currentQ || !currentQ.content) return

    // 智能兜底：如果选项不足 2 个但题干中混有选项，尝试使用 splitStemAndOptions 拆分
    if ((!currentQ.options || currentQ.options.length < 2) && currentQ.content) {
      const split = splitStemAndOptions(currentQ.content)
      if (split.options.length >= 2) {
        currentQ.content = split.stem
        currentQ.options = split.options
        if (split.answer && (!currentQ.answer || currentQ.answer === 'A')) {
          currentQ.answer = split.answer
        }
        if (split.analysis && (!currentQ.analysis || currentQ.analysis.length < 5)) {
          currentQ.analysis = split.analysis
        }
      }
    }

    if (!currentQ.answer && currentQ.options.length > 0) {
      currentQ.answer = 'A'
    }

    const optCount = currentQ.options.length
    let qType = currentQ.type || 'single'
    if (optCount >= 2) {
      if (currentQ.answer && currentQ.answer.length > 1 && /^[A-E]+$/.test(currentQ.answer)) {
        qType = 'multiple'
      } else {
        qType = 'single'
      }
    } else if (/正确|错误|对|错|√|×/i.test(currentQ.answer) || /判断/i.test(currentQ.content)) {
      qType = 'judge'
    } else if (optCount === 0) {
      qType = 'essay'
    }

    questions.push({
      num: currentQ.num || questions.length + 1,
      type: qType,
      chapter: currentQ.chapter || currentChapter,
      content: restoreTables(currentQ.content.trim()),
      options: currentQ.options.map((opt: ParsedOption) => ({
        ...opt,
        content: restoreTables(opt.content),
      })),
      answer: currentQ.answer.trim().toUpperCase(),
      analysis: restoreTables(currentQ.analysis.trim()),
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
      const fullContent = currentTypeFromTag + ' ' + qStart.content
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
      let rawAns = ansMatch[1].trim()
      if (rawAns === '对' || rawAns === '√') rawAns = '正确'
      if (rawAns === '错' || rawAns === '×') rawAns = '错误'
      currentQ.answer = rawAns.toUpperCase()
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

    // 独立选项: A. / A、 / A． / (A) / （A） / A: / · A. 等
    const optMatch = line.match(/^[\s\t]*[·•●◆■※\-*+、\u00b7\u2022\u25cf]*\s*[\(（\[【<]?([A-Ga-g])[\)）\]】>]?[\.、．:：\-\—\s]\s*(.*)/)
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
  return questions
}
