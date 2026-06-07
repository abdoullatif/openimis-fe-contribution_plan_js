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
  CustomFilterValueSuggestionsInput,
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

function shouldUseCustomFilterValueSuggestions(filter) {
  if (!filter?.field) return false;
  if (filter.referential || filter.typeLocation) return false;
  if (filter.type === BOOLEAN) return false;
  return true;
}

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

  /** Met à jour dynamiquement le filtre selon le champ modifié */
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

  /** Supprime une ligne de critère */
  const removeFilter = () => {
    const newArray = [...filters];
    newArray.splice(index, 1);
    setFilters(newArray.length === 0 ? [CLEARED_STATE_FILTER] : newArray);
  };

  /** Rendu des composants selon le type du champ */
  const renderInputBasedOnType = useMemo(
    () => (type) => {
      const commonProps = {
        module: "paymentPlan",
        label: formatMessage("advancedCriteria.value"),
        value: currentFilter.value,
        onChange: onAttributeChange("value"),
      };

      // Cas spécial pour les localités
      if (currentFilter.referential === "Location") {
        const levels = { Region: 0, District: 1, Municipality: 2, Village: 3 };
        const level = levels[currentFilter.typeLocation];
        if (level === undefined) return null;

        return (
          <PublishedComponent
            pubRef="location.LocationPicker"
            {...commonProps}
            locationLevel={level}
          />
        );
      }

      switch (type) {
        case BOOLEAN:
          return (
            <SelectInput
              options={BOOL_OPTIONS}
              readOnly={readOnly}
              {...commonProps}
            />
          );
        case INTEGER:
          if (shouldUseCustomFilterValueSuggestions(currentFilter) && benefitPlanId) {
            return (
              <CustomFilterValueSuggestionsInput
                key={`${currentFilter.field}-${benefitPlanId}`}
                label={commonProps.label}
                value={currentFilter.value}
                onChange={onAttributeChange("value")}
                readOnly={readOnly}
                field={currentFilter.field}
                moduleName="payroll"
                objectTypeName="BenefitPlan"
                uuidOfObject={benefitPlanId}
                minLength={1}
              />
            );
          }
          return (
            <NumberInput
              min={0}
              displayZero
              readOnly={readOnly}
              {...commonProps}
            />
          );
        case STRING:
        default:
          if (currentFilter.field?.toLowerCase().includes(DATE)) {
            return (
              <PublishedComponent
                pubRef="core.DatePicker"
                readOnly={readOnly}
                {...commonProps}
              />
            );
          }
          if (shouldUseCustomFilterValueSuggestions(currentFilter) && benefitPlanId) {
            return (
              <CustomFilterValueSuggestionsInput
                key={`${currentFilter.field}-${benefitPlanId}`}
                label={commonProps.label}
                value={currentFilter.value}
                onChange={onAttributeChange("value")}
                readOnly={readOnly}
                field={currentFilter.field}
                moduleName="payroll"
                objectTypeName="BenefitPlan"
                uuidOfObject={benefitPlanId}
                minLength={1}
              />
            );
          }
          return <TextInput readOnly={readOnly} {...commonProps} />;
      }
    },
    [currentFilter, readOnly, formatMessage]
  );

  return (
    <Grid
      container
      direction="row"
      className={classes.item}
      style={{ backgroundColor: "#DFEDEF" }}
    >
      {/* Bouton de suppression */}
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

      {/* Sélecteur du champ */}
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

      {/* Sélecteur du type de filtre */}
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

      {/* Valeur du filtre */}
      {currentFilter.field && currentFilter.filter && (
        <Grid item xs={3} className={classes.item}>
          {renderInputBasedOnType(currentFilter.type)}
        </Grid>
      )}

      {/* Montant */}
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
