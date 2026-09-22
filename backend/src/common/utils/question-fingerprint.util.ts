/**
 * 试题内容与选项特征指纹计算工具
 * 用于杜绝同一套练习中出现相同题干、相似提问或完全一样选项的重复试题
 */

/**
 * 规范化题干字符串：
 * 1. 过滤常见的修饰性前缀（例如：在【第15章 组织保障】过程中，某... -> 某...）
 * 2. 统一全角/半角标点符号与空白字符
 * 3. 统一去除中英文括号内部占位符
 */
export function normalizeStem(stem: string): string {
  if (!stem) return '';
  return stem
    // 移除常见的章节导言与前缀修饰
    .replace(/^(根据|在)?(《.*?》)?(国家软考|软考)?(【第.*?章.*?】)?(知识体系中|官方教程规范|流程中|过程中|考纲要求)?(，|。|、|：|:|\s)*/g, '')
    // 统一括号形式
    .replace(/[（(][^)）]*[)）]/g, '()')
    // 移除空白与所有非中文、字母、数字字符
    .replace(/[\s\r\n\t\u3000]+/g, '')
    .replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '')
    .toLowerCase();
}

/**
 * 提取选项的标准化内容列表并生成特征指纹：
 * 将每个选项文本规范化（去标点空格）后按字母序排序拼接
 */
export function getOptionsFingerprint(options: any): string {
  if (!options) return '';
  let list: any[] = [];
  if (typeof options === 'string') {
    try {
      list = JSON.parse(options);
    } catch {
      list = [];
    }
  } else if (Array.isArray(options)) {
    list = options;
  }

  const cleaned = list
    .map((opt) => {
      const c = typeof opt === 'string' ? opt : (opt.content || opt.text || '');
      return (c || '')
        .replace(/[\s\r\n\t\u3000]+/g, '')
        .replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '')
        .toLowerCase();
    })
    .filter(Boolean);

  if (cleaned.length === 0) return '';
  return cleaned.sort().join('###');
}

export interface QuestionFingerprint {
  id: string | number;
  stemNorm: string;
  stemShort: string;
  optionsFp: string;
}

/**
 * 计算单个题目的完整指纹对象
 */
export function computeQuestionFingerprint(q: any): QuestionFingerprint {
  const rawStem = q.content || q.title || '';
  const stemNorm = normalizeStem(rawStem);
  // 提取前 35 个有效字符作为快速哈希
  const stemShort = stemNorm.slice(0, 35);
  const optionsFp = getOptionsFingerprint(q.options);

  return {
    id: q.id,
    stemNorm,
    stemShort,
    optionsFp,
  };
}

/**
 * 判断两个题目是否属于高置信度的重复题：
 * 1. ID 相同
 * 2. 规范化题干完全一致（长度 >= 6）
 * 3. 规范化选项指纹完全一致（长度 >= 8），且题干内核相似或包含
 */
export function isDuplicateQuestion(
  fpA: QuestionFingerprint,
  fpB: QuestionFingerprint,
): boolean {
  if (String(fpA.id) === String(fpB.id)) return true;

  // 1. 规范化题干完全一致（如 ID 239 与 423，或去除章节前缀后完全相同）
  if (fpA.stemNorm && fpB.stemNorm && fpA.stemNorm === fpB.stemNorm && fpA.stemNorm.length >= 6) {
    return true;
  }

  // 2. 选项组合 100% 相同（如 ID 69 与 1394，或 592 与 596）
  if (fpA.optionsFp && fpB.optionsFp && fpA.optionsFp === fpB.optionsFp && fpA.optionsFp.length >= 8) {
    // 若选项完全一样，且题干至少有一部分重叠或短特征一致，则断定为重复题
    if (
      fpA.stemShort === fpB.stemShort ||
      fpA.stemNorm.includes(fpB.stemShort) ||
      fpB.stemNorm.includes(fpA.stemShort)
    ) {
      return true;
    }
    // 如果选项具有极高的专有性（长度 >= 25，如整句长选项），选项相同基本即可认定为同题
    if (fpA.optionsFp.length >= 25) {
      return true;
    }
  }

  return false;
}

/**
 * 对题目列表进行严格去重：
 * 遍历候选集，剔除所有与已入选题目产生碰撞的试题
 */
export function deduplicateQuestions<T extends { id: any; content?: string; title?: string; options?: any }>(
  questions: T[],
): T[] {
  const result: T[] = [];
  const selectedFps: QuestionFingerprint[] = [];

  for (const q of questions) {
    if (!q || !q.id) continue;
    const fp = computeQuestionFingerprint(q);

    let isDup = false;
    for (const prevFp of selectedFps) {
      if (isDuplicateQuestion(fp, prevFp)) {
        isDup = true;
        break;
      }
    }

    if (!isDup) {
      result.push(q);
      selectedFps.push(fp);
    }
  }

  return result;
}
