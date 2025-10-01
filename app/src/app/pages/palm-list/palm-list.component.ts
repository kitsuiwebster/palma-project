// src/app/features/palms/pages/palm-list/palm-list.component.ts
import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Observable, of, Subscription } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';
import { DataService } from '../../core/services/data.service';
import { SearchService } from '../../core/services/search.service'; // Importer le service
import { PalmTrait } from '../../core/models/palm-trait.model';
import { SearchBarComponent } from '../../shared/components/search-bar/search-bar.component';
import { PalmCardComponent } from '../../shared/components/palm-card/palm-card.component';
import { RouterModule } from '@angular/router';
import { SlugifyPipe } from '../../shared/pipes/slugify.pipe';
import { CommonModule } from '@angular/common';
import { MatIconButton, MatButton } from '@angular/material/button';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import {
  MatExpansionPanel,
  MatExpansionPanelHeader,
  MatAccordion,
} from '@angular/material/expansion';
import { MatNavList, MatListItem } from '@angular/material/list';
import { MatExpansionPanelTitle } from '@angular/material/expansion';
import { SortPipe } from '../../shared/pipes/sort.pipe';
import { PaginatorComponent } from '../../shared/components/paginator/paginator.component';

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
    MatButton,
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
export class PalmListComponent implements OnInit, OnDestroy {
  @ViewChild('listTop') listTop!: ElementRef;
  // Les observables pour les données
  palmsByGenus$!: Observable<{ [genus: string]: PalmTrait[] }>;
  
  // Propriétés pour la pagination
  palms: PalmTrait[] = [];
  filteredPalms: PalmTrait[] | null = null; // Pour stocker les résultats filtrés
  allPalms: PalmTrait[] = []; // Pour stocker tous les palmiers
  currentPage = 0;
  pageSize = 20;
  totalItems = 0;
  pageSizeOptions = [10, 20, 50, 100];
  filteredPalmsByGenus$: Observable<{ [genus: string]: PalmTrait[] }> | null = null;

  
  // Autres propriétés
  viewMode = 'grid'; // 'grid' ou 'list'
  loading = true;
  error = false;
  protected Object = Object;
  
  // Pour la gestion des abonnements
  private searchSubscription: Subscription;

  constructor(
    private dataService: DataService,
    private searchService: SearchService, // Injecter le service de recherche
    private route: ActivatedRoute // Injecter ActivatedRoute pour détecter la navigation
  ) {
    // Initialiser la subscription
    this.searchSubscription = new Subscription();
  }

  /* `ngOn` is not a valid lifecycle hook in Angular. The correct lifecycle hooks in Angular start with
  `ngOnInit`, `ngOnChanges`, `ngOnDestroy`, etc. These hooks are used to perform actions at specific
  points in the component's lifecycle. For example, `ngOnInit` is called after Angular has
  initialized all data-bound properties of a directive. */
  ngOnInit(): void {
    console.log("PalmListComponent initialized");
    
    // Check if this is a direct navigation to /palms (no search context)
    this.route.queryParams.subscribe(params => {
      const hasSearchParams = params['q'] || params['from'] === 'search';
      const currentUrl = this.route.snapshot.url.join('/');
      
      // If no search-related query parameters and we're on the main /palms route, clear any existing search results
      if (!hasSearchParams && currentUrl === '') { // Empty string means we're at the root of this route (/palms)
        console.log("Direct navigation to /palms detected - clearing search results");
        this.searchService.clearSearchResults();
      }
    });
    
    // S'abonner aux changements de résultats de recherche
    this.searchSubscription = this.searchService.searchResults$.subscribe(results => {
      console.log("PalmListComponent: received search results", results ? results.length : 0);
      if (results) {
        this.filteredPalms = results;
        this.filteredPalmsByGenus$ = of(this.groupPalmsByGenus(results)); // 👈 ici
        this.totalItems = results.length;
        this.currentPage = 0;
        this.updateDisplayedPalms();
      } else {
        this.filteredPalms = null;
        this.filteredPalmsByGenus$ = null; // 👈 ici
        this.loadTotalCount();
        this.loadCurrentPage();
      }
    });
    
    
    // Charger le nombre total d'éléments
    this.loadTotalCount();
    // Charger la première page
    this.loadCurrentPage();
    // Charger les groupes par genre (pour l'affichage par liste)
    this.loadGenera();
    
    // Charger tous les palmiers pour pouvoir filtrer
    this.dataService.getAllPalms().subscribe(palms => {
      this.allPalms = palms;
    });
  }
  
  ngOnDestroy(): void {
    // Nettoyer les abonnements
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
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
  
  // Nouvelle méthode pour mettre à jour les palmiers affichés
  updateDisplayedPalms(): void {
    if (this.filteredPalms) {
      // Si on a des résultats filtrés, on les pagine
      const start = this.currentPage * this.pageSize;
      const end = start + this.pageSize;
      this.palms = this.filteredPalms.slice(start, end);
    } else {
      // Sinon on charge depuis le service
      this.loadCurrentPage();
    }
  }

  private groupPalmsByGenus(palms: PalmTrait[]): { [genus: string]: PalmTrait[] } {
    return palms.reduce((acc, palm) => {
      const genus = palm.accGenus || palm.genus || 'Unknown';
      if (!acc[genus]) acc[genus] = [];
      acc[genus].push(palm);
      return acc;
    }, {} as { [genus: string]: PalmTrait[] });
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
    this.updateDisplayedPalms(); // Utiliser la nouvelle méthode
    if (this.listTop) {
      this.listTop.nativeElement.scrollIntoView({ behavior: 'smooth' });
    }
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

  // Méthode pour changer la taille de la page
  changePageSize(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const newPageSize = Number(selectElement.value);
    console.log('Changing page size to:', newPageSize);
    
    this.pageSize = newPageSize;
    this.currentPage = 0; // Retour à la première page
    
    // Mettre à jour les palmiers affichés
    this.updateDisplayedPalms();
  }
  
  // Méthode pour effacer les résultats de recherche
  clearSearchResults(): void {
    this.filteredPalms = null;
    this.loadTotalCount();
    this.loadCurrentPage();
    this.searchService.clearSearchResults();
  }
}