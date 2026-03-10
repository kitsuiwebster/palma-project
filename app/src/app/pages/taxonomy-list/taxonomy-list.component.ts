import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DataService } from '../../core/services/data.service';
import { SeoService } from '../../core/services/seo.service';

@Component({
  selector: 'app-taxonomy-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './taxonomy-list.component.html',
  styleUrls: ['./taxonomy-list.component.scss'],
})
export class TaxonomyListComponent implements OnInit {
  subfamilies: { name: string; slug: string; count: number }[] = [];
  tribes: { name: string; slug: string; subfamily: string; count: number }[] = [];
  loading = true;

  constructor(private dataService: DataService, private seoService: SeoService) {}

  ngOnInit(): void {
    this.seoService.update({
      title: 'Palm Taxonomy - Subfamilies & Tribes',
      description: 'Explore the complete taxonomy of the palm family (Arecaceae). Browse all 5 subfamilies and 29 tribes with species counts and classification details.',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'Taxon',
        name: 'Arecaceae',
        taxonRank: 'family',
        url: 'https://palma-encyclopedia.com/palms/taxonomy',
      },
    });

    let loaded = 0;
    const checkDone = () => { loaded++; if (loaded >= 2) this.loading = false; };

    this.dataService.getAllSubfamilies().subscribe(d => { this.subfamilies = d; checkDone(); });
    this.dataService.getAllTribes().subscribe(d => { this.tribes = d; checkDone(); });
  }

  getTribesBySubfamily(subfamily: string): { name: string; slug: string; subfamily: string; count: number }[] {
    return this.tribes.filter(t => t.subfamily === subfamily);
  }
}
