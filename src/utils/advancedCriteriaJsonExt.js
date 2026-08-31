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

export function normalizeCriteriaValue(value) {
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'boolean') return String(value);
  if (typeof value === 'number') return String(value);
  if (typeof value === 'object') {
    return value.name || value.code || value.id || value.value || '';
  }
  return String(value);
}

export function serializeCriteriaValue(value) {
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value.name) {
    return {
      name: value.name,
      ...(value.code ? { code: value.code } : {}),
      ...(value.uuid ? { uuid: value.uuid } : {}),
    };
  }
  return normalizeCriteriaValue(value);
}

/**
 * Format attendu par filter_condition_utils / calcrule :
 * - string : field__lookup=value (sans quotes JSON)
 * - boolean : field__boolean=True|False (legacy)
 * - number : field__lookup__integer=12
 */
export function buildCustomFilterCondition({ field, filter, value, type }) {
  if (!field || !filter) return null;

  const valueType = (type || 'string').toLowerCase();
  const normalizedValue = normalizeCriteriaValue(value);
  if (normalizedValue === '') return null;

  if (valueType === 'boolean') {
    return `${field}__boolean=${normalizedValue}`;
  }

  if (['integer', 'numeric', 'number', 'decimal'].includes(valueType)) {
    return `${field}__${filter}__${valueType}=${normalizedValue}`;
  }

  return `${field}__${filter}=${normalizedValue}`;
}

export function isIncompleteCriteriaRow(row) {
  return !row?.field || !row?.filter || normalizeCriteriaValue(row?.value) === '';
}

export function buildSavedCriteriaRows(filters = []) {
  return (filters || [])
    .filter(({ field, filter, value }) => field && filter && normalizeCriteriaValue(value) !== '')
    .map(({ filter, value, field, type, referential, typeLocation, amount }) => ({
      amount: amount === 0 || amount ? amount : 0,
      type: type ?? 'string',
      referential: referential ?? null,
      typeLocation: typeLocation ?? null,
      filter,
      field,
      value: serializeCriteriaValue(value),
      custom_filter_condition: buildCustomFilterCondition({ field, filter, value, type }),
    }))
    .filter((entry) => !!entry.custom_filter_condition);
}

export function mergeSavedAndDraftCriteriaRows(savedRows = [], currentRows = []) {
  const saved = savedRows || [];
  const current = currentRows || [];

  if (current.length === 0) {
    return saved;
  }

  const maxLen = Math.max(saved.length, current.length);
  const merged = [];

  for (let index = 0; index < maxLen; index += 1) {
    const currentRow = current[index];
    const savedRow = saved[index];

    if (currentRow && !isIncompleteCriteriaRow(currentRow)) {
      merged.push(currentRow);
    } else if (savedRow) {
      merged.push(savedRow);
    } else if (currentRow) {
      merged.push(currentRow);
    }
  }

  return merged;
}

export function criteriaRowsEqual(left = [], right = []) {
  return JSON.stringify(buildSavedCriteriaRows(left)) === JSON.stringify(buildSavedCriteriaRows(right));
}

export function applyCriteriaRowsToPaymentPlan(paymentPlan, filters = []) {
  if (!paymentPlan) return paymentPlan;
  const savedRows = buildSavedCriteriaRows(filters);
  return {
    ...paymentPlan,
    jsonExt: mergeAdvancedCriteriaIntoJsonExt(paymentPlan.jsonExt, savedRows),
  };
}
