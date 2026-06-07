import {
  graphql,
  formatPageQuery,
  formatPageQueryWithCount,
  formatMutation,
  decodeId,
  formatGQLString,
  graphqlWithVariables,
} from "@openimis/fe-core";
import { isBase64Encoded } from "./utils";
import { PAYMENT_PLAN_TYPE } from "./constants";
import { formatJsonExtForGQL } from "./utils/advancedCriteriaJsonExt";

const CONTRIBUTIONPLAN_FULL_PROJECTION = (modulesManager) => [
  "id",
  "code",
  "name",
  "calculation",
  "jsonExt",
  "benefitPlan",
  "benefitPlanType_Model",
  "periodicity",
  "dateValidFrom",
  "dateValidTo",
  "isDeleted",
];

const CONTRIBUTIONPLAN_PICKER_PROJECTION = () => ["id", "code", "name"];

const CONTRIBUTIONPLANBUNDLE_FULL_PROJECTION = () => [
  "id",
  "code",
  "name",
  "periodicity",
  "dateValidFrom",
  "dateValidTo",
  "isDeleted",
  "replacementUuid",
];

const CONTRIBUTIONPLANBUNDLEDETAILS_FULL_PROJECTION = (modulesManager) => [
  "id",
  "contributionPlan" + `{${CONTRIBUTIONPLAN_FULL_PROJECTION(modulesManager)}}`,
  "contributionPlanBundle" + `{${CONTRIBUTIONPLANBUNDLE_FULL_PROJECTION()}}`,
  "dateValidFrom",
  "dateValidTo",
  "replacementUuid",
];

const PAYMENTPLAN_FULL_PROJECTION = (modulesManager) => [
  "id",
  "code",
  "name",
  "calculation",
  "jsonExt",
  "benefitPlan",
  "benefitPlanType",
  "benefitPlanTypeName",
  "periodicity",
  "dateValidFrom",
  "dateValidTo",
  "isDeleted",
];

const PAYMENTPLAN_PICKER_PROJECTION = () => ["id", "code", "name", "benefitPlan"];

function dateTimeToDate(date) {
  return date.split("T")[0];
}

export function fetchContributionPlans(modulesManager, params) {
  const payload = formatPageQueryWithCount(
    "contributionPlan",
    params,
    CONTRIBUTIONPLAN_FULL_PROJECTION(modulesManager)
  );
  return graphql(payload, "CONTRIBUTIONPLAN_CONTRIBUTIONPLANS");
}

export function fetchPickerContributionPlans(mm, params) {
  const payload = formatPageQuery(
    "contributionPlan",
    params,
    CONTRIBUTIONPLAN_PICKER_PROJECTION()
  );
  return graphql(payload, "CONTRIBUTIONPLAN_PICKERCONTRIBUTIONPLANS");
}

export function fetchContributionPlan(modulesManager, contributionPlanId) {
  let filter = !!contributionPlanId ? `id: "${contributionPlanId}"` : "";
  const payload = formatPageQuery(
    "contributionPlan",
    [filter],
    CONTRIBUTIONPLAN_FULL_PROJECTION(modulesManager)
  );
  return graphql(payload, "CONTRIBUTIONPLAN_CONTRIBUTIONPLAN");
}

export function clearContributionPlan() {
  return (dispatch) => {
    dispatch({ type: "CONTRIBUTIONPLAN_CONTRIBUTIONPLAN_CLEAR" });
  };
}

export function fetchContributionPlanBundles(params) {
  const payload = formatPageQueryWithCount(
    "contributionPlanBundle",
    params,
    CONTRIBUTIONPLANBUNDLE_FULL_PROJECTION()
  );
  return graphql(payload, "CONTRIBUTIONPLAN_CONTRIBUTIONPLANBUNDLES");
}

export function fetchContributionPlanBundle(contributionPlanBundleId, filters=[]) {
  let filter = !!contributionPlanBundleId
    ? `id: "${contributionPlanBundleId}"`
    : "";
  filters.push(filter)
  const payload = formatPageQuery(
    "contributionPlanBundle",
    filters,
    CONTRIBUTIONPLANBUNDLE_FULL_PROJECTION()
  );
  return graphql(payload, "CONTRIBUTIONPLAN_CONTRIBUTIONPLANBUNDLE");
}

export function clearContributionPlanBundle() {
  return (dispatch) => {
    dispatch({ type: "CONTRIBUTIONPLAN_CONTRIBUTIONPLANBUNDLE_CLEAR" });
  };
}

export function clearContributionPlanBundleDetails() {
  return (dispatch) => {
    dispatch({ type: "CONTRIBUTIONPLAN_CONTRIBUTIONPLANBUNDLEDETAILS_CLEAR" });
  };
}

export function fetchContributionPlanBundleContributionPlans(
  modulesManager,
  params
) {
  const payload = formatPageQueryWithCount(
    "contributionPlanBundleDetails",
    params,
    CONTRIBUTIONPLANBUNDLEDETAILS_FULL_PROJECTION(modulesManager)
  );
  return graphql(payload, "CONTRIBUTIONPLAN_CONTRIBUTIONPLANBUNDLEDETAILS");
}

export function fetchPaymentPlans(modulesManager, params) {
  const payload = formatPageQueryWithCount(
    "paymentPlan",
    params,
    PAYMENTPLAN_FULL_PROJECTION(modulesManager)
  );
  return graphql(payload, "CONTRIBUTIONPLAN_PAYMENTPLANS");
}

export function fetchPaymentPlan(modulesManager, paymentPlanId) {
  let filter = !!paymentPlanId ? `id: "${paymentPlanId}"` : "";
  const payload = formatPageQuery(
    "paymentPlan",
    [filter],
    PAYMENTPLAN_FULL_PROJECTION(modulesManager)
  );
  return graphql(payload, "CONTRIBUTIONPLAN_PAYMENTPLAN");
}

export function fetchPickerPaymentPlans(modulesManager, params) {
  const payload = formatPageQuery(
    "paymentPlan",
    params,
    PAYMENTPLAN_PICKER_PROJECTION()
  );
  return graphql(payload, "CONTRIBUTIONPLAN_PICKERPAYMENTPLANS");
}

function formatContributionPlanGQL(contributionPlan) {
  return `
        ${!!contributionPlan.id ? `id: "${decodeId(contributionPlan.id)}"` : ""}
        ${
          !!contributionPlan.code
            ? `code: "${formatGQLString(contributionPlan.code)}"`
            : ""
        }
        ${
          !!contributionPlan.name
            ? `name: "${formatGQLString(contributionPlan.name)}"`
            : ""
        }
        ${
          !!contributionPlan.calculation
            ? `calculation: "${contributionPlan.calculation}"`
            : ""
        }
        ${
          !!contributionPlan.jsonExt
            ? `jsonExt: ${JSON.stringify(contributionPlan.jsonExt)}`
            : ""
        }
        ${
          `benefitPlanType_Model: "${formatGQLString(PAYMENT_PLAN_TYPE.PRODUCT)}"`
        }
        ${
          !!contributionPlan.benefitPlan
            ? (isBase64Encoded(contributionPlan.benefitPlan.id)
              ? `benefitPlanId: "${decodeId(contributionPlan.benefitPlan.id)}"`
              : `benefitPlanId: "${contributionPlan.benefitPlan.id}"`)
            : ""
        }
        ${
          !!contributionPlan.periodicity
            ? `periodicity: ${contributionPlan.periodicity}`
            : ""
        }
        ${
          !!contributionPlan.dateValidFrom
            ? `dateValidFrom: "${dateTimeToDate(
                contributionPlan.dateValidFrom
              )}"`
            : ""
        }
        ${
          !!contributionPlan.dateValidTo
            ? `dateValidTo: "${dateTimeToDate(contributionPlan.dateValidTo)}"`
            : ""
        }
    `;
}

function formatContributionPlanBundleGQL(
  contributionPlanBundle,
  omitImmutableFields = false,
  isReplaceMutation = false
) {
  return `
        ${
          !!contributionPlanBundle.id
            ? `${isReplaceMutation ? "uuid" : "id"}: "${decodeId(
                contributionPlanBundle.id
              )}"`
            : ""
        }
        ${
          !!contributionPlanBundle.code && !omitImmutableFields
            ? `code: "${formatGQLString(contributionPlanBundle.code)}"`
            : ""
        }
        ${
          !!contributionPlanBundle.name
            ? `name: "${formatGQLString(contributionPlanBundle.name)}"`
            : ""
        }
        ${
          !!contributionPlanBundle.periodicity
            ? `periodicity: ${contributionPlanBundle.periodicity}`
            : ""
        }
        ${
          !!contributionPlanBundle.dateValidFrom
            ? `dateValidFrom: "${dateTimeToDate(
                contributionPlanBundle.dateValidFrom
              )}"`
            : ""
        }
        ${
          !!contributionPlanBundle.dateValidTo
            ? `dateValidTo: "${dateTimeToDate(
                contributionPlanBundle.dateValidTo
              )}"`
            : ""
        }
    `;
}

function formatContributionPlanBundleDetailsGQL(
  contributionPlanBundleDetails,
  isReplaceMutation = false
) {
  return `
        ${
          !!contributionPlanBundleDetails.id
            ? `${isReplaceMutation ? "uuid" : "id"}: "${decodeId(
                contributionPlanBundleDetails.id
              )}"`
            : ""
        }
        ${
          !!contributionPlanBundleDetails.contributionPlan
            ? `contributionPlanId: "${decodeId(
                contributionPlanBundleDetails.contributionPlan.id
              )}"`
            : ""
        }
        ${
          !!contributionPlanBundleDetails.contributionPlanBundleId
            ? `contributionPlanBundleId: "${contributionPlanBundleDetails.contributionPlanBundleId}"`
            : ""
        }
        ${
          !!contributionPlanBundleDetails.dateValidFrom
            ? `dateValidFrom: "${dateTimeToDate(
                contributionPlanBundleDetails.dateValidFrom
              )}"`
            : ""
        }
        ${
          !!contributionPlanBundleDetails.dateValidTo
            ? `dateValidTo: "${dateTimeToDate(
                contributionPlanBundleDetails.dateValidTo
              )}"`
            : ""
        }
    `;
}

function formatPaymentPlanGQL(paymentPlan, isReplaceMutation = false) {
  // probably could get rid of that if we use double JSON.parse in reducer
  const objectBenefitPlan = typeof paymentPlan.benefitPlan === 'object' ? 
    paymentPlan.benefitPlan : JSON.parse(paymentPlan.benefitPlan || '{}');
  paymentPlan.benefitPlan = objectBenefitPlan;
  return `
        ${
          !!paymentPlan.id
            ? `${isReplaceMutation ? "uuid" : "id"}: "${decodeId(
                paymentPlan.id
              )}"`
            : ""
        }
        ${
          !!paymentPlan.code
            ? `code: "${formatGQLString(paymentPlan.code)}"`
            : ""
        }
        ${
          !!paymentPlan.name
            ? `name: "${formatGQLString(paymentPlan.name)}"`
            : ""
        }
        ${
          !!paymentPlan.calculation
            ? `calculation: "${paymentPlan.calculation}"`
            : ""
        }
        ${formatJsonExtForGQL(paymentPlan.jsonExt)}
        ${
          !!paymentPlan.benefitPlanTypeName
            ? `benefitPlanType_Model: "${formatGQLString(paymentPlan.benefitPlanTypeName.replace(/\s+/g, ''))}"`
            : ""
        }
        ${
          !!paymentPlan.benefitPlan
              ? (isBase64Encoded(paymentPlan.benefitPlan.id) 
                ? `benefitPlanId: "${decodeId(paymentPlan.benefitPlan.id)}"` 
                : `benefitPlanId: "${paymentPlan.benefitPlan.id}"`) 
              : ""
        }
        ${
          !!paymentPlan.periodicity
            ? `periodicity: ${paymentPlan.periodicity}`
            : ""
        }
        ${
          !!paymentPlan.dateValidFrom
            ? `dateValidFrom: "${dateTimeToDate(paymentPlan.dateValidFrom)}"`
            : ""
        }
        ${
          !!paymentPlan.dateValidTo
            ? `dateValidTo: "${dateTimeToDate(paymentPlan.dateValidTo)}"`
            : ""
        }
    `;
}

export function createContributionPlan(contributionPlan, clientMutationLabel) {
  let mutation = formatMutation(
    "createContributionPlan",
    formatContributionPlanGQL(contributionPlan),
    clientMutationLabel
  );
  var requestedDateTime = new Date();
  return graphql(
    mutation.payload,
    [
      "CONTRIBUTIONPLAN_MUTATION_REQ",
      "CONTRIBUTIONPLAN_CREATE_CONTRIBUTIONPLAN_RESP",
      "CONTRIBUTIONPLAN_MUTATION_ERR",
    ],
    {
      clientMutationId: mutation.clientMutationId,
      clientMutationLabel,
      requestedDateTime,
    }
  );
}

export function updateContributionPlan(contributionPlan, clientMutationLabel) {
  let mutation = formatMutation(
    "updateContributionPlan",
    formatContributionPlanGQL(contributionPlan),
    clientMutationLabel
  );
  var requestedDateTime = new Date();
  return graphql(
    mutation.payload,
    [
      "CONTRIBUTIONPLAN_MUTATION_REQ",
      "CONTRIBUTIONPLAN_UPDATE_CONTRIBUTIONPLAN_RESP",
      "CONTRIBUTIONPLAN_MUTATION_ERR",
    ],
    {
      clientMutationId: mutation.clientMutationId,
      clientMutationLabel,
      requestedDateTime,
    }
  );
}

export function deleteContributionPlan(
  contributionPlan,
  clientMutationLabel,
  clientMutationDetails = null
) {
  let contributionPlanUuids = `uuids: ["${decodeId(contributionPlan.id)}"]`;
  let mutation = formatMutation(
    "deleteContributionPlan",
    contributionPlanUuids,
    clientMutationLabel,
    clientMutationDetails
  );
  var requestedDateTime = new Date();
  return graphql(
    mutation.payload,
    [
      "CONTRIBUTIONPLAN_MUTATION_REQ",
      "CONTRIBUTIONPLAN_DELETE_CONTRIBUTIONPLAN_RESP",
      "CONTRIBUTIONPLAN_MUTATION_ERR",
    ],
    {
      clientMutationId: mutation.clientMutationId,
      clientMutationLabel,
      requestedDateTime,
    }
  );
}

export function createContributionPlanBundle(
  contributionPlanBundle,
  clientMutationLabel
) {
  let mutation = formatMutation(
    "createContributionPlanBundle",
    formatContributionPlanBundleGQL(contributionPlanBundle),
    clientMutationLabel
  );
  var requestedDateTime = new Date();
  return graphql(
    mutation.payload,
    [
      "CONTRIBUTIONPLAN_MUTATION_REQ",
      "CONTRIBUTIONPLAN_CREATE_CONTRIBUTIONPLANBUNDLE_RESP",
      "CONTRIBUTIONPLAN_MUTATION_ERR",
    ],
    {
      clientMutationId: mutation.clientMutationId,
      clientMutationLabel,
      requestedDateTime,
    }
  );
}

export function updateContributionPlanBundle(
  contributionPlanBundle,
  clientMutationLabel
) {
  let mutation = formatMutation(
    "updateContributionPlanBundle",
    formatContributionPlanBundleGQL(contributionPlanBundle, true),
    clientMutationLabel
  );
  var requestedDateTime = new Date();
  return graphql(
    mutation.payload,
    [
      "CONTRIBUTIONPLAN_MUTATION_REQ",
      "CONTRIBUTIONPLAN_UPDATE_CONTRIBUTIONPLANBUNDLE_RESP",
      "CONTRIBUTIONPLAN_MUTATION_ERR",
    ],
    {
      clientMutationId: mutation.clientMutationId,
      clientMutationLabel,
      requestedDateTime,
    }
  );
}

export function deleteContributionPlanBundle(
  contributionPlanBundle,
  clientMutationLabel,
  clientMutationDetails = null
) {
  let contributionPlanBundleUuids = `uuids: ["${decodeId(
    contributionPlanBundle.id
  )}"]`;
  let mutation = formatMutation(
    "deleteContributionPlanBundle",
    contributionPlanBundleUuids,
    clientMutationLabel,
    clientMutationDetails
  );
  var requestedDateTime = new Date();
  return graphql(
    mutation.payload,
    [
      "CONTRIBUTIONPLAN_MUTATION_REQ",
      "CONTRIBUTIONPLAN_DELETE_CONTRIBUTIONPLANBUNDLE_RESP",
      "CONTRIBUTIONPLAN_MUTATION_ERR",
    ],
    {
      clientMutationId: mutation.clientMutationId,
      clientMutationLabel,
      requestedDateTime,
    }
  );
}

export function replaceContributionPlanBundle(
  contributionPlanBundle,
  clientMutationLabel
) {
  let mutation = formatMutation(
    "replaceContributionPlanBundle",
    formatContributionPlanBundleGQL(contributionPlanBundle, true, true),
    clientMutationLabel
  );
  var requestedDateTime = new Date();
  return graphql(
    mutation.payload,
    [
      "CONTRIBUTIONPLAN_MUTATION_REQ",
      "CONTRIBUTIONPLAN_REPLACE_CONTRIBUTIONPLANBUNDLE_RESP",
      "CONTRIBUTIONPLAN_MUTATION_ERR",
    ],
    {
      clientMutationId: mutation.clientMutationId,
      clientMutationLabel,
      requestedDateTime,
    }
  );
}

export function createContributionPlanBundleContributionPlan(
  contributionPlanBundleContributionPlan,
  clientMutationLabel
) {
  let mutation = formatMutation(
    "createContributionPlanBundleDetails",
    formatContributionPlanBundleDetailsGQL(
      contributionPlanBundleContributionPlan
    ),
    clientMutationLabel
  );
  var requestedDateTime = new Date();
  return graphql(
    mutation.payload,
    [
      "CONTRIBUTIONPLAN_MUTATION_REQ",
      "CONTRIBUTIONPLAN_CREATE_CONTRIBUTIONPLANBUNDLEDETAILS_RESP",
      "CONTRIBUTIONPLAN_MUTATION_ERR",
    ],
    {
      clientMutationId: mutation.clientMutationId,
      clientMutationLabel,
      requestedDateTime,
    }
  );
}

export function updateContributionPlanBundleContributionPlan(
  contributionPlanBundleContributionPlan,
  clientMutationLabel
) {
  let mutation = formatMutation(
    "updateContributionPlanBundleDetails",
    formatContributionPlanBundleDetailsGQL(
      contributionPlanBundleContributionPlan
    ),
    clientMutationLabel
  );
  var requestedDateTime = new Date();
  return graphql(
    mutation.payload,
    [
      "CONTRIBUTIONPLAN_MUTATION_REQ",
      "CONTRIBUTIONPLAN_UPDATE_CONTRIBUTIONPLANBUNDLEDETAILS_RESP",
      "CONTRIBUTIONPLAN_MUTATION_ERR",
    ],
    {
      clientMutationId: mutation.clientMutationId,
      clientMutationLabel,
      requestedDateTime,
    }
  );
}

export function deleteContributionPlanBundleContributionPlan(
  contributionPlanBundleContributionPlan,
  clientMutationLabel,
  clientMutationDetails = null
) {
  let contributionPlanBundleContributionPlanUuids = `uuids: ["${decodeId(
    contributionPlanBundleContributionPlan.id
  )}"]`;
  let mutation = formatMutation(
    "deleteContributionPlanBundleDetails",
    contributionPlanBundleContributionPlanUuids,
    clientMutationLabel,
    clientMutationDetails
  );
  var requestedDateTime = new Date();
  return graphql(
    mutation.payload,
    [
      "CONTRIBUTIONPLAN_MUTATION_REQ",
      "CONTRIBUTIONPLAN_DELETE_CONTRIBUTIONPLANBUNDLEDETAILS_RESP",
      "CONTRIBUTIONPLAN_MUTATION_ERR",
    ],
    {
      clientMutationId: mutation.clientMutationId,
      clientMutationLabel,
      requestedDateTime,
    }
  );
}

export function replaceContributionPlanBundleContributionPlan(
  contributionPlanBundleContributionPlan,
  clientMutationLabel
) {
  let mutation = formatMutation(
    "replaceContributionPlanBundleDetails",
    formatContributionPlanBundleDetailsGQL(
      contributionPlanBundleContributionPlan,
      true
    ),
    clientMutationLabel
  );
  var requestedDateTime = new Date();
  return graphql(
    mutation.payload,
    [
      "CONTRIBUTIONPLAN_MUTATION_REQ",
      "CONTRIBUTIONPLAN_REPLACE_CONTRIBUTIONPLANBUNDLEDETAILS_RESP",
      "CONTRIBUTIONPLAN_MUTATION_ERR",
    ],
    {
      clientMutationId: mutation.clientMutationId,
      clientMutationLabel,
      requestedDateTime,
    }
  );
}

export function createPaymentPlan(paymentPlan, clientMutationLabel) {
  let mutation = formatMutation(
    "createPaymentPlan",
    formatPaymentPlanGQL(paymentPlan),
    clientMutationLabel
  );
  var requestedDateTime = new Date();
  return graphql(
    mutation.payload,
    [
      "CONTRIBUTIONPLAN_MUTATION_REQ",
      "CONTRIBUTIONPLAN_CREATE_PAYMENTPLAN_RESP",
      "CONTRIBUTIONPLAN_MUTATION_ERR",
    ],
    {
      clientMutationId: mutation.clientMutationId,
      clientMutationLabel,
      requestedDateTime,
    }
  );
}

export function updatePaymentPlan(paymentPlan, clientMutationLabel) {
  let mutation = formatMutation(
    "updatePaymentPlan",
    formatPaymentPlanGQL(paymentPlan),
    clientMutationLabel
  );
  var requestedDateTime = new Date();
  return graphql(
    mutation.payload,
    [
      "CONTRIBUTIONPLAN_MUTATION_REQ",
      "CONTRIBUTIONPLAN_UPDATE_PAYMENTPLAN_RESP",
      "CONTRIBUTIONPLAN_MUTATION_ERR",
    ],
    {
      clientMutationId: mutation.clientMutationId,
      clientMutationLabel,
      requestedDateTime,
    }
  );
}

export function replacePaymentPlan(paymentPlan, clientMutationLabel) {
  let mutation = formatMutation(
    "replacePaymentPlan",
    formatPaymentPlanGQL(paymentPlan, true),
    clientMutationLabel
  );
  var requestedDateTime = new Date();
  return graphql(
    mutation.payload,
    [
      "CONTRIBUTIONPLAN_MUTATION_REQ",
      "CONTRIBUTIONPLAN_REPLACE_PAYMENTPLAN_RESP",
      "CONTRIBUTIONPLAN_MUTATION_ERR",
    ],
    {
      clientMutationId: mutation.clientMutationId,
      clientMutationLabel,
      requestedDateTime,
    }
  );
}

export function deletePaymentPlan(
  paymentPlan,
  clientMutationLabel,
  clientMutationDetails = null
) {
  let paymentPlanUuids = `uuids: ["${decodeId(paymentPlan.id)}"]`;
  let mutation = formatMutation(
    "deletePaymentPlan",
    paymentPlanUuids,
    clientMutationLabel,
    clientMutationDetails
  );
  var requestedDateTime = new Date();
  return graphql(
    mutation.payload,
    [
      "CONTRIBUTIONPLAN_MUTATION_REQ",
      "CONTRIBUTIONPLAN_DELETE_PAYMENTPLAN_RESP",
      "CONTRIBUTIONPLAN_MUTATION_ERR",
    ],
    {
      clientMutationId: mutation.clientMutationId,
      clientMutationLabel,
      requestedDateTime,
    }
  );
}

export function clearPaymentPlan() {
  return (dispatch) => {
    dispatch({ type: "CONTRIBUTIONPLAN_PAYMENTPLAN_CLEAR" });
  };
}

export const contributionPlanCodeValidation = (mm, variables) => {
  return graphqlWithVariables(
    `
    query ($contributionPlanCode: String!) {
        validateContributionPlanCode(contributionPlanCode: $contributionPlanCode) 
    }
    `,
    variables,
    "CONTRIBUTIONPLAN_CODE_FIELDS_VALIDATION"
  );
};

export const contributionPlanCodeSetValid = () => {
  return (dispatch) => {
    dispatch({ type: "CONTRIBUTIONPLAN_CODE_FIELDS_VALIDATION_SET_VALID" });
  };
};

export const contributionPlanCodeClear = () => {
  return (dispatch) => {
    dispatch({ type: "CONTRIBUTIONPLAN_CODE_FIELDS_VALIDATION_CLEAR" });
  };
};


export const paymentPlanCodeValidation = (mm, variables) => {
  return graphqlWithVariables(
    `
    query ($paymentPlanCode: String!) {
        validatePaymentPlanCode(paymentPlanCode: $paymentPlanCode) 
    }
    `,
    variables,
    "PAYMENTPLAN_CODE_FIELDS_VALIDATION"
  );
};

export const paymentPlanCodeSetValid = () => {
  return (dispatch) => {
    dispatch({ type: "PAYMENTPLAN_CODE_FIELDS_VALIDATION_SET_VALID" });
  };
};

export const paymentPlanCodeClear = () => {
  return (dispatch) => {
    dispatch({ type: "PAYMENTPLAN_CODE_FIELDS_VALIDATION_CLEAR" });
  };
};

export const contributionPlanBundleCodeValidation = (mm, variables) => {
  return graphqlWithVariables(
    `
    query ($contributionPlanBundleCode: String!) {
      validateContributionPlanBundleCode(contributionPlanBundleCode: $contributionPlanBundleCode) 
  }
    `,
    variables,
    "CONTRIBUTIONPLAN_BUNDLE_CODE_FIELDS_VALIDATION"
  );
};

export const contributionPlanBundleCodeSetValid = () => {
  return (dispatch) => {
    dispatch({ type: "CONTRIBUTIONPLAN_BUNDLE_CODE_FIELDS_VALIDATION_SET_VALID" });
  };
};

export const contributionPlanBundleCodeClear = () => {
  return (dispatch) => {
    dispatch({ type: "CONTRIBUTIONPLAN_BUNDLE_CODE_FIELDS_VALIDATION_CLEAR" });
  };
};

export function fetchPaymentPlanFilterSuggestions(search, field = "code") {
  const lookupKey = field === "name" ? "name_Icontains" : "code_Icontains";
  const payload = formatPageQuery(
    "paymentPlan",
    [
      "first: 15",
      "isDeleted: false",
      `${lookupKey}: "${formatGQLString(search)}"`,
    ],
    ["id", "code", "name"],
  );
  return (dispatch) => graphql(payload, "PAYMENTPLAN_FILTER_SUGGESTIONS")(
    dispatch,
  ).then((action) => {
    if (action?.error || action?.payload?.errors) return [];
    const edges = action?.payload?.data?.paymentPlan?.edges ?? [];
    return edges.map(({ node }) => ({
      label: field === "name" ? node.name : node.code,
      value: field === "name" ? node.name : node.code,
    }));
  });
}

