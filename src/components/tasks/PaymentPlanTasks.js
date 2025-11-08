import { EMPTY_STRING } from '../../constants';

const PaymentPlanTaskTableHeaders = () => [
  EMPTY_STRING,
];

const PaymentPlanTaskItemFormatters = () => [
  (task) => {
    // Ne pas afficher PaymentPlanPage en mode tâche
    return null;
  },
];

export { PaymentPlanTaskTableHeaders, PaymentPlanTaskItemFormatters };

