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
  res = res.replace(/^(?:试题\s*\d+[\.、．:：\-\—\s]*|\d+[\.、．:：\-\—\s]+)/, '')
  res = res.replace(/^[（(]\d+[）)][\.、．\s]?\s*/, '')
  return res.trim()
}
