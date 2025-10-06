import React, { useEffect, useState } from "react";
import { injectIntl } from "react-intl";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
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


const styles = (theme) => ({
  item: theme.paper.item,
});

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
  appliedFiltersRowStructure,
  setAppliedFiltersRowStructure,
  updateAttributes,
  getDefaultAppliedCustomFilters,
  additionalParams,
  confirmed,
  edited,
  readOnly = false,
}) => {

  const [isOpen, setIsOpen] = useState(false);
  const [currentFilter, setCurrentFilter] = useState({ field: "", filter: "", type: "", value: "", amount: "", referential: null, typeLocation: null })
  const [filters, setFilters] = useState(getDefaultAppliedCustomFilters());

  const getBenefitPlanDefaultCriteria = () => {
    const jsonExt = edited?.benefitPlan?.jsonExt ?? '{}';
    const jsonData = JSON.parse(jsonExt);

    // Note: advanced_criteria is migrated from [filters] to {status: filters}
    // For backward compatibility default status take on the old filters
    let criteria = jsonData?.advanced_criteria || {};
    if (Array.isArray(criteria)) {
      return criteria;
    }

    return criteria['ACTIVE'] || [];
  };

  useEffect(() => {
    // const defaultAppliedCustomFilters = getDefaultAppliedCustomFilters();
    const defaultAppliedCustomFilters = filters;
    console.log('filters', filters);
    if (!defaultAppliedCustomFilters.length) {
      setFilters(getBenefitPlanDefaultCriteria());
    } else {
      setFilters(defaultAppliedCustomFilters);
    }
  }, [edited]);
  
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
  
  const handleOpen = () => {
    setFilters(getDefaultAppliedCustomFilters());
    setIsOpen(true);
  };

  const handleClose = () => {
    setCurrentFilter(CLEARED_STATE_FILTER);
  };

  const handleAddFilter = () => {
    setCurrentFilter(CLEARED_STATE_FILTER);
    setFilters([...filters, CLEARED_STATE_FILTER]);
  };

  function updateJsonExt(inputJsonExt, outputFilters) {
    const existingData = JSON.parse(inputJsonExt || '{}');
    if (!existingData.hasOwnProperty("advanced_criteria")) {
      existingData.advanced_criteria = [];
    }
    const filterData = JSON.parse(outputFilters);
    existingData.advanced_criteria = filterData;
    const updatedJsonExt = JSON.stringify(existingData);
    return updatedJsonExt;
  }

  const handleRemoveFilter = () => {
    setCurrentFilter(CLEARED_STATE_FILTER);
    setAppliedFiltersRowStructure([CLEARED_STATE_FILTER]);
    setFilters([]);
  };

  const normalizeFilterValue = (value) => {
    if (!value) return "";
    if (typeof value === "object") {
        return value.name || value.code || value.id || value.value || "";
    }
    return value;
  };

  const saveCriteria = () => {
    setAppliedFiltersRowStructure(filters);
    const outputFilters = JSON.stringify(
      filters.map(({ filter, value, field, type, referential, typeLocation, amount }) => {
        return {
          amount: amount,
          type: type,
          referential: referential,
          typeLocation: typeLocation,
          filter: filter,
          field: field,
          value: value,
          custom_filter_condition: `${field}__${filter}__${type}=${normalizeFilterValue(value)}`
        };
      })
    );
    const jsonExt = updateJsonExt(objectToSave.jsonExt, outputFilters)
    updateAttributes(jsonExt);
    console.log('outputFilters', outputFilters);
    setAppliedCustomFilters(outputFilters);
    handleClose();
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

  return (
    <>
          {filters.map((filter, index) => {
            return (<AdvancedCriteriaRowValue 
              customFilters={customFilters}
              currentFilter={filter}
              setCurrentFilter={setCurrentFilter}
              index={index}
              filters={filters}
              setFilters={setFilters}
              readOnly={confirmed || readOnly}
            />)
          })}
          { !confirmed ? (
          <div 
            style={{ backgroundColor: "#DFEDEF", paddingLeft: "10px", paddingBottom: "10px" }}
          >

            <Button 
              onClick={handleAddFilter} 
              variant="outlined"
              startIcon={
                <AddCircle
                  style={{
                    border: 'thin solid',
                    borderRadius: '40px',
                    width: '16px',
                    height: '16px',
                  }}
                />
              }
              style={{ 
                border: "0px", 
                "marginBottom": "6px", 
                fontSize: "0.8rem" 
              }}
              disabled={confirmed || readOnly}
            >
              {formatMessage(intl, "paymentPlan", "paymentPlan.advancedCriteria.button.addFilters")}
            </Button>
          </div>
          ) : (<></>) }
          <div>
          <div style={{ float: 'left' }}>
            <Button
              onClick={handleRemoveFilter}
              variant="outlined"
              style={{
                border: '0px',
              }}
              disabled={confirmed || readOnly}
            >
              {formatMessage(intl, 'individual', 'paymentPlan.advancedCriteria.button.clearAllFilters')}
            </Button>
          </div>
          <div style={{
            float: 'right',
            paddingRight: '16px',
            }}
          >
            <Button 
              onClick={saveCriteria} 
              variant="contained" 
              color="primary" 
              autoFocus
              disabled={!object || confirmed || readOnly}
            >
              {formatMessage(intl, "paymentPlan", "paymentPlan.advancedCriteria.button.filter")}
            </Button>
          </div>
        </div>
  </>
  );
}

const mapStateToProps = (state, props) => ({
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
