import { decodeId } from '@openimis/fe-core';
import { isBase64Encoded } from '../utils';

/**
 * UUID paie pour requête GraphQL (entityId tâche souvent en id GraphQL base64).
 */
export function resolvePaymentPlanUuidFromTask(task, incoming = {}) {
  const candidates = [
    task?.entityId,
    task?.entityString,
    incoming?.payment_plan_id,
    incoming?.paymentPlanId,
    incoming?.entity_id,
  ].filter((v) => v != null && v !== '');

  for (const raw of candidates) {
    const id = typeof raw === 'string' && isBase64Encoded(raw) ? decodeId(raw) : raw;
    if (id) return id;
  }
  return null;
}

/**
 * Normalise task.businessData for payment_plan maker-checker tasks.
 */
export function parseTaskPaymentPlanBusinessData(raw) {
  let data = raw;
  if (!data) {
    return { incoming: {}, current: {} };
  }
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch {
      return { incoming: {}, current: {} };
    }
  }

  const rawIncoming = data.incoming_data && typeof data.incoming_data === 'object'
    ? data.incoming_data
    : data;
  const currentRaw = data.current_data && typeof data.current_data === 'object'
    ? data.current_data
    : {};

  const current = normalizePaymentPlanIncoming(currentRaw);
  const incomingNorm = normalizePaymentPlanIncoming(rawIncoming);
  let incoming = mergePaymentPlanTaskSnapshots(current, incomingNorm);

  if (!hasDisplayValue(incoming.periodicite)) {
    incoming.periodicite = extractPeriodicityFromModifications(incoming.modifications)
      ?? extractPeriodicityFromModifications(incomingNorm.modifications)
      ?? extractPeriodicityFromModifications(current.modifications)
      ?? incomingNorm.periodicite
      ?? current.periodicite
      ?? extractPeriodicityFromTextRecap(incoming.recapitulatif_plan_paiement)
      ?? extractPeriodicityFromTextRecap(incomingNorm.recapitulatif_plan_paiement)
      ?? extractPeriodicityFromTextRecap(current.recapitulatif_plan_paiement);
  }

  return { incoming, current };
}

/** Fusionne current_data (état validé) + incoming_data (proposition), priorité aux valeurs non vides. */
function mergePaymentPlanTaskSnapshots(currentNorm, incomingNorm) {
  const merged = { ...currentNorm };
  Object.keys(incomingNorm).forEach((key) => {
    if (hasDisplayValue(incomingNorm[key])) {
      merged[key] = incomingNorm[key];
    }
  });
  return merged;
}

function extractPeriodicityFromTextRecap(text) {
  if (!text || typeof text !== 'string') return null;
  // Backend : "Périodicité : Mensuelle (6)"
  const lineMatch = text.match(/p[eé]riodicit[eé]\s*:\s*([^\n\r]+)/i);
  if (lineMatch?.[1]) {
    const label = lineMatch[1].trim();
    if (hasDisplayValue(label)) return label;
  }
  const numericPatterns = [
    /p[eé]riodicit[eé]\s*[:=]\s*(\d+)/i,
    /periodicity\s*[:=]\s*(\d+)/i,
  ];
  for (const re of numericPatterns) {
    const match = text.match(re);
    if (match?.[1]) return match[1];
  }
  return null;
}

function extractPeriodicityFromModifications(modifications) {
  const rows = asArray(modifications);
  for (const row of rows) {
    const champ = (row.champ ?? row.field ?? '').toString().toLowerCase();
    if (
      champ.includes('period')
      || champ.includes('périod')
      || champ.includes('periodicite')
    ) {
      const value = row.valeur_proposee ?? row.valeur_actuelle ?? row.proposed ?? row.current;
      if (hasDisplayValue(value)) {
        return value;
      }
    }
  }
  return null;
}

/**
 * Aligné backend payment_plan_task_recap : periodicite = libellé affiché, periodicity = entier.
 */
function resolvePeriodicityDisplayValue(raw) {
  if (hasDisplayValue(raw.periodicite)) {
    return String(raw.periodicite).trim();
  }
  if (raw.periodicity != null && raw.periodicity !== '') {
    return raw.periodicity;
  }
  return null;
}

/** Map legacy / English keys to serializer field names. */
function normalizePaymentPlanIncoming(raw) {
  if (!raw || typeof raw !== 'object') {
    return {};
  }
  return {
    ...raw,
    type_operation: raw.type_operation ?? raw.typeOperation ?? raw.operation_type,
    code: raw.code ?? raw.payment_plan_code,
    nom: raw.nom ?? raw.name ?? raw.payment_plan_name,
    regime_prestations: raw.regime_prestations ?? raw.benefit_plan ?? raw.benefitPlan,
    regle_calcul: raw.regle_calcul ?? raw.calculation_name ?? raw.calculationName ?? raw.calculation,
    // Libellé backend (ex. "Mensuelle (6)") prioritaire ; periodicity = entier technique si seul
    periodicite: resolvePeriodicityDisplayValue(raw),
    payment_plan_id: raw.payment_plan_id ?? raw.paymentPlanId ?? raw.entity_id,
    date_debut: raw.date_debut ?? raw.dateValidFrom ?? raw.date_valid_from,
    date_fin: raw.date_fin ?? raw.dateValidTo ?? raw.date_valid_to,
    parametres_calcul: raw.parametres_calcul ?? raw.calculation_params,
    nombre_beneficiaires_regime: raw.nombre_beneficiaires_regime ?? raw.beneficiaries_regime_count,
    nombre_beneficiaires_selectionnes: raw.nombre_beneficiaires_selectionnes
      ?? raw.beneficiaries_selected_count,
    nombre_menages_regime: raw.nombre_menages_regime ?? raw.households_regime_count,
    nombre_menages_selectionnes: raw.nombre_menages_selectionnes
      ?? raw.households_selected_count,
    criteres_filtrage_beneficiaires: raw.criteres_filtrage_beneficiaires ?? raw.filter_criteria,
    prefectures_concernees: raw.prefectures_concernees ?? raw.prefectures,
    districts_concernes: raw.districts_concernes ?? raw.districts,
    regions_concernees: raw.regions_concernees ?? raw.regions,
    recapitulatif_plan_paiement: raw.recapitulatif_plan_paiement ?? raw.payment_plan_recap,
    modifications: raw.modifications,
  };
}

export function hasDisplayValue(value) {
  if (value === 0 || value === '0') return true;
  return value !== undefined && value !== null && value !== '';
}

/**
 * Affichage : libellé backend tel quel (ex. "Mensuelle (6)") ; entier seul → "N mois".
 */
export function formatTaskPeriodicityDisplay(value) {
  if (!hasDisplayValue(value)) return null;
  const raw = String(value).trim();
  if (/[a-zA-ZÀ-ÿ]/.test(raw)) {
    return raw;
  }
  if (/mois|month/i.test(raw)) {
    return raw;
  }
  if (/^\d+$/.test(raw)) {
    return `${raw} mois`;
  }
  return raw;
}

export function asArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return [value];
}
