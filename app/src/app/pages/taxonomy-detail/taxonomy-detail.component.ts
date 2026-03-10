import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { switchMap } from 'rxjs';
import { DataService } from '../../core/services/data.service';
import { SeoService } from '../../core/services/seo.service';
import { PalmTrait } from '../../core/models/palm-trait.model';
import { PalmCardComponent } from '../../shared/components/palm-card/palm-card.component';
import { SlugifyPipe } from '../../shared/pipes/slugify.pipe';
import { PaginatorComponent } from '../../shared/components/paginator/paginator.component';

@Component({
  selector: 'app-taxonomy-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, PalmCardComponent, SlugifyPipe, PaginatorComponent],
  templateUrl: './taxonomy-detail.component.html',
  styleUrls: ['./taxonomy-detail.component.scss'],
})
export class TaxonomyDetailComponent implements OnInit {
  rank = ''; // 'subfamily' or 'tribe'
  slug = '';
  name = '';
  species: PalmTrait[] = [];
  displayedSpecies: PalmTrait[] = [];
  currentPage = 0;
  pageSize = 20;
  loading = true;
  notFound = false;

  // Stats
  avgHeight: number | null = null;
  genera: { name: string; slug: string; count: number }[] = [];
  tribes: { name: string; slug: string; count: number }[] = [];
  parentSubfamily = '';

  constructor(
    private route: ActivatedRoute,
    private dataService: DataService,
    private seoService: SeoService
  ) {}

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        switchMap(params => {
          this.slug = params.get('slug') || '';
          this.loading = true;
          this.notFound = false;

          // Detect rank from URL
          const url = this.route.snapshot.url.map(s => s.path);
          this.rank = url.includes('subfamily') ? 'subfamily' : 'tribe';

          if (this.rank === 'subfamily') {
            return this.dataService.getPalmsBySubfamily(this.slug);
          } else {
            return this.dataService.getPalmsByTribe(this.slug);
          }
        })
      )
      .subscribe(species => {
        this.loading = false;
        if (!species || species.length === 0) {
          this.notFound = true;
          return;
        }
        this.species = species;
        this.currentPage = 0;
        this.updateDisplayedSpecies();
        this.name = this.rank === 'subfamily'
          ? species[0].PalmSubfamily || ''
          : species[0].PalmTribe || species[0].tribe || '';
        this.parentSubfamily = species[0].PalmSubfamily || '';
        this.computeStats();
        this.updateSeo();
      });
  }

  private computeStats(): void {
    const heights = this.species
      .map(p => p.MaxStemHeight_m || p.height_max_m)
      .filter((h): h is number => h != null && h > 0);
    this.avgHeight = heights.length > 0
      ? Math.round((heights.reduce((a, b) => a + b, 0) / heights.length) * 10) / 10
      : null;

    const genusMap = new Map<string, number>();
    this.species.forEach(p => {
      const genus = p.accGenus || p.genus || 'Unknown';
      genusMap.set(genus, (genusMap.get(genus) || 0) + 1);
    });
    this.genera = Array.from(genusMap.entries())
      .map(([name, count]) => ({ name, slug: this.dataService.toSlug(name), count }))
      .sort((a, b) => b.count - a.count);

    if (this.rank === 'subfamily') {
      const tribeMap = new Map<string, number>();
      this.species.forEach(p => {
        const tribe = p.PalmTribe || p.tribe;
        if (tribe && tribe !== 'Unknown') {
          tribeMap.set(tribe, (tribeMap.get(tribe) || 0) + 1);
        }
      });
      this.tribes = Array.from(tribeMap.entries())
        .map(([name, count]) => ({ name, slug: this.dataService.toSlug(name), count }))
        .sort((a, b) => b.count - a.count);
    }
  }

  updateDisplayedSpecies(): void {
    const start = this.currentPage * this.pageSize;
    this.displayedSpecies = this.species.slice(start, start + this.pageSize);
  }

  onPageChange(event: any): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updateDisplayedSpecies();
  }

  private updateSeo(): void {
    const rankLabel = this.rank === 'subfamily' ? 'Subfamily' : 'Tribe';
    this.seoService.update({
      title: `${this.name} - Palm ${rankLabel} (${this.species.length} species)`,
      description: `Explore all ${this.species.length} palm species in the ${rankLabel.toLowerCase()} ${this.name}. ${this.genera.length} genera, taxonomy, morphological traits, and distribution data.`,
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'Taxon',
        name: this.name,
        taxonRank: this.rank,
        url: `https://palma-encyclopedia.com/palms/taxonomy/${this.rank}/${this.slug}`,
        parentTaxon: this.rank === 'tribe' && this.parentSubfamily ? {
          '@type': 'Taxon',
          name: this.parentSubfamily,
          taxonRank: 'subfamily',
        } : {
          '@type': 'Taxon',
          name: 'Arecaceae',
          taxonRank: 'family',
        },
      },
    });
  }
}
