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
  selector: 'app-genus-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, PalmCardComponent, SlugifyPipe, PaginatorComponent],
  templateUrl: './genus-detail.component.html',
  styleUrls: ['./genus-detail.component.scss'],
})
export class GenusDetailComponent implements OnInit {
  genusName = '';
  genusSlug = '';
  species: PalmTrait[] = [];
  displayedSpecies: PalmTrait[] = [];
  currentPage = 0;
  pageSize = 20;
  loading = true;
  notFound = false;

  // Computed stats
  avgHeight: number | null = null;
  habitats: string[] = [];
  subfamilies: string[] = [];
  tribes: string[] = [];
  climbers = 0;
  erect = 0;
  acaulescent = 0;

  constructor(
    private route: ActivatedRoute,
    private dataService: DataService,
    private seoService: SeoService
  ) {}

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          this.genusSlug = params.get('genus') || '';
          this.loading = true;
          this.notFound = false;
          return this.dataService.getPalmsByGenusSlug(this.genusSlug);
        })
      )
      .subscribe((species) => {
        this.loading = false;

        if (species.length === 0) {
          this.notFound = true;
          return;
        }

        this.species = species;
        this.currentPage = 0;
        this.updateDisplayedSpecies();
        this.genusName = species[0].accGenus || species[0].genus || 'Unknown';
        this.computeStats();
        this.updateSeo();
      });
  }

  private computeStats(): void {
    const heights = this.species
      .map((p) => p.MaxStemHeight_m || p.height_max_m)
      .filter((h): h is number => h != null && h > 0);
    this.avgHeight =
      heights.length > 0
        ? Math.round((heights.reduce((a, b) => a + b, 0) / heights.length) * 10) / 10
        : null;

    this.habitats = [
      ...new Set(
        this.species
          .map((p) => p.UnderstoreyCanopy)
          .filter((h): h is string => !!h)
      ),
    ];

    this.subfamilies = [
      ...new Set(
        this.species
          .map((p) => p.PalmSubfamily)
          .filter((s): s is string => !!s)
      ),
    ];

    this.tribes = [
      ...new Set(
        this.species
          .map((p) => p.PalmTribe || p.tribe)
          .filter((t): t is string => !!t)
      ),
    ];

    this.climbers = this.species.filter((p) => p.Climbing === 1).length;
    this.erect = this.species.filter((p) => p.Erect === 1).length;
    this.acaulescent = this.species.filter((p) => p.Acaulescent === 1).length;
  }

  private updateSeo(): void {
    const count = this.species.length;
    const description = `Explore all ${count} species in the ${this.genusName} palm genus. ${
      this.subfamilies.length > 0
        ? `Part of the ${this.subfamilies[0]} subfamily.`
        : ''
    } Browse taxonomy, morphological traits, and distribution data.`;

    this.seoService.update({
      title: `${this.genusName} - Palm Genus (${count} species)`,
      description,
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'Taxon',
        name: this.genusName,
        taxonRank: 'genus',
        url: `https://palma-encyclopedia.com/palms/genus/${this.genusSlug}`,
        ...(this.subfamilies.length > 0
          ? {
              parentTaxon: {
                '@type': 'Taxon',
                name: this.subfamilies[0],
                taxonRank: 'subfamily',
              },
            }
          : {}),
      },
    });
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

  getSpeciesName(palm: PalmTrait): string {
    return palm.SpecName || palm.species || 'Unknown Species';
  }
}
