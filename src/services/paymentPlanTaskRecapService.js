import {
  formatPageQueryWithCount,
  graphql,
  parseData,
} from '@openimis/fe-core';

const PAYMENT_PLAN_PERIODICITY_PROJECTION = ['id', 'periodicity'];

/**
 * Charge la périodicité depuis la table payment_plan (source de vérité en base).
 */
export function fetchPaymentPlanPeriodicityForTaskThunk(modulesManager, planUuid) {
  if (!planUuid) {
    return () => Promise.resolve(null);
  }

  const payload = formatPageQueryWithCount(
    'paymentPlan',
    [`id: "${planUuid}"`, 'first: 1'],
    PAYMENT_PLAN_PERIODICITY_PROJECTION,
  );

  return (dispatch) => graphql(payload, 'PAYMENT_PLAN_TASK_RECAP_PERIODICITY')(
    dispatch,
  ).then(
    (action) => {
      if (action?.error || action?.payload?.errors) return null;
      const row = parseData(action?.payload?.data?.paymentPlan)?.[0];
      // Repli legacy : entier en base ; les nouvelles tâches ont periodicite (libellé) dans businessData
      const value = row?.periodicity;
      return value != null && value !== '' ? value : null;
    },
    () => null,
  );
}
