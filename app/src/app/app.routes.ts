import { Routes } from '@angular/router';
import { PalmDataComponent } from './pages/palm-data/palm-data.component';

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
        path: 'genus',
        loadComponent: () => import('./pages/genus-list/genus-list.component').then(c => c.GenusListComponent)
      },
      {
        path: 'genus/:genus',
        loadComponent: () => import('./pages/genus-detail/genus-detail.component').then(c => c.GenusDetailComponent)
      },
      {
        path: 'region',
        loadComponent: () => import('./pages/region-list/region-list.component').then(c => c.RegionListComponent)
      },
      {
        path: 'region/:region',
        loadComponent: () => import('./pages/region-detail/region-detail.component').then(c => c.RegionDetailComponent)
      },
      {
        path: 'characteristics',
        loadComponent: () => import('./pages/characteristic-list/characteristic-list.component').then(c => c.CharacteristicListComponent)
      },
      {
        path: 'characteristic/:type/:value',
        loadComponent: () => import('./pages/characteristic-detail/characteristic-detail.component').then(c => c.CharacteristicDetailComponent)
      },
      {
        path: 'taxonomy',
        loadComponent: () => import('./pages/taxonomy-list/taxonomy-list.component').then(c => c.TaxonomyListComponent)
      },
      {
        path: 'taxonomy/subfamily/:slug',
        loadComponent: () => import('./pages/taxonomy-detail/taxonomy-detail.component').then(c => c.TaxonomyDetailComponent)
      },
      {
        path: 'taxonomy/tribe/:slug',
        loadComponent: () => import('./pages/taxonomy-detail/taxonomy-detail.component').then(c => c.TaxonomyDetailComponent)
      },
      {
        path: ':species',
        loadComponent: () => import('./pages/palm-detail/palm-detail.component').then(c => c.PalmDetailComponent)
      }
    ]
  },
  {
    path: 'glossary',
    loadComponent: () => import('./pages/glossary-list/glossary-list.component').then(c => c.GlossaryListComponent)
  },
  {
    path: 'glossary/:term',
    loadComponent: () => import('./pages/glossary-detail/glossary-detail.component').then(c => c.GlossaryDetailComponent)
  },
  {
    path: 'data',
    children: [
      {
        path: '',
        component: PalmDataComponent
      },
      {
        path: 'overview',
        component: PalmDataComponent
      },
      {
        path: 'dataset',
        component: PalmDataComponent
      },
      {
        path: 'methodology',
        component: PalmDataComponent
      },
      {
        path: 'references',
        component: PalmDataComponent
      },
      {
        path: 'photo-credits',
        component: PalmDataComponent
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
    path: 'quiz',
    loadComponent: () => import('./pages/palm-quiz/palm-quiz.component').then(c => c.PalmQuizComponent)
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
    loadComponent: () => import('./pages/not-found/not-found.component').then(c => c.NotFoundComponent)
  }
];
