import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DataService } from '../../core/services/data.service';
import { SeoService } from '../../core/services/seo.service';

@Component({
  selector: 'app-characteristic-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './characteristic-list.component.html',
  styleUrls: ['./characteristic-list.component.scss'],
})
export class CharacteristicListComponent implements OnInit {
  stemTypes: { slug: string; label: string; count: number }[] = [];
  fruitShapes: { slug: string; label: string; count: number }[] = [];
  fruitColors: { slug: string; label: string; count: number }[] = [];
  habitats: { slug: string; label: string; count: number }[] = [];
  heightRanges: { slug: string; label: string; range: string; count: number }[] = [];
  loading = true;

  constructor(private dataService: DataService, private seoService: SeoService) {}

  private colorMap: { [key: string]: string } = {
    'black': '#1a1a1a',
    'brown': '#8B4513',
    'red': '#c0392b',
    'orange': '#e67e22',
    'yellow': '#f1c40f',
    'green': '#27ae60',
    'blue': '#2980b9',
    'purple': '#8e44ad',
    'white': '#f5f5f5',
    'cream': '#FFFDD0',
    'grey': '#95a5a6',
    'gray': '#95a5a6',
    'pink': '#e91e8a',
    'ivory': '#FFFFF0',
    'scarlet': '#FF2400',
  };

  getColorValue(slug: string): string {
    return this.colorMap[slug] || '#ccc';
  }

  ngOnInit(): void {
    this.seoService.update({
      title: 'Palm Characteristics - Browse Palms by Trait',
      description: 'Explore palm species by their physical characteristics: stem type, fruit shape, fruit color, habitat, and height. Filter through 2,500+ palm species by morphological traits.',
    });

    let loaded = 0;
    const checkDone = () => { loaded++; if (loaded >= 5) this.loading = false; };

    this.dataService.getAllStemTypes().subscribe(d => { this.stemTypes = d; checkDone(); });
    this.dataService.getAllFruitShapes().subscribe(d => { this.fruitShapes = d; checkDone(); });
    this.dataService.getAllFruitColors().subscribe(d => { this.fruitColors = d.slice(0, 15); checkDone(); });
    this.dataService.getAllHabitats().subscribe(d => { this.habitats = d; checkDone(); });
    this.dataService.getAllHeightRanges().subscribe(d => { this.heightRanges = d; checkDone(); });
  }
}
