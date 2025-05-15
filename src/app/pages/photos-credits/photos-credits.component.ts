import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { PhotoCreditsService, PhotoCredit } from '../../core/services/photo-credits.service';

@Component({
  selector: 'app-photos-credits',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './photos-credits.component.html',
  styleUrl: './photos-credits.component.scss'
})
export class PhotosCreditsComponent implements OnInit {
  photoCredits: PhotoCredit[] = [];
  filteredCredits: PhotoCredit[] = [];
  searchTerm: string = '';
  currentPage: number = 1;
  itemsPerPage: number = 99;
  isLoading: boolean = true;
  loadingError: boolean = false;
  
  // Count of sources
  sourceStats = {
    iNaturalist: 0,
    Wikimedia: 0,
    Other: 0
  };
  
  // Make Math available to the template
  Math = Math;
  
  constructor(private photoCreditsService: PhotoCreditsService) {}
  
  ngOnInit() {
    // Fetch photo credits from dataset.txt
    this.loadPhotoCredits();
  }
  
  loadPhotoCredits() {
    this.isLoading = true;
    this.loadingError = false;
    
    this.photoCreditsService.getPhotoCredits().subscribe({
      next: (credits) => {
        this.photoCredits = credits;
        this.filteredCredits = [...this.photoCredits];
        this.calculateSourceStats();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading photo credits:', error);
        this.loadingError = true;
        this.isLoading = false;
      }
    });
  }
  
  calculateSourceStats() {
    // Reset stats
    this.sourceStats = {
      iNaturalist: 0,
      Wikimedia: 0,
      Other: 0
    };
    
    // Count by source
    this.photoCredits.forEach(credit => {
      if (credit.source) {
        this.sourceStats[credit.source]++;
      }
    });
  }
  
  // Retry loading if there was an error
  retryLoading() {
    this.loadPhotoCredits();
  }
  
  search(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchTerm = target.value.toLowerCase();
    this.filterCredits();
    this.currentPage = 1; // Reset to first page when searching
  }
  
  filterCredits() {
    if (!this.searchTerm.trim()) {
      this.filteredCredits = [...this.photoCredits];
      return;
    }
    
    this.filteredCredits = this.photoCredits.filter(credit => 
      credit.species.toLowerCase().includes(this.searchTerm) ||
      credit.photographer.toLowerCase().includes(this.searchTerm) ||
      credit.license.toLowerCase().includes(this.searchTerm) ||
      (credit.source && credit.source.toLowerCase().includes(this.searchTerm))
    );
  }
  
  // Filter by source
  filterBySource(source: 'iNaturalist' | 'Wikimedia') {
    this.searchTerm = source.toLowerCase();
    this.filterCredits();
    this.currentPage = 1;
  }
  
  // Filter by license type
  filterByLicense(license: string) {
    this.searchTerm = license.toLowerCase();
    this.filterCredits();
    this.currentPage = 1;
  }
  
  get totalPages(): number {
    return Math.ceil(this.filteredCredits.length / this.itemsPerPage);
  }
  
  get currentPageCredits(): PhotoCredit[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredCredits.slice(startIndex, startIndex + this.itemsPerPage);
  }
  
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }
  
  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }
  
  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }
  
  // Helper function for pagination display
  getPageNumber(index: number): number {
    if (this.totalPages <= 5) {
      return index + 1;
    }
    
    if (this.currentPage <= 3) {
      return index + 1;
    } else if (this.currentPage >= this.totalPages - 2) {
      return this.totalPages - 4 + index;
    } else {
      return this.currentPage - 2 + index;
    }
  }
  
  // Export credits to CSV file
  exportToCSV() {
    // Define CSV headers
    const headers = ['Species', 'Photo URL', 'Source', 'Photographer', 'License'];
    
    // Create CSV content
    let csvContent = headers.join(',') + '\n';
    
    // Add data rows
    this.filteredCredits.forEach(credit => {
      const row = [
        `"${credit.species}"`,
        `"${credit.photoUrl}"`,
        `"${credit.source || 'Unknown'}"`,
        `"${credit.photographer.replace(/"/g, '""')}"`,
        `"${credit.license}"`
      ];
      csvContent += row.join(',') + '\n';
    });
    
    // Create a Blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // Create a temporary link element and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'palm_photo_credits.csv');
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}