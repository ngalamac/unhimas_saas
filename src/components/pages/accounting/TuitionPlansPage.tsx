import React from 'react';
import IntegratedTuitionManagement from '../tuition/IntegratedTuitionManagement';

/**
 * Backwards compatibility wrapper.
 * The legacy "Tuition Plans" page has been replaced by the unified Tuition Structure / Management UI.
 * This thin component simply delegates to the new integrated tuition management experience
 * so existing navigation keys (e.g. 'tuition-plans') keep working without 404 build errors.
 */
const TuitionPlansPage: React.FC = () => {
  return <IntegratedTuitionManagement />;
};

export default TuitionPlansPage;
