import { Injectable, Inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

export interface SeoConfig {
  title: string;
  description: string;
  url?: string;
  image?: string;
  type?: string;
  jsonLd?: Record<string, unknown>;
}

@Injectable({
  providedIn: 'root',
})
export class SeoService {
  private readonly baseUrl = 'https://palma-encyclopedia.com';
  private readonly siteName = 'Palm Encyclopedia';
  private readonly defaultImage = `${this.baseUrl}/assets/icons/palma.png`;

  constructor(
    private titleService: Title,
    private metaService: Meta,
    private router: Router,
    @Inject(DOCUMENT) private document: Document
  ) {}

  update(config: SeoConfig): void {
    const fullTitle = config.title.includes(this.siteName)
      ? config.title
      : `${config.title} - ${this.siteName}`;
    const url = config.url || `${this.baseUrl}${this.router.url.split('#')[0].split('?')[0]}`;
    const image = config.image || this.defaultImage;
    const type = config.type || 'website';

    // Title
    this.titleService.setTitle(fullTitle);

    // Standard meta
    this.metaService.updateTag({ name: 'description', content: config.description });

    // Open Graph
    this.metaService.updateTag({ property: 'og:title', content: fullTitle });
    this.metaService.updateTag({ property: 'og:description', content: config.description });
    this.metaService.updateTag({ property: 'og:url', content: url });
    this.metaService.updateTag({ property: 'og:image', content: image });
    this.metaService.updateTag({ property: 'og:type', content: type });
    this.metaService.updateTag({ property: 'og:site_name', content: this.siteName });

    // Twitter Card
    this.metaService.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.metaService.updateTag({ name: 'twitter:title', content: fullTitle });
    this.metaService.updateTag({ name: 'twitter:description', content: config.description });
    this.metaService.updateTag({ name: 'twitter:image', content: image });

    // Canonical
    this.updateCanonical(url);

    // JSON-LD
    if (config.jsonLd) {
      this.updateJsonLd(config.jsonLd);
    }
  }

  private updateCanonical(url: string): void {
    let link = this.document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  private updateJsonLd(data: Record<string, unknown>): void {
    // Remove existing JSON-LD
    const existing = this.document.querySelector('script[type="application/ld+json"][data-seo]');
    if (existing) {
      existing.remove();
    }

    const script = this.document.createElement('script');
    script.setAttribute('type', 'application/ld+json');
    script.setAttribute('data-seo', 'true');
    script.textContent = JSON.stringify(data);
    this.document.head.appendChild(script);
  }

  /** Generate WebSite schema for the homepage */
  getWebSiteSchema(): Record<string, unknown> {
    return {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: this.siteName,
      url: this.baseUrl,
      description: 'A comprehensive encyclopedia of palm species with morphological traits, geographic distribution, and taxonomic classification data.',
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${this.baseUrl}/palms/search?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    };
  }

  /** Generate BreadcrumbList schema */
  getBreadcrumbSchema(items: { name: string; url: string }[]): Record<string, unknown> {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url.startsWith('http') ? item.url : `${this.baseUrl}${item.url}`,
      })),
    };
  }

  /** Generate Dataset schema for the data page */
  getDatasetSchema(): Record<string, unknown> {
    return {
      '@context': 'https://schema.org',
      '@type': 'Dataset',
      name: 'Palm Species Database',
      description: 'Comprehensive database of 2,557 palm species with morphological traits, geographic distribution, taxonomic classification, and photographic references.',
      url: `${this.baseUrl}/data/dataset`,
      keywords: ['palm species', 'Arecaceae', 'morphological traits', 'geographic distribution', 'taxonomic classification'],
      license: 'https://creativecommons.org/licenses/by/4.0/',
      variableMeasured: [
        'MaxStemHeight_m', 'MaxStemDia_cm', 'MaxLeafNumber',
        'Max_Blade_Length_m', 'Max_Rachis_Length_m', 'AverageFruitLength_cm', 'AverageFruitWidth_cm'
      ],
    };
  }

  /** Generate species schema (Taxon) */
  getSpeciesSchema(palm: {
    speciesName: string;
    genus: string;
    tribe: string;
    subfamily: string;
    distribution: string;
    imageUrl?: string;
    slug: string;
  }): Record<string, unknown> {
    const schema: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'Taxon',
      name: palm.speciesName,
      taxonRank: 'species',
      parentTaxon: {
        '@type': 'Taxon',
        name: palm.genus,
        taxonRank: 'genus',
      },
      url: `${this.baseUrl}/palms/${palm.slug}`,
    };
    if (palm.imageUrl && palm.imageUrl.startsWith('http')) {
      (schema as any).image = palm.imageUrl;
    }
    return schema;
  }
}
