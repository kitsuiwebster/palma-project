import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'palms',
    pathMatch: 'full'
  },
  {
    path: 'palms',
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/palm-list/palm-list.component').then(c => c.PalmListComponent)
      },
      {
        path: 'search',
        loadComponent: () => import('./pages/palm-search/palm-search.component').then(c => c.PalmSearchComponent)
      },
      {
        path: ':species',
        loadComponent: () => import('./pages/palm-detail/palm-detail.component').then(c => c.PalmDetailComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'palms'
  }
];