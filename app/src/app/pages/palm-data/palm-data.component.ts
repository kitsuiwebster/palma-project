import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

// Import all the tab components
import { OverviewComponent } from '../overview/overview.component';
import { DatasetComponent } from '../dataset/dataset.component';
import { MethodologyComponent } from '../methodology/methodology.component';
import { ReferencesComponent } from '../references/references.component';
import { PhotosCreditsComponent } from '../photos-credits/photos-credits.component';

@Component({
  selector: 'app-palm-data',
  standalone: true,
  imports: [
    CommonModule, 
    HttpClientModule, 
    OverviewComponent,
    DatasetComponent, 
    MethodologyComponent, 
    ReferencesComponent,
    PhotosCreditsComponent
  ],
  templateUrl: './palm-data.component.html',
  styleUrl: './palm-data.component.scss'
})
export class PalmDataComponent implements OnInit, OnDestroy {
  activeTab: 'overview' | 'dataset' | 'methodology' | 'references' | 'photos' = 'overview';
  private routeSubscription: Subscription = new Subscription();
  
  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Listen to route changes to update active tab
    this.routeSubscription = this.route.url.subscribe(urlSegments => {
      const lastSegment = urlSegments[urlSegments.length - 1];
      if (lastSegment) {
        const path = lastSegment.path;
        if (path === 'photo-credits') {
          this.activeTab = 'photos';
        } else if (['overview', 'dataset', 'methodology', 'references'].includes(path)) {
          this.activeTab = path as 'overview' | 'dataset' | 'methodology' | 'references';
        }
      } else {
        // Default route /data
        this.activeTab = 'overview';
      }
    });
  }

  ngOnDestroy(): void {
    this.routeSubscription.unsubscribe();
  }
  
  switchTab(tab: 'overview' | 'dataset' | 'methodology' | 'references' | 'photos'): void {
    this.activeTab = tab;
    // Navigate to the corresponding route
    const routeMap = {
      'overview': '/data/overview',
      'dataset': '/data/dataset', 
      'methodology': '/data/methodology',
      'references': '/data/references',
      'photos': '/data/photo-credits'
    };
    this.router.navigate([routeMap[tab]]);
  }
}