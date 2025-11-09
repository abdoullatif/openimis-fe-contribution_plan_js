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

const normalizeKey = (key) => (key ? key.toString().replace(/[^a-z0-9]/gi, '').toLowerCase() : '');

const findDeepValue = (source, keys = []) => {
  const normalizedTargets = keys.filter(Boolean).map(normalizeKey);
  if (!normalizedTargets.length) {
    return null;
  }

  const visited = new Set();
  const stack = [parseMaybeJson(source)];

  while (stack.length) {
    const current = stack.pop();
    if (!current || typeof current !== 'object') {
      continue;
    }
    if (visited.has(current)) {
      continue;
    }
    visited.add(current);

    const entries = Array.isArray(current)
      ? current.map((value, index) => [index, value])
      : Object.entries(current);

    for (let i = 0; i < entries.length; i += 1) {
      const [rawKey, rawValue] = entries[i];
      const key = normalizeKey(rawKey);
      const value = parseMaybeJson(rawValue);

      if (value !== undefined && value !== null && normalizedTargets.includes(key)) {
        return value;
      }

      if (typeof value === 'object') {
        stack.push(value);
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
  (itemData = {}, jsonExt = {}, formatterIndex, setAdditionalData, incomingData = {}) => {
    const paymentPlan = {
      itemData: parseMaybeJson(itemData),
      jsonExt: parseMaybeJson(jsonExt),
      incomingData: parseMaybeJson(incomingData),
      ...parseMaybeJson(itemData),
    };

    const lines = [
      formatLine('paymentPlan.code', findDeepValue(paymentPlan, ['code', 'payment_plan_code'])),
      formatLine('paymentPlan.name', findDeepValue(paymentPlan, ['name', 'payment_plan_name'])),
      formatLine('paymentPlan.type', findDeepValue(paymentPlan, ['benefitPlanTypeName', 'benefit_plan_type_name'])),
      formatLine('paymentPlan.benefitPlan', getBenefitPlanDisplay(findDeepValue(paymentPlan, ['benefitPlan', 'benefit_plan']))),
      formatLine(
        'paymentPlan.calculation',
        findDeepValue(paymentPlan, ['calculationName', 'calculation_name']) ||
          findDeepValue(paymentPlan, ['calculation', 'calculation_rule_id']),
      ),
      formatLine('paymentPlan.periodicity', findDeepValue(paymentPlan, ['periodicity'])),
      formatLine(
        'paymentPlan.dateValidFrom',
        formatDateValue(
          findDeepValue(paymentPlan, [
            'dateValidFrom',
            'date_valid_from',
            'valid_from',
            'validityFrom',
            'validity_from',
            'validFrom',
            'startDate',
            'start_date',
            'dateValidFromDisplay',
            'date_valid_from_display',
            'validFromDisplay',
            'valid_from_display',
          ]),
        ),
      ),
      formatLine(
        'paymentPlan.dateValidTo',
        formatDateValue(
          findDeepValue(paymentPlan, [
            'dateValidTo',
            'date_valid_to',
            'valid_to',
            'validityTo',
            'validity_to',
            'validTo',
            'endDate',
            'end_date',
            'dateValidToDisplay',
            'date_valid_to_display',
            'validToDisplay',
            'valid_to_display',
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
