import React from "react";
import messages_en from "./translations/en.json";
import messages_fr from "./translations/fr.json";
import reducer from "./reducer";
import { LocalOffer, Folder } from "@material-ui/icons";
import ContributionPlansPage from "./pages/ContributionPlansPage";
import ContributionPlanPage from "./pages/ContributionPlanPage";
import ContributionPlanBundlesPage from "./pages/ContributionPlanBundlesPage";
import ContributionPlanBundlePage from "./pages/ContributionPlanBundlePage";
import ContributionPlanBundleReplacePage from "./pages/ContributionPlanBundleReplacePage";
import ContributionPlanBundlePicker from "./pickers/ContributionPlanBundlePicker";
import ContributionPlanPicker from "./pickers/ContributionPlanPicker";
import PaymentPlansPage from "./pages/PaymentPlansPage";
import PaymentPlanPage from "./pages/PaymentPlanPage";
import PaymentPlanReplacePage from "./pages/PaymentPlanReplacePage";
import PaymentPlanPicker from "./pickers/PaymentPlanPicker";
import {
    RIGHT_CONTRIBUTION_PLAN_BUNDLE_SEARCH,
    RIGHT_CONTRIBUTION_PLAN_SEARCH, 
    RIGHT_PAYMENT_PLAN_SEARCH
} from "./constants";
import { FormattedMessage } from "@openimis/fe-core";

const ROUTE_CONTRIBUTION_PLANS = "contributionPlans";
const ROUTE_CONTRIBUTION_PLAN = "contributionPlans/contributionPlan";
const ROUTE_CONTRIBUTION_PLAN_BUNDLES = "contributionPlanBundles";
const ROUTE_CONTRIBUTION_PLAN_BUNDLE = "contributionPlanBundles/contributionPlanBundle";
const ROUTE_CONTRIBUTION_PLAN_BUNDLE_REPLACE = "contributionPlanBundles/replaceContributionPlanBundle";
const ROUTE_PAYMENT_PLANS = "paymentPlans";
const ROUTE_PAYMENT_PLAN = "paymentPlans/paymentPlan";
const ROUTE_PAYMENT_PLAN_REPLACE = "paymentPlans/replacePaymentPlan";

const DEFAULT_CONFIG = {
    "translations": [
        { key: "en", messages: messages_en },
        { key: "fr", messages: messages_fr }
    ],
    "reducers": [{ key: 'contributionPlan', reducer }],
    "refs": [
        { key: "contributionPlan.route.contributionPlans", ref: ROUTE_CONTRIBUTION_PLANS },
        { key: "contributionPlan.route.contributionPlan", ref: ROUTE_CONTRIBUTION_PLAN },
        { key: "contributionPlan.route.contributionPlanBundles", ref: ROUTE_CONTRIBUTION_PLAN_BUNDLES },
        { key: "contributionPlan.route.contributionPlanBundle", ref: ROUTE_CONTRIBUTION_PLAN_BUNDLE },
        { key: "contributionPlan.route.replaceContributionPlanBundle", ref: ROUTE_CONTRIBUTION_PLAN_BUNDLE_REPLACE },
        { key: "contributionPlan.ContributionPlanBundlePicker", ref: ContributionPlanBundlePicker },
        { key: "contributionPlan.ContributionPlanBundlePicker.projection", ref: ["id", "code", "name", "periodicity", "dateValidFrom", "dateValidTo", "isDeleted", "replacementUuid"] },
        { key: "contributionPlan.ContributionPlanPicker", ref: ContributionPlanPicker },
        { key: "contributionPlan.ContributionPlanPicker.projection", ref: ["id", "code", "name"] },
        { key: "contributionPlan.route.paymentPlans", ref: ROUTE_PAYMENT_PLANS },
        { key: "contributionPlan.route.paymentPlan", ref: ROUTE_PAYMENT_PLAN },
        { key: "contributionPlan.PaymentPlanPicker", ref: PaymentPlanPicker },
        { key: "contributionPlan.PaymentPlanPicker.projection", ref: ["id", "code", "name", "periodicity", "dateValidFrom", "dateValidTo", "isDeleted", "replacementUuid", "benefitPlan"] },
        { key: "contributionPlan.route.replacePaymentPlan", ref: ROUTE_PAYMENT_PLAN_REPLACE },
    ],
    "core.Router": [
        { path: ROUTE_CONTRIBUTION_PLANS, component: ContributionPlansPage },
        { path: ROUTE_CONTRIBUTION_PLAN  + "/:contributionplan_id?", component: ContributionPlanPage },
        { path: ROUTE_CONTRIBUTION_PLAN_BUNDLES, component: ContributionPlanBundlesPage },
        { path: ROUTE_CONTRIBUTION_PLAN_BUNDLE  + "/:contributionplanbundle_id?", component: ContributionPlanBundlePage },
        { path: ROUTE_CONTRIBUTION_PLAN_BUNDLE_REPLACE  + "/:contributionplanbundle_id", component: ContributionPlanBundleReplacePage },
        { path: ROUTE_PAYMENT_PLANS, component: PaymentPlansPage },
        { path: ROUTE_PAYMENT_PLAN  + "/:paymentplan_id?", component: PaymentPlanPage },
        { path: ROUTE_PAYMENT_PLAN_REPLACE  + "/:paymentplan_id", component: PaymentPlanReplacePage },
    ],
    "admin.MainMenu": [
        {
            text: <FormattedMessage module="contributionPlan" id="contributionPlans.page.title" />,
            icon: <LocalOffer />,
            route: "/" + ROUTE_CONTRIBUTION_PLANS,
            filter: rights => rights.includes(RIGHT_CONTRIBUTION_PLAN_SEARCH),
            id: 'admin.contributionPlans'
        },
        {
            text: <FormattedMessage module="contributionPlan" id="contributionPlanBundles.page.title" />,
            icon: <Folder />,
            route: "/" + ROUTE_CONTRIBUTION_PLAN_BUNDLES,
            filter: rights => rights.includes(RIGHT_CONTRIBUTION_PLAN_BUNDLE_SEARCH),
            id: 'admin.contributionPlanBundles'
        },
    ],
    "invoice.MainMenu": [
        {
            text: <FormattedMessage module="contributionPlan" id="paymentPlans.page.title" />,
            icon: <LocalOffer />,
            route: "/" + ROUTE_PAYMENT_PLANS,
            filter: rights => rights.includes(RIGHT_PAYMENT_PLAN_SEARCH),
            id: 'legalAndFinance.paymentPlans'
        }
    ]
}

export const ContributionPlanModule = (cfg) => {
    return { ...DEFAULT_CONFIG, ...cfg };
}
