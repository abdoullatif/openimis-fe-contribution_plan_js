import React from 'react';
import PaymentPlanTaskRecap from './PaymentPlanTaskRecap';

const PaymentPlanTaskTableHeaders = () => [
  'Récapitulatif du plan de paiement',
];

const PaymentPlanTaskItemFormatters = () => [
  (incomingData, jsonExt, formatterIndex, setAdditionalData, taskPreview) => (
    <PaymentPlanTaskRecap incomingData={incomingData} task={taskPreview} />
  ),
];

export { PaymentPlanTaskTableHeaders, PaymentPlanTaskItemFormatters };
