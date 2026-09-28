import { Routes } from '@angular/router';
import { BatchList } from '@pages/batch/batch-list/batch-list';
import { BatchForm } from '@pages/batch/batch-form/batch-form';
import { BatchOverview } from '@pages/batch/batch-overview/batch-overview';

export const BatchRoutes: Routes = [
  {
    path: '',
    component: BatchList
  },
  {
    // Must stay above ':id' or "new" would be read as a batch id.
    path: 'new',
    component: BatchForm
  },
  {
    path: ':id',
    component: BatchOverview
  }
];
