import React, { Component } from "react";
import {
    Form,
    withModulesManager,
    withHistory,
    formatMessage,
    formatMessageWithValues,
    Helmet,
    journalize
} from "@openimis/fe-core";
import { injectIntl } from "react-intl";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import PaymentPlanHeadPanel from "./PaymentPlanHeadPanel";
import PaymentPlanSaveProgressDialog from "./PaymentPlanSaveProgressDialog";
import { fetchPaymentPlan, clearPaymentPlan } from "../actions";
import { MAX_PERIODICITY_VALUE, MIN_PERIODICITY_VALUE, PAYMENT_PLAN_TYPE } from "../constants";
import { isEmptyObject } from "../utils";
import { parseJsonExt } from "../utils/advancedCriteriaJsonExt";
import _ from "lodash";

const styles = theme => ({
    paper: theme.paper.paper,
    paperHeader: theme.paper.header,
    paperHeaderAction: theme.paper.action,
    item: theme.paper.item,
    lockedPage: theme.page.locked,
});

class PaymentPlanForm extends Component {
    constructor(props) {
        super(props);
        this.state = {
            paymentPlan: {},
            jsonExtValid: true,
            requiredValid: false,
            clientMutationId: null,
        };
        this.headPanelInstance = null;
    }

    componentDidMount() {
        if (!!this.props.paymentPlanId) {
            this.props.fetchPaymentPlan(this.props.modulesManager, this.props.paymentPlanId);
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        // Refetch si paymentPlanId change (important pour le contexte de tâche)
        if (prevProps.paymentPlanId !== this.props.paymentPlanId && !!this.props.paymentPlanId) {
            this.props.fetchPaymentPlan(this.props.modulesManager, this.props.paymentPlanId);
        }
        
        if (prevProps.fetchedPaymentPlan !== this.props.fetchedPaymentPlan && !!this.props.fetchedPaymentPlan) {
            this.setState(
                (_, props) => ({ paymentPlan: props.paymentPlan })
            );
        }
        if (prevProps.submittingMutation && !this.props.submittingMutation) {
            this.props.journalize(this.props.mutation);
            this.setState((state, props) => ({
              clientMutationId: props.mutation.clientMutationId,
            }));
        }
    }

    isBenefitPlanType = (paymentPlan) => (
        (paymentPlan?.benefitPlanTypeName || '').replace(/\s+/g, '') === PAYMENT_PLAN_TYPE.BENEFIT_PLAN
    );

    isMandatoryFieldsEmpty = () => {
        const { paymentPlan } = this.state;
        const benefitPlanOk = !!paymentPlan.benefitPlan && !isEmptyObject(paymentPlan.benefitPlan);
        const periodicityOk = !!paymentPlan.periodicity;
        if (
            !!paymentPlan.code &&
            !!paymentPlan.name &&
            !!paymentPlan.benefitPlanTypeName &&
            !!paymentPlan.calculation &&
            benefitPlanOk &&
            periodicityOk &&
            !!paymentPlan.dateValidFrom
        ) {
            return false;
        }
        return true;
    }

    isPeriodicityValid = () => {
        const { paymentPlan } = this.state;
        if (!paymentPlan.periodicity && this.isBenefitPlanType(paymentPlan)) {
            return true;
        }
        const periodicityInt = parseInt(paymentPlan.periodicity, 10);
        return !!periodicityInt
            && periodicityInt >= MIN_PERIODICITY_VALUE
            && periodicityInt <= MAX_PERIODICITY_VALUE;
    }

    doesPaymentPlanChange = () => {
        if (!this.props.paymentPlanId) {
            return !_.isEmpty(this.state.paymentPlan);
        }
        const { paymentPlan } = this.props;
        return !_.isEqual(paymentPlan, this.state.paymentPlan);
    };

    canSave = () =>
        !this.isMandatoryFieldsEmpty() &&
        this.isPeriodicityValid() &&
        !!this.state.jsonExtValid &&
        this.doesPaymentPlanChange();

    save = (paymentPlan) => {
        let normalized = paymentPlan;
        const flushCriteria = this.headPanelInstance?.flushAdvancedCriteria;
        if (typeof flushCriteria === 'function') {
            normalized = flushCriteria(paymentPlan) || paymentPlan;
        }
        normalized = { ...normalized };
        const parsedJsonExt = parseJsonExt(normalized.jsonExt);
        if (Object.keys(parsedJsonExt).length > 0) {
            normalized.jsonExt = JSON.stringify(parsedJsonExt);
        }
        this.setState({ paymentPlan: normalized });
        this.props.save(normalized);
    };

    onEditedChanged = paymentPlan => this.setState({ paymentPlan })

    titleParams = () => this.props.titleParams(this.state.paymentPlan);

    setJsonExtValid = (valid) => this.setState({ jsonExtValid: !!valid });
    setRequiredValid = (valid) => this.setState({ requiredValid: !!valid });

    render() {
        const {
          intl,
          back,
          paymentPlanId,
          save,
          isReplacing = false,
          classes,
        } = this.props;
        const shouldBeLocked = Boolean(this.state.clientMutationId);
        const showSaveProgress = this.props.submittingMutation;
        return (
            <div className={shouldBeLocked ? classes.lockedPage : null}>
                <Helmet title={formatMessageWithValues(this.props.intl, "paymentPlan", "paymentPlan.page.title", this.titleParams())} />
                <PaymentPlanSaveProgressDialog open={showSaveProgress} />
                <Form
                    module="paymentPlan"
                    title="paymentPlan.page.title"
                    titleParams={this.titleParams()}
                    edited={this.state.paymentPlan}
                    back={back}
                    canSave={this.canSave}
                    save={this.save}
                    onEditedChanged={this.onEditedChanged}
                    HeadPanel={PaymentPlanHeadPanel}
                    headPanelRef={(instance) => { this.headPanelInstance = instance; }}
                    mandatoryFieldsEmpty={this.isMandatoryFieldsEmpty()}
                    saveTooltip={formatMessage(intl, "paymentPlan", `saveButton.tooltip.${this.canSave() ? 'enabled' : 'disabled'}`)}
                    setJsonExtValid={this.setJsonExtValid}
                    setRequiredValid={this.setRequiredValid}
                    paymentPlanId={paymentPlanId}
                    isReplacing={isReplacing}
                    openDirty={save}
                    readOnly={shouldBeLocked}
                    update={this.props.submittingMutation}
                />
            </div>
        )
    }
}

const mapStateToProps = state => ({
    fetchingPaymentPlan: state.contributionPlan.fetchingPaymentPlan,
    fetchedPaymentPlan: state.contributionPlan.fetchedPaymentPlan,
    paymentPlan: state.contributionPlan.paymentPlan,
    errorPaymentPlan: state.contributionPlan.errorPaymentPlan,
    submittingMutation: state.contributionPlan.submittingMutation,
    mutation: state.contributionPlan.mutation,
    isCodeValid: state.contributionPlan?.validationFields?.paymentPlanCode?.isValid,
});

const mapDispatchToProps = dispatch => {
    return bindActionCreators({
        fetchPaymentPlan, clearPaymentPlan, journalize
    },
        dispatch);
};

export default withHistory(
    withModulesManager(
        injectIntl(
            withTheme(withStyles(styles)(
                connect(mapStateToProps, mapDispatchToProps)(PaymentPlanForm))
            )
        )
    )
);
