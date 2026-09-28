import { Routes } from '@angular/router';

/*
 * The template's portfolio routes (home / about / project / blog / uses) were
 * removed together with their page folders and the third-party integrations
 * they depended on: this app is the intern & batch admin UI, none of those
 * sections have a counterpart here, and leaving the routes in place only
 * pointed the router at folders that no longer exist.
 *
 * Batch and intern are each a lazily-loaded feature with its own *.routes.ts.
 */
export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    // Batches first: an intern can't be registered until a batch exists.
    redirectTo: 'batch'
  },
  {
    path: 'batch',
    loadChildren: () => import('@pages/batch/batch.routes').then(m => m.BatchRoutes)
  },
  {
    path: 'intern',
    loadChildren: () => import('@pages/intern/intern.routes').then(m => m.InternRoutes)
  },
  {
    path: '**', pathMatch: 'full',
    loadChildren: () => import('@pages/error/error.routes').then(m => m.ErrorRoutes)
  },
]
