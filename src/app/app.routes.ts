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
    path: 'palmtrait',
    loadComponent: () => import('./pages/palmtrait/palmtrait.component').then(c => c.PalmtraitComponent)
  },
  {
    path: 'apis',
    loadComponent: () => import('./pages/apis/apis.component').then(c => c.ApisComponent)
  },
  {
    path: 'photos-credits',
    loadComponent: () => import('./pages/photos-credits/photos-credits.component').then(c => c.PhotosCreditsComponent)
  },
  {
    path: '**',
    redirectTo: 'palms'
  }
];