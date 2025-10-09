import React, { Fragment } from "react";
import { Grid, Divider, Typography, Button } from "@material-ui/core";
import {
    withModulesManager,
    formatMessage,
    FormPanel,
    TextInput,
    FormattedMessage,
    PublishedComponent,
    NumberInput,
    Contributions,
    ValidatedTextInput,
} from "@openimis/fe-core";
import { connect } from "react-redux";
import { injectIntl } from "react-intl";
import { withTheme, withStyles } from "@material-ui/core/styles";
import {
    EMPTY_PERIODICITY_VALUE,
    MIN_PERIODICITY_VALUE,
    MAX_PERIODICITY_VALUE,
    CONTRIBUTIONPLAN_CALCULATION_CONTRIBUTION_KEY,
    CONTRIBUTIONPLAN_CALCULATIONRULE_CONTRIBUTION_KEY,
    PAYMENTPLAN_CLASSNAME,
    RIGHT_CALCULATION_WRITE,
    RIGHT_CALCULATION_UPDATE,
    PAYMENT_PLAN_TYPE,
} from "../constants";

import {
    paymentPlanCodeClear,
    paymentPlanCodeSetValid,
    paymentPlanCodeValidation,
} from "../actions"
import PaymentPlanTypePicker from "../pickers/PaymentPlanTypePicker";
import { isEmptyObject } from "../utils";
import AdvancedCriteriaDialog from "../dialogs/AdvancedCriteriaDialog";
import { CLEARED_STATE_FILTER } from "../constants";

const styles = theme => ({
    tableTitle: theme.table.title,
    item: theme.paper.item,
    fullHeight: {
        height: "100%"
    }
});

const GRID_ITEM_SIZE = 3;

class PaymentPlanHeadPanel extends FormPanel {

    constructor(props) {
        super(props);
        this.state = {
          appliedCustomFilters: [CLEARED_STATE_FILTER],
          appliedFiltersRowStructure: [CLEARED_STATE_FILTER],
        };
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        super.componentDidUpdate(prevProps, prevState, snapshot);
    }

    shouldValidate = (input) => {
        const { savedCode } = this.props;
        return input !== savedCode;
    };

    updateTypeOfPaymentPlan = (field, value) => {
        this.updateAttributes({
            "benefitPlan": null, [field]: value, "calculation": null
        })
    };

    updateJsonExt = (value) => {
        this.updateAttributes({
            "jsonExt": value
        })
    };

    onChangeFilters = (fltrs) => {
        let filters = { ...this.state.paymentPlan.jsonExt };
        fltrs.forEach((filter) => {
          if (filter.value === null) {
            delete filters[filter.id];
          } else {
            filters[filter.id] = { value: filter.value, filter: filter.filter };
          }
        });
        this.setState({ filters }, (e) => this.applyFilters());
    };

    getDefaultAppliedCustomFilters = () => {
        const { jsonExt } = this.props.edited;
        try {
          const jsonData = JSON.parse(jsonExt);
          const advancedCriteria = jsonData.advanced_criteria || [];
          console.log("advancedCriteria", advancedCriteria);

          return advancedCriteria.map(
            ({ amount, type, field, value, referential, typeLocation, custom_filter_condition }) => {
              let parsedValue = value;
              try {
                // Reconvertir les chaînes JSON en objets si possible (ex: Location)
                if (typeof value === "string" && value.startsWith("{") && value.endsWith("}")) {
                  parsedValue = JSON.parse(value);
                }
              } catch (err) {
                parsedValue = value;
              }

              return {
                amount,
                custom_filter_condition,
                field,
                filter: custom_filter_condition?.split("__")?.[1] || "",
                type,
                referential,
                typeLocation,
                value: parsedValue,
              };
            }
          );
        } catch (error) {
          console.error("Erreur parsing advanced_criteria :", error);
          return [];
        }
      };

    setAppliedCustomFilters = (appliedCustomFilters) => {
        this.setState({ appliedCustomFilters: appliedCustomFilters });
    };

    setAppliedFiltersRowStructure = (appliedFiltersRowStructure) => {
        this.setState({ appliedFiltersRowStructure: appliedFiltersRowStructure });
    };

    render() {
        const {
            intl,
            classes,
            mandatoryFieldsEmpty,
            setJsonExtValid,
            setRequiredValid,
            isCodeValid,
            isCodeValidating,
            validationError,
            readOnly = false,
        }
            = this.props;
        const { benefitPlan: productOrBenefitPlan, calculation: calculationId, ...others } = this.props.edited;
        const calculation = !!calculationId ? { id: calculationId } : null;
        const paymentPlan = { productOrBenefitPlan, calculation, ...others };
        const paymentPlanType = paymentPlan?.benefitPlanTypeName;
        const { appliedCustomFilters, appliedFiltersRowStructure } = this.state;

        const isBenefitPlanType = () => paymentPlanType.replace(/\s+/g, '') === PAYMENT_PLAN_TYPE.BENEFIT_PLAN;

        if (paymentPlanType) {
            // probably could get rid of that if we use double JSON.parse in reducer
            const objectBenefitPlan = typeof paymentPlan.productOrBenefitPlan === 'object' ?
              paymentPlan.productOrBenefitPlan : JSON.parse(paymentPlan.productOrBenefitPlan || '{}');
            paymentPlan.benefitPlan = objectBenefitPlan;
            if (paymentPlanType === 'benefitplan' || paymentPlanType === 'benefit plan') {
                paymentPlan.periodicity = 1;
                this.state.data.periodicity = paymentPlan.periodicity;
            }
            return (
                <Fragment>
                    <Grid container className={classes.tableTitle}>
                        <Grid item style={{ flex: 1 }}>
                            <Grid
                                container
                                align="center"
                                justify="center"
                                direction="column"
                                className={classes.fullHeight}
                            >
                                <Grid item style={{ flex: 1, display: "flex" }}>
                                    <Typography style={{ marginTop: "6px" }}>
                                        <FormattedMessage
                                          module="contributionPlan"
                                          id="paymentPlan.headPanel.title"
                                        />
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>
                    <Divider />
                    {mandatoryFieldsEmpty && (
                        <Fragment>
                            <div className={classes.item}>
                                <FormattedMessage module="contributionPlan" id="mandatoryFieldsEmptyError" />
                            </div>
                            <Divider />
                        </Fragment>
                    )}
                    {paymentPlan.id && (
                      <Button
                        onClick={() => {
                          const currentDateObject = new Date();
                          const currentDate = currentDateObject.toISOString();
                          paymentPlan.dateValidTo = currentDate;
                          this.updateAttribute("dateValidTo", currentDate);
                        }}
                        variant="outlined"
                        color="#DFEDEF"
                        className={classes.button}
                        disabled={readOnly}
                        style={{
                          border: "0px",
                          textAlign: "right",
                          display: "block",
                          marginLeft: "auto",
                          marginRight: 0
                       }}
                      >
                        {formatMessage(intl, "paymentPlan", "paymentPlan.deactivatePaymentPlan")}
                      </Button>
                    )}
                    <Grid container className={classes.item}>
                        <Grid item xs={GRID_ITEM_SIZE} className={classes.item}>
                            <PaymentPlanTypePicker
                                module="contributionPlan"
                                label="type"
                                readOnly={!!paymentPlan.id || readOnly}
                                withNull={false}
                                required
                                value={paymentPlan?.benefitPlanTypeName?.replace(/\s+/g, '') ?? ''}
                                onChange={(v) => this.updateTypeOfPaymentPlan("benefitPlanTypeName", v)}
                                withLabel
                            />
                        </Grid>
                        <Grid item xs={GRID_ITEM_SIZE} className={classes.item}>
                            <ValidatedTextInput
                                module="contributionPlan"
                                label="code"
                                required={true}
                                value={!!paymentPlan.code ? paymentPlan.code : ""}
                                readOnly={!!paymentPlan.id || readOnly}
                                itemQueryIdentifier="paymentPlanCode"
                                codeTakenLabel="paymentPlan.codeTaken"
                                shouldValidate={this.shouldValidate}
                                isValid={isCodeValid}
                                isValidating={isCodeValidating}
                                validationError={validationError}
                                action={paymentPlanCodeValidation}
                                clearAction={paymentPlanCodeClear}
                                setValidAction={paymentPlanCodeSetValid}
                                onChange={(v) => this.updateAttribute("code", v)}

                            />
                        </Grid>
                        <Grid item xs={GRID_ITEM_SIZE} className={classes.item}>
                            <TextInput
                                module="contributionPlan"
                                label="name"
                                readOnly={readOnly}
                                required
                                value={!!paymentPlan.name ? paymentPlan.name : ""}
                                onChange={(v) => this.updateAttribute("name", v)}
                            />
                        </Grid>
                        <Grid item xs={GRID_ITEM_SIZE} className={classes.item}>
                            <Contributions
                                contributionKey={CONTRIBUTIONPLAN_CALCULATIONRULE_CONTRIBUTION_KEY}
                                label={formatMessage(intl, "paymentPlan", "calculation")}
                                value={!!calculationId ? calculationId : null}
                                onChange={this.updateAttribute}
                                context={paymentPlanType}
                                readOnly={readOnly}
                                required
                            />
                        </Grid>
                        <Grid item xs={GRID_ITEM_SIZE} className={classes.item}>
                            <PublishedComponent
                                pubRef={paymentPlanType === PAYMENT_PLAN_TYPE.PRODUCT
                                    ? "product.ProductPicker"
                                    : "socialProtection.BenefitPlanPicker"}
                                withNull={true}
                                readOnly={readOnly}
                                label={formatMessage(intl, "paymentPlan", "benefitPlan")}
                                required
                                value={paymentPlan.benefitPlan !== undefined && paymentPlan.benefitPlan !== null ? (isEmptyObject(paymentPlan.benefitPlan) ? null : paymentPlan.benefitPlan) : null}
                                onChange={(v) => this.updateAttribute("benefitPlan", v)}
                                type='EVERY_TYPE'
                            />
                        </Grid>
                        {paymentPlanType !== 'benefitplan' && paymentPlanType !== 'benefit plan' && (
                            <Grid item xs={GRID_ITEM_SIZE} className={classes.item}>
                                <NumberInput
                                    module="contributionPlan"
                                    readOnly={readOnly}
                                    label="periodicity"
                                    required
                                    /**
                                    * @see min set to @see EMPTY_PERIODICITY_FILTER when filter unset to avoid @see NumberInput error message
                                    */
                                    min={!!paymentPlan.periodicity ? MIN_PERIODICITY_VALUE : EMPTY_PERIODICITY_VALUE}
                                    max={MAX_PERIODICITY_VALUE}
                                    value={!!paymentPlan.periodicity ? paymentPlan.periodicity : null}
                                    onChange={(v) => this.updateAttribute("periodicity", v)}
                                />
                            </Grid>
                        )}
                        <Grid item xs={GRID_ITEM_SIZE} className={classes.item}>
                            <PublishedComponent
                                pubRef="core.DatePicker"
                                module="contributionPlan"
                                readOnly={readOnly}
                                label="dateValidFrom"
                                required
                                value={!!paymentPlan.dateValidFrom ? paymentPlan.dateValidFrom : null}
                                onChange={(v) => this.updateAttribute("dateValidFrom", v)}
                            />
                        </Grid>
                        <Grid item xs={GRID_ITEM_SIZE} className={classes.item}>
                            <PublishedComponent
                                pubRef="core.DatePicker"
                                module="contributionPlan"
                                readOnly={readOnly}
                                label="dateValidTo"
                                value={!!paymentPlan.dateValidTo ? paymentPlan.dateValidTo : null}
                                onChange={(v) => this.updateAttribute("dateValidTo", v)}
                            />
                        </Grid>
                    </Grid>
                    <Fragment>
                        <Typography>
                            <div className={classes.item}>
                                {isBenefitPlanType() ?
                                    <FormattedMessage module="contributionPlan" id="calculationParamsBFType"/> :
                                    <FormattedMessage module="contributionPlan" id="calculationParams"/>
                                }
                            </div>
                        </Typography>
                        <Divider />
                        <Grid container className={classes.item}>
                            <Contributions
                                contributionKey={CONTRIBUTIONPLAN_CALCULATION_CONTRIBUTION_KEY}
                                intl={intl}
                                className={PAYMENTPLAN_CLASSNAME}
                                entity={paymentPlan}
                                readOnly={readOnly}
                                requiredRights={[!!paymentPlan.id ? RIGHT_CALCULATION_UPDATE : RIGHT_CALCULATION_WRITE]}
                                value={!!paymentPlan.jsonExt ? paymentPlan.jsonExt : null}
                                onChange={this.updateAttribute}
                                gridItemStyle={classes.item}
                                gridItemSize={GRID_ITEM_SIZE}
                                setRequiredValid={setRequiredValid}
                                setJsonExtValid={setJsonExtValid}
                                periodicity={!!paymentPlan.periodicity ? paymentPlan.periodicity : null}
                            />
                        </Grid>
                    </Fragment>
                    {isBenefitPlanType() && (
                        <>
                            <Divider />
                            <Fragment>
                                <Typography>
                                    <div className={classes.item}>
                                        <FormattedMessage module="contributionPlan" id="paymentPlan.advancedCriteria" />
                                    </div>
                                </Typography>
                                <div className={classes.item}>
                                    <FormattedMessage module="contributionPlan" id="paymentPlan.advancedCriteria.tip" />
                                </div>
                                <Divider />
                                <Grid container className={classes.item}>

                                    <AdvancedCriteriaDialog
                                        object={paymentPlan.benefitPlan}
                                        objectToSave={paymentPlan}
                                        moduleName="social_protection"
                                        objectType="BenefitPlan"
                                        setAppliedCustomFilters={this.setAppliedCustomFilters}
                                        appliedCustomFilters={appliedCustomFilters}
                                        appliedFiltersRowStructure={appliedFiltersRowStructure}
                                        setAppliedFiltersRowStructure={this.setAppliedFiltersRowStructure}
                                        updateAttributes={this.updateJsonExt}
                                        getDefaultAppliedCustomFilters={this.getDefaultAppliedCustomFilters}
                                        edited={this.props.edited}
                                        readOnly={readOnly}
                                        />

                                </Grid>
                            </Fragment>
                            <Divider />
                        </>
                    )}
                </Fragment>
            );
        }

        return (
            <Fragment>
                <Grid container className={classes.tableTitle}>
                    <Grid item>
                        <Grid
                            container
                            align="center"
                            justify="center"
                            direction="column"
                            className={classes.fullHeight}
                        >
                            <Grid item>
                                <Typography>
                                    <FormattedMessage module="contributionPlan" id="paymentPlan.headPanel.title" />
                                </Typography>
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
                <Divider />
                {mandatoryFieldsEmpty && (
                    <Fragment>
                        <div className={classes.item}>
                            <FormattedMessage module="contributionPlan" id="mandatoryFieldsEmptyError" />
                        </div>
                        <Divider />
                    </Fragment>
                )}
                <Grid container className={classes.item}>
                    <Grid item xs={GRID_ITEM_SIZE} className={classes.item}>
                        <PaymentPlanTypePicker
                            module="contributionPlan"
                            label="type"
                            withNull={false}
                            required
                            value={paymentPlan?.benefitPlanTypeName?.replace(/\s+/g, '') ?? ''}
                            onChange={(v) => this.updateAttribute("benefitPlanTypeName", v)}
                            withLabel
                        />
                    </Grid>
                </Grid>
            </Fragment>
        );
    }
}

const mapStateToProps = (store) => ({
    isCodeValid:
    store.contributionPlan?.validationFields?.paymentPlanCode?.isValid,
    isCodeValidating:
    store.contributionPlan?.validationFields?.paymentPlanCode
        ?.isValidating,
    validationError:
    store.contributionPlan?.validationFields?.paymentPlanCode
        ?.validationError,
    savedCode: store.contributionPlan?.paymentPlan?.code,
});

export default withModulesManager(
    injectIntl(
        connect(
            mapStateToProps,
            null
        )(withTheme(withStyles(styles)(PaymentPlanHeadPanel)))
    )
);
