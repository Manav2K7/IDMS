import { Routes } from '@angular/router';
import { InternList } from '@pages/intern/intern-list/intern-list';
import { InternForm } from '@pages/intern/intern-form/intern-form';
import { InternEdit } from '@pages/intern/intern-edit/intern-edit';

export const InternRoutes: Routes = [
  {
    path: '',
    component: InternList
  },
  {
    // Above ':id/edit' for the same reason as in batch.routes.ts.
    path: 'new',
    component: InternForm
  },
  {
    path: ':id/edit',
    component: InternEdit
  }
];
