import React from 'react';
import { FormattedMessage } from '@openimis/fe-core';
import { EMPTY_STRING } from '../../constants';

const PaymentPlanTaskTableHeaders = () => [
  EMPTY_STRING,
];

const parseMaybeJson = (value) => {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (e) {
      return value;
    }
  }
  return value;
};

const NESTED_CANDIDATE_KEYS = [
  'jsonExt',
  'json_ext',
  'paymentPlan',
  'payment_plan',
  'businessData',
  'business_data',
  'current_data',
  'incoming_data',
  'data',
  'payload',
  'entity',
  'details',
];

const buildCandidates = (source) => {
  const root = parseMaybeJson(source);
  const stack = [root];
  const candidates = [];
  const visited = new Set();

  while (stack.length) {
    const current = stack.pop();
    if (!current || typeof current !== 'object') {
      continue;
    }
    if (visited.has(current)) {
      continue;
    }
    visited.add(current);
    candidates.push(current);

    NESTED_CANDIDATE_KEYS.forEach((key) => {
      if (current[key] !== undefined && current[key] !== null) {
        stack.push(parseMaybeJson(current[key]));
      }
    });
  }

  return candidates;
};

const getFirstValue = (source = {}, keys = []) => {
  const candidates = buildCandidates(source);

  for (let i = 0; i < candidates.length; i += 1) {
    const candidate = candidates[i];
    for (let j = 0; j < keys.length; j += 1) {
      const key = keys[j];
      if (!key) {
        continue;
      }
      if (candidate?.[key] !== undefined && candidate?.[key] !== null) {
        return candidate[key];
      }
      if (typeof key === 'string' && key.includes('.')) {
        const nestedValue = key.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : null), candidate);
        if (nestedValue !== undefined && nestedValue !== null) {
          return nestedValue;
        }
      }
    }
  }

  return null;
};

const formatLine = (labelId, value) => ({ labelId, value });

const getBenefitPlanDisplay = (benefitPlan) => {
  if (!benefitPlan) {
    return null;
  }
  if (typeof benefitPlan === 'string') {
    return benefitPlan;
  }
  return benefitPlan.name || benefitPlan.code || null;
};

const formatDateValue = (value) => {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString();
  }
  const asNumber = Number(value);
  if (!Number.isNaN(asNumber)) {
    const numberDate = new Date(asNumber);
    if (!Number.isNaN(numberDate.getTime())) {
      return numberDate.toLocaleDateString();
    }
  }
  const asDate = new Date(`${value}`);
  if (!Number.isNaN(asDate.getTime())) {
    return asDate.toLocaleDateString();
  }
  return value;
};

const PaymentPlanTaskItemFormatters = () => [
  (itemData = {}) => {
    const paymentPlan = itemData || {};

    const lines = [
      formatLine('paymentPlan.code', getFirstValue(paymentPlan, ['code', 'payment_plan_code', 'businessData.current_data.code', 'business_data.current_data.code'])),
      formatLine('paymentPlan.name', getFirstValue(paymentPlan, ['name', 'payment_plan_name', 'businessData.current_data.name', 'business_data.current_data.name'])),
      formatLine('paymentPlan.type', getFirstValue(paymentPlan, ['benefitPlanTypeName', 'benefit_plan_type_name', 'businessData.current_data.benefit_plan_type_name', 'business_data.current_data.benefit_plan_type_name'])),
      formatLine('paymentPlan.benefitPlan', getBenefitPlanDisplay(getFirstValue(paymentPlan, ['benefitPlan', 'benefit_plan', 'businessData.current_data.benefit_plan', 'business_data.current_data.benefit_plan']))),
      formatLine(
        'paymentPlan.calculation',
        getFirstValue(paymentPlan, ['calculationName', 'calculation_name', 'businessData.current_data.calculation_name', 'business_data.current_data.calculation_name']) ||
          getFirstValue(paymentPlan, ['calculation', 'calculation_rule_id', 'businessData.current_data.calculation', 'business_data.current_data.calculation']),
      ),
      formatLine('paymentPlan.periodicity', getFirstValue(paymentPlan, ['periodicity', 'businessData.current_data.periodicity', 'business_data.current_data.periodicity'])),
      formatLine(
        'paymentPlan.dateValidFrom',
        formatDateValue(
          getFirstValue(paymentPlan, [
            'dateValidFrom',
            'date_valid_from',
            'valid_from',
            'validityFrom',
            'validity_from',
            'validFrom',
            'businessData.current_data.date_valid_from',
            'business_data.current_data.date_valid_from',
            'businessData.current_data.valid_from',
            'business_data.current_data.valid_from',
          ]),
        ),
      ),
      formatLine(
        'paymentPlan.dateValidTo',
        formatDateValue(
          getFirstValue(paymentPlan, [
            'dateValidTo',
            'date_valid_to',
            'valid_to',
            'validityTo',
            'validity_to',
            'validTo',
            'businessData.current_data.date_valid_to',
            'business_data.current_data.date_valid_to',
            'businessData.current_data.valid_to',
            'business_data.current_data.valid_to',
          ]),
        ),
      ),
    ].filter(({ value }) => value !== undefined && value !== null && value !== EMPTY_STRING);

    if (!lines.length) {
      return EMPTY_STRING;
    }

    return (
      <>
        {lines.map(({ labelId, value }, index) => (
          <React.Fragment key={labelId}>
            <strong>
              <FormattedMessage module="paymentPlan" id={labelId} />
              :
            </strong>
            {' '}
            {value}
            {index < lines.length - 1 && <br />}
          </React.Fragment>
        ))}
      </>
    );
  },
];

export { PaymentPlanTaskTableHeaders, PaymentPlanTaskItemFormatters };
