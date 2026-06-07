import React from 'react';
import {
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Typography,
} from '@material-ui/core';
import { injectIntl } from 'react-intl';
import { formatMessage } from '@openimis/fe-core';

function PaymentPlanSaveProgressDialog({ intl, open }) {
  return (
    <Dialog open={open} maxWidth="xs" fullWidth disableEscapeKeyDown>
      <DialogTitle>
        {formatMessage(intl, 'paymentPlan', 'paymentPlan.saveProgress.title')}
      </DialogTitle>
      <DialogContent style={{ textAlign: 'center', paddingBottom: 24 }}>
        <CircularProgress style={{ marginBottom: 16 }} />
        <Typography variant="body2" color="textSecondary">
          {formatMessage(intl, 'paymentPlan', 'paymentPlan.saveProgress.message')}
        </Typography>
      </DialogContent>
    </Dialog>
  );
}

export default injectIntl(PaymentPlanSaveProgressDialog);
