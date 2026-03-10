import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DataService } from '../../core/services/data.service';
import { SeoService } from '../../core/services/seo.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  totalSpecies = 0;
  loading = true;

  constructor(
    private dataService: DataService,
    private seoService: SeoService
  ) {}

  ngOnInit(): void {
    this.seoService.update({
      title: 'Palm Encyclopedia - Comprehensive Database of 2,500+ Palm Species',
      description: 'Explore a comprehensive encyclopedia of over 2,500 palm species with morphological traits, geographic distribution, taxonomic classification, and photos.',
      url: 'https://palma-encyclopedia.com/',
      jsonLd: this.seoService.getWebSiteSchema(),
    });

    // Load total species count for display
    this.dataService.getTotalPalmsCount().subscribe({
      next: (count: number) => {
        this.totalSpecies = count;
        this.loading = false;
      },
      error: () => {
        this.totalSpecies = 2557; // Fallback number
        this.loading = false;
      }
    });
  }
}