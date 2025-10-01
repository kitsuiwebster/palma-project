import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DataService } from '../../core/services/data.service';

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

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
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