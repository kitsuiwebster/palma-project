// src/app/features/palms/pages/palm-list/palm-list.component.ts
import { Component, OnInit } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { DataService } from '../../../../core/services/data.service';
import { PalmTrait } from '../../../../core/models/palm-trait.model';
import { SearchBarComponent } from '../../../../shared/components/search-bar/search-bar.component';
import { PalmCardComponent } from '../../../../shared/components/palm-card/palm-card.component';
import { RouterModule } from '@angular/router';
import { SlugifyPipe } from '../../../../shared/pipes/slugify.pipe';
import { CommonModule } from '@angular/common';
import { MatIconButton } from '@angular/material/button';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import {
  MatExpansionPanel,
  MatExpansionPanelHeader,
  MatAccordion,
} from '@angular/material/expansion';
import { MatNavList, MatListItem } from '@angular/material/list';
import { MatExpansionPanelTitle } from '@angular/material/expansion';
import { SortPipe } from '../../../../shared/pipes/sort.pipe';
import { PaginatorComponent } from '../../../../shared/components/paginator/paginator.component';

@Component({
  selector: 'app-palm-list',
  templateUrl: './palm-list.component.html',
  styleUrls: ['./palm-list.component.scss'],
  standalone: true,
  imports: [
    SearchBarComponent,
    PalmCardComponent,
    RouterModule,
    SlugifyPipe,
    CommonModule,
    MatIconButton,
    MatProgressSpinner,
    MatAccordion,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatNavList,
    MatListItem,
    MatExpansionPanelTitle,
    SortPipe,
    PaginatorComponent,
  ],
})
export class PalmListComponent implements OnInit {
  // Les observables pour les données
  palmsByGenus$!: Observable<{ [genus: string]: PalmTrait[] }>;
  
  // Propriétés pour la pagination
  palms: PalmTrait[] = [];
  currentPage = 0;
  pageSize = 20; // Assurez-vous que c'est bien 20 ici
  totalItems = 0;
  pageSizeOptions = [10, 20, 50, 100];
  
  // Autres propriétés
  viewMode = 'grid'; // 'grid' ou 'list'
  loading = true;
  error = false;
  protected Object = Object;

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    console.log("PalmListComponent initialized");
    console.log("Initial pageSize:", this.pageSize);
    
    // Charger le nombre total d'éléments
    this.loadTotalCount();
    // Charger la première page
    this.loadCurrentPage();
    // Charger les groupes par genre (pour l'affichage par liste)
    this.loadGenera();
  }

  loadTotalCount(): void {
    this.dataService.getTotalPalmsCount().subscribe({
      next: (count) => {
        console.log("Total palm count:", count);
        this.totalItems = count;
      },
      error: (err) => console.error("Error getting total count:", err)
    });
  }

  loadCurrentPage(): void {
    console.log(`Loading page ${this.currentPage}, size ${this.pageSize}`);
    this.loading = true;
    this.error = false;
    
    this.dataService.getPaginatedPalms(this.currentPage, this.pageSize).subscribe({
      next: (palms) => {
        console.log(`Page loaded with ${palms.length} palms of ${this.pageSize} requested`);
        this.palms = palms;
        this.loading = false;
      },
      error: (error) => {
        console.error("Error loading page:", error);
        this.loading = false;
        this.error = true;
      }
    });
  }

  loadGenera(): void {
    this.palmsByGenus$ = this.dataService.getPalmsByGenus().pipe(
      tap(genera => {
        console.log("Genera loaded:", Object.keys(genera).length);
      }),
      catchError(error => {
        console.error("Error loading genera:", error);
        return of({});
      })
    );
  }

  onPageChange(event: any): void {
    console.log("Page event received:", event);
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    console.log(`Changing to page ${this.currentPage}, size ${this.pageSize}`);
    this.loadCurrentPage();
  }

  toggleView(mode: string): void {
    this.viewMode = mode;
  }

  // Helper method to get the name to display in the list view
  getSpeciesName(palm: PalmTrait): string {
    return palm.species || palm.SpecName || 'Unknown Species';
  }

  // Get the total number of palms in a genus group
  getGenusCount(palms: PalmTrait[]): number {
    return palms?.length || 0;
  }

  // Ajouter cette méthode dans palm-list.component.ts
changePageSize(event: Event): void {
  const selectElement = event.target as HTMLSelectElement;
  const newPageSize = Number(selectElement.value);
  console.log('Changing page size to:', newPageSize);
  
  this.pageSize = newPageSize;
  this.currentPage = 0; // Retour à la première page
  
  // Recharger les données avec la nouvelle taille
  this.loadCurrentPage();
}
}