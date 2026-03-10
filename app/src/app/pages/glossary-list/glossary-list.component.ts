import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SeoService } from '../../core/services/seo.service';

interface GlossaryTerm {
  slug: string;
  term: string;
  shortDef: string;
  category: string;
}

@Component({
  selector: 'app-glossary-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './glossary-list.component.html',
  styleUrls: ['./glossary-list.component.scss'],
})
export class GlossaryListComponent implements OnInit {
  categories: { name: string; terms: GlossaryTerm[] }[] = [];
  searchQuery = '';

  private allTerms: GlossaryTerm[] = [
    // Morphology
    { slug: 'acaulescent', term: 'Acaulescent', shortDef: 'A palm with no visible above-ground stem', category: 'Morphology' },
    { slug: 'erect', term: 'Erect', shortDef: 'Having an upright, self-supporting stem', category: 'Morphology' },
    { slug: 'climbing', term: 'Climbing', shortDef: 'A palm that uses hooks or whips to climb through vegetation', category: 'Morphology' },
    { slug: 'solitary', term: 'Solitary', shortDef: 'A palm producing a single stem', category: 'Morphology' },
    { slug: 'clustering', term: 'Clustering', shortDef: 'A palm producing multiple stems from the base', category: 'Morphology' },
    { slug: 'armed', term: 'Armed', shortDef: 'Having spines, thorns, or prickles on the stem or leaves', category: 'Morphology' },
    { slug: 'canopy', term: 'Canopy', shortDef: 'The uppermost layer of a forest where palm crowns receive direct sunlight', category: 'Morphology' },
    { slug: 'understorey', term: 'Understorey', shortDef: 'The lower layer of a forest beneath the canopy', category: 'Morphology' },
    // Leaves
    { slug: 'pinnate', term: 'Pinnate', shortDef: 'A feather-shaped leaf with leaflets arranged along a central rachis', category: 'Leaves' },
    { slug: 'palmate', term: 'Palmate', shortDef: 'A fan-shaped leaf with segments radiating from a central point', category: 'Leaves' },
    { slug: 'bipinnate', term: 'Bipinnate', shortDef: 'A doubly-divided leaf found only in Caryota palms', category: 'Leaves' },
    { slug: 'costapalmate', term: 'Costapalmate', shortDef: 'An intermediate leaf type between palmate and pinnate', category: 'Leaves' },
    { slug: 'rachis', term: 'Rachis', shortDef: 'The main axis of a compound leaf to which leaflets are attached', category: 'Leaves' },
    { slug: 'petiole', term: 'Petiole', shortDef: 'The stalk connecting the leaf blade to the stem', category: 'Leaves' },
    { slug: 'hastula', term: 'Hastula', shortDef: 'A flap of tissue at the junction of petiole and blade in palmate leaves', category: 'Leaves' },
    { slug: 'crownshaft', term: 'Crownshaft', shortDef: 'A smooth, often colored column formed by tightly wrapped leaf bases', category: 'Leaves' },
    // Fruit
    { slug: 'drupe', term: 'Drupe', shortDef: 'A fleshy fruit with a hard inner stone, the most common palm fruit type', category: 'Fruit' },
    { slug: 'globose', term: 'Globose', shortDef: 'Spherical or round in shape', category: 'Fruit' },
    { slug: 'ovoid', term: 'Ovoid', shortDef: 'Egg-shaped, wider at the base', category: 'Fruit' },
    { slug: 'ellipsoid', term: 'Ellipsoid', shortDef: 'Oval-shaped, symmetrical along both axes', category: 'Fruit' },
    { slug: 'endocarp', term: 'Endocarp', shortDef: 'The hard inner layer of the fruit wall surrounding the seed', category: 'Fruit' },
    { slug: 'mesocarp', term: 'Mesocarp', shortDef: 'The fleshy middle layer of the fruit', category: 'Fruit' },
    // Taxonomy
    { slug: 'arecaceae', term: 'Arecaceae', shortDef: 'The scientific family name for all palms', category: 'Taxonomy' },
    { slug: 'monocot', term: 'Monocot', shortDef: 'A flowering plant with one seed leaf; palms are monocotyledons', category: 'Taxonomy' },
    { slug: 'genus', term: 'Genus', shortDef: 'A taxonomic rank grouping closely related species', category: 'Taxonomy' },
    { slug: 'tribe', term: 'Tribe', shortDef: 'A taxonomic rank between subfamily and genus', category: 'Taxonomy' },
    { slug: 'subfamily', term: 'Subfamily', shortDef: 'A taxonomic rank between family and tribe', category: 'Taxonomy' },
    { slug: 'endemic', term: 'Endemic', shortDef: 'A species found naturally only in a specific geographic area', category: 'Taxonomy' },
    // Reproduction
    { slug: 'monoecious', term: 'Monoecious', shortDef: 'Having male and female flowers on the same plant', category: 'Reproduction' },
    { slug: 'dioecious', term: 'Dioecious', shortDef: 'Having male and female flowers on separate plants', category: 'Reproduction' },
    { slug: 'inflorescence', term: 'Inflorescence', shortDef: 'The flowering structure of a palm', category: 'Reproduction' },
    { slug: 'spadix', term: 'Spadix', shortDef: 'A spike of flowers on a fleshy axis, typical of palms', category: 'Reproduction' },
    { slug: 'spathe', term: 'Spathe', shortDef: 'A large bract enclosing the inflorescence', category: 'Reproduction' },
    { slug: 'hapaxanthic', term: 'Hapaxanthic', shortDef: 'Flowering only once before dying (monocarpic)', category: 'Reproduction' },
    { slug: 'pleonanthic', term: 'Pleonanthic', shortDef: 'Flowering repeatedly throughout the palm\'s life', category: 'Reproduction' },
  ];

  constructor(private seoService: SeoService) {}

  ngOnInit(): void {
    this.seoService.update({
      title: 'Palm Glossary - Botanical Terms & Definitions',
      description: `Comprehensive glossary of ${this.allTerms.length} palm botany terms. Learn about palm morphology, leaf types, fruit characteristics, taxonomy, and reproduction.`,
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'DefinedTermSet',
        name: 'Palm Botany Glossary',
        description: 'Glossary of botanical terms related to palm trees (Arecaceae)',
        url: 'https://palma-encyclopedia.com/glossary',
        hasDefinedTerm: this.allTerms.map(t => ({
          '@type': 'DefinedTerm',
          name: t.term,
          description: t.shortDef,
          url: `https://palma-encyclopedia.com/glossary/${t.slug}`,
        })),
      },
    });

    this.buildCategories();
  }

  private buildCategories(): void {
    const catMap = new Map<string, GlossaryTerm[]>();
    this.allTerms.forEach(t => {
      if (!catMap.has(t.category)) catMap.set(t.category, []);
      catMap.get(t.category)!.push(t);
    });
    this.categories = Array.from(catMap.entries())
      .map(([name, terms]) => ({ name, terms: terms.sort((a, b) => a.term.localeCompare(b.term)) }));
  }

  get filteredCategories(): { name: string; terms: GlossaryTerm[] }[] {
    if (!this.searchQuery.trim()) return this.categories;
    const q = this.searchQuery.toLowerCase();
    return this.categories
      .map(cat => ({
        name: cat.name,
        terms: cat.terms.filter(t => t.term.toLowerCase().includes(q) || t.shortDef.toLowerCase().includes(q)),
      }))
      .filter(cat => cat.terms.length > 0);
  }

  getCategorySlug(name: string): string {
    return name.toLowerCase().replace(/\s+/g, '-');
  }

  onSearch(event: Event): void {
    this.searchQuery = (event.target as HTMLInputElement).value;
  }
}
