/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/jsx-no-useless-fragment */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React, { useMemo } from "react";
import { injectIntl } from "react-intl";
import {
  PublishedComponent,
  TextInput,
  NumberInput,
  SelectInput,
  useModulesManager,
  useTranslations,
  CustomFilterTypeStatusPicker,
  CustomFilterFieldStatusPicker,
  CustomFilterFieldValueInput,
  shouldUseCustomFilterValueSuggestions,
} from "@openimis/fe-core";
import { Grid } from "@material-ui/core";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { connect } from "react-redux";
import {
  BOOLEAN,
  INTEGER,
  STRING,
  CLEARED_STATE_FILTER,
  DATE,
  BOOL_OPTIONS,
} from "../constants";

const styles = (theme) => ({
  item: theme.paper.item,
});

const CUSTOM_FILTER_MODULE_NAME = "social_protection";
const CUSTOM_FILTER_OBJECT_TYPE = "BenefitPlan";

const AdvancedCriteriaRowValue = ({
  intl,
  classes,
  customFilters,
  currentFilter,
  setCurrentFilter,
  index,
  filters,
  setFilters,
  readOnly,
  benefitPlanId = null,
}) => {
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations("paymentPlan", modulesManager);

  const onAttributeChange = (attribute) => (incoming) => {
    setFilters((prev) => {
      const next = [...prev];
      const row = { ...(next[index] ?? {}) };

      if (attribute === 'field') {
        next[index] = {
          ...row,
          field: incoming.field,
          type: incoming.type,
          referential: incoming.referential,
          typeLocation: incoming.typeLocation,
          filter: '',
          value: '',
          amount: '',
        };
      } else if (attribute === 'filter') {
        next[index] = {
          ...row,
          filter: incoming,
          value: '',
          amount: '',
        };
      } else {
        next[index] = {
          ...row,
          [attribute]: incoming,
        };
      }

      setCurrentFilter(next[index]);
      return next;
    });
  };

  const removeFilter = () => {
    const newArray = [...filters];
    newArray.splice(index, 1);
    setFilters(newArray.length === 0 ? [] : newArray);
  };

  const renderInputBasedOnType = useMemo(
    () => (type) => {
      const commonProps = {
        module: "paymentPlan",
        label: formatMessage("advancedCriteria.value"),
        value: currentFilter.value,
        onChange: onAttributeChange("value"),
      };

      if (type === BOOLEAN) {
        return (
          <SelectInput
            options={BOOL_OPTIONS}
            readOnly={readOnly}
            {...commonProps}
          />
        );
      }

      if (currentFilter.field?.toLowerCase().includes(DATE)) {
        return (
          <PublishedComponent
            pubRef="core.DatePicker"
            readOnly={readOnly}
            {...commonProps}
          />
        );
      }

      if (benefitPlanId && shouldUseCustomFilterValueSuggestions(currentFilter)) {
        return (
          <CustomFilterFieldValueInput
            key={`${currentFilter.field}-${currentFilter.filter}-${benefitPlanId}`}
            label={commonProps.label}
            value={currentFilter.value}
            onChange={onAttributeChange("value")}
            readOnly={readOnly}
            field={currentFilter.field}
            filterMeta={currentFilter}
            moduleName={CUSTOM_FILTER_MODULE_NAME}
            objectTypeName={CUSTOM_FILTER_OBJECT_TYPE}
            uuidOfObject={benefitPlanId}
            minLength={1}
          />
        );
      }

      if (type === INTEGER) {
        return (
          <NumberInput
            min={0}
            displayZero
            readOnly={readOnly}
            {...commonProps}
          />
        );
      }

      return <TextInput readOnly={readOnly} {...commonProps} />;
    },
    [currentFilter, readOnly, formatMessage, benefitPlanId]
  );

  return (
    <Grid
      container
      direction="row"
      className={classes.item}
      style={{ backgroundColor: "#DFEDEF" }}
    >
      {filters.length > 0 && !readOnly && (
        <div
          style={{
            backgroundColor: "#DFEDEF",
            width: "10px",
            height: "25px",
            marginTop: "25px",
          }}
        >
          <span
            style={{
              transform: "translate(-50%, -50%)",
              fontSize: "16px",
              color: "#006273",
              cursor: "pointer",
            }}
            onClick={removeFilter}
          >
            &#x2716;
          </span>
        </div>
      )}

      <Grid item xs={3} className={classes.item}>
        <CustomFilterFieldStatusPicker
          module="paymentPlan"
          label="paymentPlan.advancedCriteria.field"
          value={{
            field: currentFilter.field,
            type: currentFilter.type,
            referential: currentFilter.referential,
            typeLocation: currentFilter.typeLocation,
          }}
          onChange={onAttributeChange("field")}
          customFilters={customFilters}
          readOnly={readOnly}
        />
      </Grid>

      {currentFilter.field && (
        <Grid item xs={3} className={classes.item}>
          <CustomFilterTypeStatusPicker
            module="paymentPlan"
            label="paymentPlan.advancedCriteria.filter"
            value={currentFilter.filter}
            onChange={onAttributeChange("filter")}
            customFilters={customFilters}
            customFilterField={currentFilter.field}
            readOnly={readOnly}
          />
        </Grid>
      )}

      {currentFilter.field && currentFilter.filter && (
        <Grid item xs={3} className={classes.item}>
          {renderInputBasedOnType(currentFilter.type)}
        </Grid>
      )}

      {currentFilter.field && currentFilter.filter && currentFilter.value && (
        <Grid item xs={2} className={classes.item}>
          <NumberInput
            min={0}
            displayZero
            readOnly={readOnly}
            module="paymentPlan"
            label={formatMessage("advancedCriteria.amount")}
            value={currentFilter.amount}
            onChange={onAttributeChange("amount")}
          />
        </Grid>
      )}
    </Grid>
  );
};

export default injectIntl(
  withTheme(withStyles(styles)(connect(null, null)(AdvancedCriteriaRowValue)))
);
