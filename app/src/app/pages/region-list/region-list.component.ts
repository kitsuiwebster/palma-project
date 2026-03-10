import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DataService } from '../../core/services/data.service';
import { SeoService } from '../../core/services/seo.service';
import { RegionCodesService } from '../../core/services/region-codes.service';

interface RegionItem {
  code: string;
  name: string;
  flag: string;
  count: number;
}

@Component({
  selector: 'app-region-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './region-list.component.html',
  styleUrls: ['./region-list.component.scss'],
})
export class RegionListComponent implements OnInit {
  regions: RegionItem[] = [];
  filteredRegions: RegionItem[] = [];
  loading = true;
  searchQuery = '';
  sortBy: 'name' | 'count' = 'count';

  constructor(
    private dataService: DataService,
    private seoService: SeoService,
    private regionCodesService: RegionCodesService
  ) {}

  ngOnInit(): void {
    this.seoService.update({
      title: 'Palm Species by Region',
      description:
        'Explore palm species by geographic region. Browse 190+ regions and countries to discover their native palm biodiversity.',
    });

    this.dataService.getAllRegions().subscribe(async (regions) => {
      const items: RegionItem[] = [];
      for (const r of regions) {
        const name = await this.regionCodesService.getRegionName(r.code);
        const flag = await this.regionCodesService.getFlagUrl(r.code);
        items.push({ code: r.code, name, flag, count: r.count });
      }
      this.regions = items;
      this.applySortAndFilter();
      this.loading = false;
    });
  }

  onSearch(event: Event): void {
    this.searchQuery = (event.target as HTMLInputElement).value.toLowerCase();
    this.applySortAndFilter();
  }

  toggleSort(sort: 'name' | 'count'): void {
    this.sortBy = sort;
    this.applySortAndFilter();
  }

  private applySortAndFilter(): void {
    let list = this.regions;

    if (this.searchQuery) {
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(this.searchQuery) ||
          r.code.toLowerCase().includes(this.searchQuery)
      );
    }

    if (this.sortBy === 'name') {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    } else {
      list = [...list].sort((a, b) => b.count - a.count);
    }

    this.filteredRegions = list;
  }

  get totalSpeciesOccurrences(): number {
    return this.regions.reduce((sum, r) => sum + r.count, 0);
  }
}
