import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  Box,
  Collapse,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import { makeStyles } from '@material-ui/styles';
import { useModulesManager, useTranslations } from '@openimis/fe-core';
import { fetchPaymentPlanPeriodicityForTaskThunk } from '../../services/paymentPlanTaskRecapService';
import {
  asArray,
  formatTaskPeriodicityDisplay,
  hasDisplayValue,
  parseTaskPaymentPlanBusinessData,
  resolvePaymentPlanUuidFromTask,
} from '../../utils/parseTaskPaymentPlanBusinessData';

const useStyles = makeStyles(() => ({
  section: {
    marginTop: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontWeight: 600,
    marginBottom: 8,
  },
  row: {
    display: 'flex',
    padding: '6px 0',
    borderBottom: '1px solid #eee',
  },
  rowLabel: {
    flex: '0 0 40%',
    color: '#666',
    paddingRight: 12,
  },
  rowValue: {
    flex: 1,
    fontWeight: 500,
    wordBreak: 'break-word',
  },
  textRecap: {
    whiteSpace: 'pre-wrap',
    margin: 0,
    fontFamily: 'inherit',
    fontSize: '0.875rem',
  },
  tableScrollContainer: {
    maxHeight: 280,
    overflowY: 'auto',
  },
  expandHeader: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    userSelect: 'none',
  },
}));

const PLAN_FIELDS = [
  'code',
  'nom',
  'regime_prestations',
  'regle_calcul',
  'periodicite',
  'date_debut',
  'date_fin',
  'parametres_calcul',
];

const BENEFICIARY_FIELDS = [
  'nombre_beneficiaires_regime',
  'nombre_beneficiaires_selectionnes',
  'criteres_filtrage_beneficiaires',
];

const LOCATION_FIELDS = [
  'prefectures_concernees',
  'districts_concernes',
  'regions_concernees',
];

function operationSeverity(typeOperation) {
  const op = (typeOperation || '').toLowerCase();
  if (op.includes('suppression')) return 'error';
  if (op.includes('mise à jour') || op.includes('mise a jour')) return 'warning';
  return 'info';
}

function displayFieldValue(key, value) {
  if (key === 'periodicite') {
    return formatTaskPeriodicityDisplay(value);
  }
  return value;
}

function FieldRows({
  fields,
  incoming,
  formatMessage,
  alwaysShowKeys = [],
  loadingKeys = [],
  fieldHints = {},
}) {
  const classes = useStyles();
  const rows = fields
    .map((key) => ({
      key,
      value: displayFieldValue(key, incoming[key]),
      forceShow: alwaysShowKeys.includes(key),
    }))
    .filter(({ value, forceShow }) => forceShow || hasDisplayValue(value));

  if (!rows.length) return null;

  return (
    <Box className={classes.section}>
      {rows.map(({ key, value, forceShow }) => (
        <div key={key} className={classes.row}>
          <Typography className={classes.rowLabel} variant="body2">
            {formatMessage(`tasks.field.${key}`)}
          </Typography>
          <Typography className={classes.rowValue} variant="body2">
            {hasDisplayValue(value)
              ? value
              : (forceShow && loadingKeys.includes(key)
                ? formatMessage('tasks.field.periodicite.loading')
                : (forceShow ? formatMessage('tasks.field.periodicite.notProvided') : '—'))}
          </Typography>
          {fieldHints[key] && hasDisplayValue(value) && (
            <Typography variant="caption" color="textSecondary" display="block">
              {fieldHints[key]}
            </Typography>
          )}
        </div>
      ))}
    </Box>
  );
}

function ModificationsTable({ modifications, formatMessage }) {
  const classes = useStyles();
  const rows = asArray(modifications);

  if (!rows.length) return null;

  return (
    <Box className={classes.section}>
      <Typography className={classes.sectionTitle}>
        {formatMessage('tasks.section.modifications')}
      </Typography>
      <TableContainer component={Paper} elevation={1} className={classes.tableScrollContainer}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>{formatMessage('tasks.modifications.field')}</TableCell>
              <TableCell>{formatMessage('tasks.modifications.current')}</TableCell>
              <TableCell>{formatMessage('tasks.modifications.proposed')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={`${row.champ}-${index}`}>
                <TableCell>{row.champ ?? '—'}</TableCell>
                <TableCell>{row.valeur_actuelle ?? '—'}</TableCell>
                <TableCell>{row.valeur_proposee ?? '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

function PaymentPlanTaskRecap({ incomingData, task }) {
  const classes = useStyles();
  const modulesManager = useModulesManager();
  const dispatch = useDispatch();
  const { formatMessage } = useTranslations('paymentPlan', modulesManager);
  const [recapExpanded, setRecapExpanded] = useState(false);
  const [periodicityFromPlan, setPeriodicityFromPlan] = useState(null);
  const [loadingPeriodicity, setLoadingPeriodicity] = useState(false);

  const parsed = useMemo(
    () => parseTaskPaymentPlanBusinessData(incomingData),
    [incomingData],
  );

  const incoming = useMemo(() => {
    if (!hasDisplayValue(parsed.incoming.periodicite) && hasDisplayValue(periodicityFromPlan)) {
      return { ...parsed.incoming, periodicite: periodicityFromPlan };
    }
    return parsed.incoming;
  }, [parsed.incoming, periodicityFromPlan]);

  useEffect(() => {
    if (hasDisplayValue(parsed.incoming.periodicite)) {
      setPeriodicityFromPlan(null);
      return undefined;
    }

    const planUuid = resolvePaymentPlanUuidFromTask(task, parsed.incoming);
    if (!planUuid) return undefined;

    let cancelled = false;
    setLoadingPeriodicity(true);
    dispatch(fetchPaymentPlanPeriodicityForTaskThunk(modulesManager, planUuid)).then((value) => {
      if (cancelled) return;
      setLoadingPeriodicity(false);
      if (hasDisplayValue(value)) {
        setPeriodicityFromPlan(value);
      }
    }).catch(() => {
      if (!cancelled) setLoadingPeriodicity(false);
    });

    return () => {
      cancelled = true;
      setLoadingPeriodicity(false);
    };
  }, [dispatch, modulesManager, task, parsed.incoming]);

  const typeOperation = incoming.type_operation;
  const modifications = incoming.modifications ?? [];
  const textRecap = incoming.recapitulatif_plan_paiement;

  return (
    <Box>
      {hasDisplayValue(typeOperation) && (
        <Alert severity={operationSeverity(typeOperation)} style={{ marginBottom: 16 }}>
          {typeOperation}
        </Alert>
      )}

      <Typography className={classes.sectionTitle}>
        {formatMessage('tasks.section.plan')}
      </Typography>
      <FieldRows
        fields={PLAN_FIELDS}
        incoming={incoming}
        formatMessage={formatMessage}
        alwaysShowKeys={['periodicite']}
        loadingKeys={loadingPeriodicity ? ['periodicite'] : []}
        fieldHints={
          periodicityFromPlan && !hasDisplayValue(parsed.incoming.periodicite)
            ? { periodicite: formatMessage('tasks.field.periodicite.fromPlan') }
            : {}
        }
      />

      <Typography className={classes.sectionTitle}>
        {formatMessage('tasks.section.beneficiaries')}
      </Typography>
      <FieldRows fields={BENEFICIARY_FIELDS} incoming={incoming} formatMessage={formatMessage} />

      <Typography className={classes.sectionTitle}>
        {formatMessage('tasks.section.locations')}
      </Typography>
      <FieldRows fields={LOCATION_FIELDS} incoming={incoming} formatMessage={formatMessage} />

      <ModificationsTable modifications={modifications} formatMessage={formatMessage} />

      {hasDisplayValue(textRecap) && (
        <Box className={classes.section}>
          <div
            className={classes.expandHeader}
            onClick={() => setRecapExpanded((prev) => !prev)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                setRecapExpanded((prev) => !prev);
              }
            }}
          >
            <Typography className={classes.sectionTitle}>
              {formatMessage('tasks.section.textRecap')}
            </Typography>
            <IconButton size="small" aria-label="toggle recap">
              {recapExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </div>
          <Collapse in={recapExpanded}>
            <Paper elevation={1} style={{ padding: 12 }}>
              <pre className={classes.textRecap}>{textRecap}</pre>
            </Paper>
          </Collapse>
        </Box>
      )}
    </Box>
  );
}

export default PaymentPlanTaskRecap;
