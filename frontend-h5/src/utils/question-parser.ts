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
 * 智能拆分题干与选项（前端移动端高容错算法）
 * 支持各类项目符号前缀及成对顺序检测，防止误将题干名词截断
 */
export function splitStemAndOptions(rawContent: string): SplitResult {
  if (!rawContent || typeof rawContent !== 'string') {
    return { stem: '', options: [] }
  }

  const clean = rawContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim()
  const lines = clean.split('\n')

  const optLineStartRegex =
    /^[\s\t]*[·•●◆■※\-*+、\u00b7\u2022\u25cf\u25cb\u25aa\u25ab]*\s*(?:[\(（\[【<]?([A-Ga-g])[\)）\]】>]?[\.、．:：\-\—\s]\s*|[\(（\[【<]([A-Ga-g])[\)）\]】>]\s*)(.*)$/
  const inlineOptRegex =
    /(?:^|\s+|[·•●◆■※\-*+、\u00b7\u2022\u25cf\u25cb\u25aa\u25ab]+)(?:[\(（\[【<]?([A-Ga-g])[\)）\]】>]?[\.、．:：\-\—\s]|[\(（\[【<]([A-Ga-g])[\)）\]】>])\s*/g
  const ansOrAnaStartRegex =
    /^[\s\t]*(?:【(?:正确答案|参考答案|答案|试题解析|考点分析|名师解析|解析|考点定位)】[：:\s]*|【?(?:正确答案|参考答案|答案|试题解析|考点分析|名师解析|解析|考点定位)】?[：:])/i

  // 策略一：按行扫描
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

      // 内联选项检查
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

      const m = line.match(optLineStartRegex)
      if (m) {
        const key = (m[1] || m[2]).toUpperCase()
        const optContent = (m[3] || '').trim()
        currentOpt = { key, label: key, content: optContent }
        options.push(currentOpt)
      } else if (currentOpt) {
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

  // 策略二：全文内联扫描
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
