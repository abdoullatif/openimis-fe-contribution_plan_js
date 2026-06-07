export const ADVANCED_CRITERIA_STATUS_ACTIVE = 'ACTIVE';

export function parseJsonExt(jsonExt) {
  if (!jsonExt) return {};
  if (typeof jsonExt === 'object') return jsonExt;
  try {
    return JSON.parse(jsonExt);
  } catch {
    return {};
  }
}

/**
 * Reads advanced_criteria from jsonExt (array legacy or { ACTIVE: [...] }).
 */
export function getAdvancedCriteriaList(jsonExtOrData) {
  const jsonData = typeof jsonExtOrData === 'object' && jsonExtOrData !== null && !Array.isArray(jsonExtOrData)
    && !jsonExtOrData.advanced_criteria
    ? jsonExtOrData
    : parseJsonExt(jsonExtOrData);

  const byStatus = jsonData?.advanced_criteria_by_status;
  if (byStatus && typeof byStatus === 'object') {
    const fromStatus = byStatus[ADVANCED_CRITERIA_STATUS_ACTIVE] || byStatus.active;
    if (Array.isArray(fromStatus)) return fromStatus;
  }

  const criteria = jsonData?.advanced_criteria;
  if (!criteria) return [];
  if (Array.isArray(criteria)) return criteria;
  if (typeof criteria === 'object') {
    return criteria[ADVANCED_CRITERIA_STATUS_ACTIVE]
      || criteria.active
      || [];
  }
  return [];
}

/**
 * Persists criteria for backend + calcrule:
 * - array: used by calculation rules and filter_condition_utils tests
 * - { ACTIVE: [...] }: used by task recap / status-based reads
 */
export function mergeAdvancedCriteriaIntoJsonExt(inputJsonExt, criteriaRows) {
  const existingData = parseJsonExt(inputJsonExt);
  existingData.advanced_criteria = criteriaRows;
  existingData.advanced_criteria_by_status = {
    [ADVANCED_CRITERIA_STATUS_ACTIVE]: criteriaRows,
  };
  return JSON.stringify(existingData);
}

/**
 * Keeps saved advanced_criteria when calculation params rewrite jsonExt.
 */
export function mergeJsonExtPreservingAdvancedCriteria(existingJsonExt, nextJsonExt) {
  const existing = parseJsonExt(existingJsonExt);
  const next = parseJsonExt(nextJsonExt);
  const savedCriteria = existing?.advanced_criteria;
  const merged = { ...next };
  if (savedCriteria && (
    (Array.isArray(savedCriteria) && savedCriteria.length > 0)
    || (typeof savedCriteria === 'object' && Object.keys(savedCriteria).length > 0)
  )) {
    merged.advanced_criteria = savedCriteria;
    if (existing.advanced_criteria_by_status) {
      merged.advanced_criteria_by_status = existing.advanced_criteria_by_status;
    }
  }
  return JSON.stringify(merged);
}

export function formatJsonExtForGQL(jsonExt) {
  if (!jsonExt) return '';
  const payload = typeof jsonExt === 'string' ? parseJsonExt(jsonExt) : jsonExt;
  if (!payload || typeof payload !== 'object' || Object.keys(payload).length === 0) {
    return '';
  }
  // Même convention que le reste d'openIMIS : une seule sérialisation JSONString
  return `jsonExt: ${JSON.stringify(JSON.stringify(payload))}`;
}

/** Vérifie que des critères sont présents dans jsonExt (debug / validation avant save). */
export function hasAdvancedCriteriaInJsonExt(jsonExt) {
  return getAdvancedCriteriaList(jsonExt).length > 0;
}
