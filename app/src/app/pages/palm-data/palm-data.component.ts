import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { SeoService } from '../../core/services/seo.service';

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
  
  private seoMeta: Record<string, { title: string; description: string; jsonLd?: Record<string, unknown> }> = {
    overview: {
      title: 'Data Overview',
      description: 'Overview of the Palm Encyclopedia dataset with interactive maps and statistics on palm species distribution worldwide.',
    },
    dataset: {
      title: 'Palm Species Dataset',
      description: 'Download and explore the comprehensive dataset of 2,557 palm species with 35 morphological and geographic attributes.',
    },
    methodology: {
      title: 'Methodology',
      description: 'Learn about the methodology behind the Palm Encyclopedia dataset, including data collection, sources, and classification standards.',
    },
    references: {
      title: 'References',
      description: 'Scientific references and sources used to compile the Palm Encyclopedia dataset of over 2,500 palm species.',
    },
    photos: {
      title: 'Photo Credits',
      description: 'Photo credits and attributions for images used throughout the Palm Encyclopedia.',
    },
  };

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private seoService: SeoService
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
      
      // Update SEO meta for current tab
      const meta = this.seoMeta[this.activeTab];
      if (meta) {
        this.seoService.update({
          title: meta.title,
          description: meta.description,
          jsonLd: this.activeTab === 'dataset' ? this.seoService.getDatasetSchema() : undefined,
        });
      }

      // Scroll to top when route changes
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
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
    
    // Scroll to top after tab switch
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 150);
  }
}