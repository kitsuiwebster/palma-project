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
  selector: 'app-characteristic-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, PalmCardComponent, SlugifyPipe, PaginatorComponent],
  templateUrl: './characteristic-detail.component.html',
  styleUrls: ['./characteristic-detail.component.scss'],
})
export class CharacteristicDetailComponent implements OnInit {
  type = '';
  value = '';
  title = '';
  subtitle = '';
  species: PalmTrait[] = [];
  displayedSpecies: PalmTrait[] = [];
  currentPage = 0;
  pageSize = 20;
  loading = true;
  notFound = false;

  // Stats
  avgHeight: number | null = null;
  genera: { name: string; slug: string; count: number }[] = [];
  topRegions: string[] = [];

  private readonly typeLabels: { [key: string]: string } = {
    'stem': 'Stem Type',
    'fruit-shape': 'Fruit Shape',
    'fruit-color': 'Fruit Color',
    'habitat': 'Habitat',
    'height': 'Height Range',
  };

  private readonly descriptions: { [key: string]: { [key: string]: string } } = {
    'stem': {
      'climbing': 'Climbing palms (rattans and lianas) use hooks or whips to ascend through forest canopies. They are among the longest plants on Earth.',
      'acaulescent': 'Acaulescent palms grow without a visible trunk, with leaves emerging directly from ground level. They are ideal for understory habitats.',
      'erect': 'Erect palms have upright, self-supporting trunks. This is the most common growth form among palm species.',
      'solitary': 'Solitary palms produce a single trunk, unlike clustering species that form multiple stems from the base.',
      'armed': 'Armed palms have spines, thorns, or prickles on their stems, providing defense against herbivores.',
    },
    'fruit-shape': {
      'globose': 'Globose (spherical) fruits are round in shape, common in many palm genera including coconut palms.',
      'ovoid': 'Ovoid (egg-shaped) fruits are wider at the base and taper toward the tip. This is the most common fruit shape in palms.',
      'elongate': 'Elongate fruits are significantly longer than wide, often found in date palms and related species.',
      'ellipsoid': 'Ellipsoid fruits have an oval shape, symmetrical along both axes.',
      'pyramidal': 'Pyramidal fruits have a broader base tapering to a point, a relatively rare shape among palms.',
      'fusiform': 'Fusiform (spindle-shaped) fruits are tapered at both ends, the rarest fruit shape among palms.',
    },
    'habitat': {
      'understorey': 'Understorey palms grow beneath the forest canopy in shaded conditions. They are typically smaller and shade-tolerant.',
      'canopy': 'Canopy palms reach the upper levels of the forest, competing for direct sunlight. They tend to be taller species.',
      'both': 'These versatile palms can grow in both understorey and canopy positions depending on conditions.',
    },
    'height': {
      'small': 'Small palms (under 5 meters) are ideal for gardens, indoor spaces, and understory habitats. Many are popular ornamentals.',
      'medium': 'Medium palms (5-15 meters) include many of the most well-known landscape palms and economically important species.',
      'tall': 'Tall palms (15-30 meters) are impressive canopy species found in tropical forests worldwide.',
      'very-tall': 'Very tall palms (over 30 meters) are among the tallest monocots on Earth, including the wax palms of the Andes.',
    },
  };

  constructor(
    private route: ActivatedRoute,
    private dataService: DataService,
    private seoService: SeoService
  ) {}

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        switchMap(params => {
          this.type = params.get('type') || '';
          this.value = params.get('value') || '';
          this.loading = true;
          this.notFound = false;

          switch (this.type) {
            case 'stem': return this.dataService.getPalmsByStemType(this.value);
            case 'fruit-shape': return this.dataService.getPalmsByFruitShape(this.value);
            case 'fruit-color': return this.dataService.getPalmsByFruitColor(this.value);
            case 'habitat': return this.dataService.getPalmsByHabitat(this.value);
            case 'height': return this.dataService.getPalmsByHeightRange(this.value);
            default: return [];
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
        this.buildTitle();
        this.computeStats();
        this.updateSeo();
      });
  }

  private buildTitle(): void {
    const typeLabel = this.typeLabels[this.type] || this.type;
    const valueLabel = this.value.charAt(0).toUpperCase() + this.value.slice(1).replace(/-/g, ' ');

    switch (this.type) {
      case 'stem':
        this.title = `${valueLabel} Palms`;
        this.subtitle = `${this.species.length} species with ${this.value} stems`;
        break;
      case 'fruit-shape':
        this.title = `Palms with ${valueLabel} Fruits`;
        this.subtitle = `${this.species.length} species with ${this.value}-shaped fruits`;
        break;
      case 'fruit-color':
        this.title = `Palms with ${valueLabel} Fruits`;
        this.subtitle = `${this.species.length} species producing ${this.value}-colored fruits`;
        break;
      case 'habitat':
        this.title = `${valueLabel} Palms`;
        this.subtitle = `${this.species.length} species found in ${this.value} habitats`;
        break;
      case 'height':
        const rangeLabels: { [k: string]: string } = {
          'small': 'under 5m', 'medium': '5-15m', 'tall': '15-30m', 'very-tall': 'over 30m'
        };
        this.title = `${valueLabel} Palms`;
        this.subtitle = `${this.species.length} species (${rangeLabels[this.value] || ''})`;
        break;
      default:
        this.title = `${valueLabel} Palms`;
        this.subtitle = `${this.species.length} species`;
    }
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
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const regionMap = new Map<string, number>();
    this.species.forEach(p => {
      const codes = (p.NativeRegion || '').match(/\b[A-Z]{2,3}\b/g) || [];
      codes.forEach(c => regionMap.set(c, (regionMap.get(c) || 0) + 1));
    });
    this.topRegions = Array.from(regionMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([code]) => code);
  }

  getDescription(): string {
    return this.descriptions[this.type]?.[this.value] || '';
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
    const desc = this.getDescription();
    this.seoService.update({
      title: `${this.title} - ${this.species.length} Palm Species`,
      description: desc || `Explore ${this.species.length} palm species classified as ${this.value}. Browse photos, distribution maps, and morphological data.`,
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: this.title,
        description: desc,
        url: `https://palma-encyclopedia.com/palms/characteristic/${this.type}/${this.value}`,
        numberOfItems: this.species.length,
      },
    });
  }
}
