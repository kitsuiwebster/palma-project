import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { switchMap } from 'rxjs';
import { DataService } from '../../core/services/data.service';
import { SeoService } from '../../core/services/seo.service';
import { RegionCodesService } from '../../core/services/region-codes.service';
import { PalmTrait } from '../../core/models/palm-trait.model';
import { PalmCardComponent } from '../../shared/components/palm-card/palm-card.component';
import { SlugifyPipe } from '../../shared/pipes/slugify.pipe';
import { PaginatorComponent } from '../../shared/components/paginator/paginator.component';

@Component({
  selector: 'app-region-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, PalmCardComponent, SlugifyPipe, PaginatorComponent],
  templateUrl: './region-detail.component.html',
  styleUrls: ['./region-detail.component.scss'],
})
export class RegionDetailComponent implements OnInit {
  regionCode = '';
  regionName = '';
  regionFlag = '';
  species: PalmTrait[] = [];
  displayedSpecies: PalmTrait[] = [];
  currentPage = 0;
  pageSize = 20;
  loading = true;
  notFound = false;

  // Computed stats
  genera: { name: string; count: number }[] = [];
  avgHeight: number | null = null;
  climbers = 0;
  erect = 0;
  acaulescent = 0;
  subfamilies: string[] = [];

  constructor(
    private route: ActivatedRoute,
    private dataService: DataService,
    private seoService: SeoService,
    private regionCodesService: RegionCodesService
  ) {}

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          this.regionCode = (params.get('region') || '').toUpperCase();
          this.loading = true;
          this.notFound = false;
          return this.dataService.getPalmsByRegionCode(this.regionCode);
        })
      )
      .subscribe(async (species) => {
        this.loading = false;

        if (species.length === 0) {
          this.notFound = true;
          return;
        }

        this.species = species;
        this.currentPage = 0;
        this.updateDisplayedSpecies();

        // Load region name and flag
        this.regionName = await this.regionCodesService.getRegionName(this.regionCode);
        this.regionFlag = await this.regionCodesService.getFlagUrl(this.regionCode);

        this.computeStats();
        this.updateSeo();
      });
  }

  private computeStats(): void {
    // Average height
    const heights = this.species
      .map((p) => p.MaxStemHeight_m || p.height_max_m)
      .filter((h): h is number => h != null && h > 0);
    this.avgHeight =
      heights.length > 0
        ? Math.round((heights.reduce((a, b) => a + b, 0) / heights.length) * 10) / 10
        : null;

    // Genera breakdown
    const genusMap = new Map<string, number>();
    this.species.forEach((p) => {
      const genus = p.accGenus || p.genus || 'Unknown';
      genusMap.set(genus, (genusMap.get(genus) || 0) + 1);
    });
    this.genera = Array.from(genusMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Subfamilies
    this.subfamilies = [
      ...new Set(
        this.species
          .map((p) => p.PalmSubfamily)
          .filter((s): s is string => !!s)
      ),
    ];

    // Stem types
    this.climbers = this.species.filter((p) => p.Climbing === 1).length;
    this.erect = this.species.filter((p) => p.Erect === 1).length;
    this.acaulescent = this.species.filter((p) => p.Acaulescent === 1).length;
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
    const count = this.species.length;
    const topGenera = this.genera.slice(0, 3).map((g) => g.name).join(', ');
    const description = `Discover ${count} palm species native to ${this.regionName}. ${
      topGenera ? `Major genera include ${topGenera}.` : ''
    } Browse taxonomy, traits, and distribution data.`;

    this.seoService.update({
      title: `Palm Species in ${this.regionName} (${count} species)`,
      description,
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: `Palm Species Native to ${this.regionName}`,
        description,
        url: `https://palma-encyclopedia.com/palms/region/${this.regionCode.toLowerCase()}`,
        numberOfItems: count,
      },
    });
  }
}
