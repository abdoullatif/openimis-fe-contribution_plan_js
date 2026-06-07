import React, { useCallback } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { injectIntl } from 'react-intl';
import { FilterSuggestionsAutocomplete, formatMessage } from '@openimis/fe-core';
import { fetchPaymentPlanFilterSuggestions } from '../actions';
import { CONTAINS_LOOKUP } from '../constants';

const FILTER_SUGGESTION_DEBOUNCE_MS = 300;
const FILTER_SUGGESTION_MIN_LENGTH = 2;

function PaymentPlanFilterSuggestionField({
  intl,
  field,
  labelKey,
  value,
  onApplyFilter,
  fetchPaymentPlanFilterSuggestions: fetchSuggestions,
}) {
  const fetchOptions = useCallback(
    (search) => fetchSuggestions(search, field),
    [fetchSuggestions, field],
  );

  return (
    <FilterSuggestionsAutocomplete
      label={formatMessage(intl, 'contributionPlan', labelKey)}
      value={value ?? ''}
      onChange={(v) => onApplyFilter(field, v, CONTAINS_LOOKUP)}
      fetchSuggestions={fetchOptions}
      minLength={FILTER_SUGGESTION_MIN_LENGTH}
      debounceMs={FILTER_SUGGESTION_DEBOUNCE_MS}
    />
  );
}

const mapDispatchToProps = (dispatch) => bindActionCreators({
  fetchPaymentPlanFilterSuggestions,
}, dispatch);

export default injectIntl(connect(null, mapDispatchToProps)(PaymentPlanFilterSuggestionField));
