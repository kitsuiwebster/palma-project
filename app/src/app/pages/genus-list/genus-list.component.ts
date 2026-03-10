import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DataService } from '../../core/services/data.service';
import { SeoService } from '../../core/services/seo.service';
import { SlugifyPipe } from '../../shared/pipes/slugify.pipe';

@Component({
  selector: 'app-genus-list',
  standalone: true,
  imports: [CommonModule, RouterModule, SlugifyPipe],
  templateUrl: './genus-list.component.html',
  styleUrls: ['./genus-list.component.scss'],
})
export class GenusListComponent implements OnInit {
  genera: { name: string; slug: string; count: number }[] = [];
  filteredGenera: { name: string; slug: string; count: number }[] = [];
  loading = true;
  searchQuery = '';
  selectedLetter = '';
  letters: string[] = [];

  constructor(
    private dataService: DataService,
    private seoService: SeoService
  ) {}

  ngOnInit(): void {
    this.seoService.update({
      title: 'All Palm Genera',
      description:
        'Browse all 185+ palm genera in the Arecaceae family. Explore species counts, taxonomy, and detailed information for each genus.',
    });

    this.dataService.getAllGenera().subscribe((genera) => {
      this.genera = genera;
      this.filteredGenera = genera;
      this.letters = [
        ...new Set(genera.map((g) => g.name.charAt(0).toUpperCase())),
      ].sort();
      this.loading = false;
    });
  }

  onSearch(event: Event): void {
    this.searchQuery = (event.target as HTMLInputElement).value.toLowerCase();
    this.applyFilters();
  }

  filterByLetter(letter: string): void {
    this.selectedLetter = this.selectedLetter === letter ? '' : letter;
    this.applyFilters();
  }

  private applyFilters(): void {
    this.filteredGenera = this.genera.filter((g) => {
      const matchesSearch = !this.searchQuery || g.name.toLowerCase().includes(this.searchQuery);
      const matchesLetter = !this.selectedLetter || g.name.charAt(0).toUpperCase() === this.selectedLetter;
      return matchesSearch && matchesLetter;
    });
  }

  get totalSpecies(): number {
    return this.genera.reduce((sum, g) => sum + g.count, 0);
  }
}
