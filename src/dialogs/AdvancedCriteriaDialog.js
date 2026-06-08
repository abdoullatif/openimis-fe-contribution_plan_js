import React, { useEffect, useRef, useState } from "react";
import { injectIntl } from "react-intl";
import Button from "@material-ui/core/Button";
import {
  decodeId,
  formatMessage,
  fetchCustomFilter,
} from "@openimis/fe-core";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import AdvancedCriteriaRowValue from "./AdvancedCriteriaRowValue";
import AddCircle from '@material-ui/icons/Add';
import { BENEFIT_PLAN, CLEARED_STATE_FILTER } from "../constants";
import { isBase64Encoded, isEmptyObject } from "../utils";
import {
  getAdvancedCriteriaList,
  mergeAdvancedCriteriaIntoJsonExt,
} from "../utils/advancedCriteriaJsonExt";

const styles = (theme) => ({
  item: theme.paper.item,
});

const normalizeFilterValue = (value) => {
  if (!value) return "";
  if (typeof value === "object") {
    return value.name || value.code || value.id || value.value || "";
  }
  return String(value);
};

const serializeCriteriaValue = (value) => {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value.name) {
    return {
      name: value.name,
      ...(value.code ? { code: value.code } : {}),
      ...(value.uuid ? { uuid: value.uuid } : {}),
    };
  }
  return normalizeFilterValue(value);
};

const buildCustomFilterCondition = ({ field, filter, value, type }) => {
  if (!field || !filter) return null;
  const normalizedValue = normalizeFilterValue(value);
  if (!normalizedValue) return null;
  const valueType = type || 'string';
  return `${field}__${filter}__${valueType}=${normalizedValue}`;
};

const buildSavedCriteriaRows = (filters) => {
  const activeFilters = filters.filter(
    ({ field, filter, value }) => field && filter && normalizeFilterValue(value) !== '',
  );

  return activeFilters
    .map(({ filter, value, field, type, referential, typeLocation, amount }) => ({
      amount,
      type,
      referential,
      typeLocation,
      filter,
      field,
      value: serializeCriteriaValue(value),
      custom_filter_condition: buildCustomFilterCondition({ field, filter, value, type }),
    }))
    .filter((entry) => !!entry.custom_filter_condition);
};

const criteriaRowsEqual = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const AdvancedCriteriaDialog = ({
  intl,
  classes,
  object,
  objectToSave,
  fetchCustomFilter,
  customFilters,
  moduleName,
  objectType,
  setAppliedCustomFilters,
  setAppliedFiltersRowStructure,
  updateAttributes,
  getDefaultAppliedCustomFilters,
  additionalParams,
  confirmed,
  readOnly = false,
}) => {
  const [currentFilter, setCurrentFilter] = useState({
    field: "", filter: "", type: "", value: "", amount: "", referential: null, typeLocation: null,
  });
  const [filters, setFilters] = useState(() => getDefaultAppliedCustomFilters());
  const skipNextSyncRef = useRef(false);

  useEffect(() => {
    const parsed = getDefaultAppliedCustomFilters(objectToSave?.jsonExt);
    skipNextSyncRef.current = true;
    setFilters(parsed.length > 0 ? parsed : []);
  }, [objectToSave?.jsonExt]);

  useEffect(() => {
    if (skipNextSyncRef.current) {
      skipNextSyncRef.current = false;
      return;
    }
    if (!object || isEmptyObject(object)) {
      return;
    }

    const savedRows = buildSavedCriteriaRows(filters);
    const currentRows = getAdvancedCriteriaList(objectToSave?.jsonExt);
    if (criteriaRowsEqual(savedRows, currentRows)) {
      return;
    }

    const jsonExt = mergeAdvancedCriteriaIntoJsonExt(objectToSave?.jsonExt, savedRows);
    updateAttributes(jsonExt);
    setAppliedFiltersRowStructure(savedRows);
    setAppliedCustomFilters(JSON.stringify(savedRows));
  }, [filters, object]);

  const createParams = (moduleName, objectTypeName, uuidOfObject = null, additionalParams = null) => {
    const params = [
      `moduleName: "${moduleName}"`,
      `objectTypeName: "${objectTypeName}"`,
    ];
    if (uuidOfObject) {
      params.push(`uuidOfObject: "${uuidOfObject}"`);
    }
    if (additionalParams) {
      params.push(`additionalParams: ${JSON.stringify(JSON.stringify(additionalParams))}`);
    }
    return params;
  };

  const fetchFilters = (params) => fetchCustomFilter(params);

  const handleAddFilter = () => {
    setCurrentFilter(CLEARED_STATE_FILTER);
    setFilters([...filters, CLEARED_STATE_FILTER]);
  };

  const handleRemoveFilter = () => {
    setCurrentFilter(CLEARED_STATE_FILTER);
    setAppliedFiltersRowStructure([]);
    setFilters([]);
    const clearedJsonExt = mergeAdvancedCriteriaIntoJsonExt(objectToSave?.jsonExt, []);
    updateAttributes(clearedJsonExt);
    setAppliedCustomFilters(JSON.stringify([]));
  };

  useEffect(() => {
    if (object && isEmptyObject(object) === false) {
      let paramsToFetchFilters = [];
      if (objectType === BENEFIT_PLAN) {
        paramsToFetchFilters = createParams(
          moduleName,
          objectType,
          isBase64Encoded(object.id) ? decodeId(object.id) : object.id,
          additionalParams,
        );
      } else {
        paramsToFetchFilters = createParams(
          moduleName,
          objectType,
          additionalParams,
        );
      }
      fetchFilters(paramsToFetchFilters);
    }
  }, [object]);

  const benefitPlanId = object?.id
    ? (isBase64Encoded(object.id) ? decodeId(object.id) : object.id)
    : null;

  return (
    <>
      {filters.map((filter, index) => (
        <AdvancedCriteriaRowValue
          key={`criteria-row-${index}`}
          customFilters={customFilters}
          currentFilter={filter}
          setCurrentFilter={setCurrentFilter}
          index={index}
          filters={filters}
          setFilters={setFilters}
          readOnly={confirmed || readOnly}
          benefitPlanId={benefitPlanId}
        />
      ))}
      {!confirmed ? (
        <div style={{ backgroundColor: "#DFEDEF", paddingLeft: "10px", paddingBottom: "10px" }}>
          <AddCircle
            style={{
              border: 'thin solid',
              borderRadius: '40px',
              width: '16px',
              height: '16px',
              cursor: 'pointer',
            }}
            onClick={handleAddFilter}
          />
          <Button
            onClick={handleAddFilter}
            variant="outlined"
            style={{
              border: "0px",
              marginBottom: "6px",
              fontSize: "0.8rem",
            }}
            disabled={confirmed || readOnly}
          >
            {formatMessage(intl, "paymentPlan", "paymentPlan.advancedCriteria.button.addFilters")}
          </Button>
        </div>
      ) : null}
      <div>
        <div style={{ float: 'left' }}>
          <Button
            onClick={handleRemoveFilter}
            variant="outlined"
            style={{ border: '0px' }}
            disabled={confirmed || readOnly}
          >
            {formatMessage(intl, 'individual', 'paymentPlan.advancedCriteria.button.clearAllFilters')}
          </Button>
        </div>
      </div>
    </>
  );
};

const mapStateToProps = (state) => ({
  rights: !!state.core && !!state.core.user && !!state.core.user.i_user ? state.core.user.i_user.rights : [],
  confirmed: state.core.confirmed,
  fetchingCustomFilters: state.core.fetchingCustomFilters,
  errorCustomFilters: state.core.errorCustomFilters,
  fetchedCustomFilters: state.core.fetchedCustomFilters,
  customFilters: state.core.customFilters,
});

const mapDispatchToProps = (dispatch) => bindActionCreators({
  fetchCustomFilter,
}, dispatch);

export default injectIntl(withTheme(withStyles(styles)(connect(mapStateToProps, mapDispatchToProps)(AdvancedCriteriaDialog))));
