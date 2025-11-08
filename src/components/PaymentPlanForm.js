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
import { fetchPaymentPlan, clearPaymentPlan } from "../actions";
import { MAX_PERIODICITY_VALUE, MIN_PERIODICITY_VALUE } from "../constants";
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

    isMandatoryFieldsEmpty = () => {
        const { paymentPlan } = this.state;
        if (
            !!paymentPlan.code &&
            !!paymentPlan.name &&
            !!paymentPlan.benefitPlanTypeName &&
            !!paymentPlan.calculation &&
            !!paymentPlan.benefitPlan &&
            !!paymentPlan.periodicity &&
            !!paymentPlan.dateValidFrom
        ) {
            return false;
        }
        return true;
    }

    isPeriodicityValid = () => {
        let periodicityInt = parseInt(this.state.paymentPlan.periodicity);
        return !!periodicityInt ? periodicityInt >= MIN_PERIODICITY_VALUE && periodicityInt <= MAX_PERIODICITY_VALUE : false;
    }

    doesPaymentPlanChange = () => {
        const { paymentPlan } = this.props;
        if (_.isEqual(paymentPlan, this.state.paymentPlan)) {
          return false;
        }
        return true;
      };

    canSave = () =>  
        !this.isMandatoryFieldsEmpty() &&
        this.isPeriodicityValid() &&
        !!this.state.jsonExtValid &&
        this.doesPaymentPlanChange();

    save = paymentPlan => this.props.save(paymentPlan);

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
        return (
            <div className={shouldBeLocked ? classes.lockedPage : null}>
                <Helmet title={formatMessageWithValues(this.props.intl, "paymentPlan", "paymentPlan.page.title", this.titleParams())} />
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
                    mandatoryFieldsEmpty={this.isMandatoryFieldsEmpty()}
                    saveTooltip={formatMessage(intl, "paymentPlan", `saveButton.tooltip.${this.canSave() ? 'enabled' : 'disabled'}`)}
                    setJsonExtValid={this.setJsonExtValid}
                    setRequiredValid={this.setRequiredValid}
                    paymentPlanId={paymentPlanId}
                    isReplacing={isReplacing}
                    openDirty={save}
                    readOnly={shouldBeLocked}
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
