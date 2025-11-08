import React from 'react';
import { useToast } from '@openimis/fe-core';

/**
 * HOC to inject toast functions into class components via props
 */
export function withToast(Component) {
  return function WithToastComponent(props) {
    const toast = useToast();
    return <Component {...props} toast={toast} />;
  };
}

