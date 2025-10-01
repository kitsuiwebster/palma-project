import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then(c => c.HomeComponent)
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
    path: 'data',
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/palm-data/palm-data.component').then(c => c.PalmDataComponent)
      },
      {
        path: 'overview',
        loadComponent: () => import('./pages/palm-data/palm-data.component').then(c => c.PalmDataComponent)
      },
      {
        path: 'dataset',
        loadComponent: () => import('./pages/palm-data/palm-data.component').then(c => c.PalmDataComponent)
      },
      {
        path: 'methodology',
        loadComponent: () => import('./pages/palm-data/palm-data.component').then(c => c.PalmDataComponent)
      },
      {
        path: 'references',
        loadComponent: () => import('./pages/palm-data/palm-data.component').then(c => c.PalmDataComponent)
      },
      {
        path: 'photo-credits',
        loadComponent: () => import('./pages/palm-data/palm-data.component').then(c => c.PalmDataComponent)
      }
    ]
  },
  {
    path: 'about',
    loadComponent: () => import('./pages/about/about.component').then(c => c.AboutComponent)
  },
  {
    path: 'privacy',
    loadComponent: () => import('./pages/privacy/privacy.component').then(c => c.PrivacyComponent)
  },
  {
    path: 'photos-credits',
    redirectTo: 'data/photo-credits'
  },
  {
    path: 'references',
    redirectTo: 'data/references'
  },
  {
    path: '**',
    redirectTo: 'palms'
  }
];