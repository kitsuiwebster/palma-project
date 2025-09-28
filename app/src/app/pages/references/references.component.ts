import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

interface SearchResult {
  type: 'trait' | 'reference';
  content: string;
}

interface Toast {
  show: boolean;
  message: string;
}

@Component({
  selector: 'app-references',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './references.component.html',
  styleUrl: './references.component.scss'
})
export class ReferencesComponent implements OnInit {
  references: string[] = [];
  traits: string[] = [];
  searchResults: SearchResult[] = [];
  searchText: string = '';
  activeFilter: string = 'All';
  showingSearchResults: boolean = false;
  dataSourceUrl: string = 'https://datadryad.org/dataset/doi:10.5061/dryad.ts45225?utm_source=chatgpt.com#citations';
  toast: Toast = {
    show: false,
    message: ''
  };
  toastTimer: any = null;
  
  constructor(private http: HttpClient) {}
  
  ngOnInit(): void {
    // Load the references
    this.http.get('assets/data/references.txt', { responseType: 'text' })
      .subscribe(data => {
        this.references = data.split('\n').filter(line => line.trim().length > 0);
      });
      
    // Load the traits
    this.http.get('assets/data/traits.txt', { responseType: 'text' })
      .subscribe(data => {
        this.traits = data.split('\n').filter(line => line.trim().length > 0);
      });
  }
  
  search(): void {
    if (!this.searchText || this.searchText.trim().length < 2) {
      this.showingSearchResults = false;
      return;
    }
    
    this.showingSearchResults = true;
    this.searchResults = [];
    
    // Search in traits
    const matchingTraits = this.traits.filter(trait => 
      trait.toLowerCase().includes(this.searchText.toLowerCase())
    );
    
    matchingTraits.forEach(trait => {
      this.searchResults.push({
        type: 'trait',
        content: trait
      });
    });
    
    // Search in references
    const matchingReferences = this.references.filter(ref => {
      const matchesSearch = ref.toLowerCase().includes(this.searchText.toLowerCase());
      const matchesFilter = this.activeFilter === 'All' || this.getCategoryForReference(ref) === this.activeFilter;
      return matchesSearch && matchesFilter;
    });
    
    matchingReferences.forEach(ref => {
      this.searchResults.push({
        type: 'reference',
        content: ref
      });
    });
  }
  
  clearSearch(): void {
    this.searchText = '';
    this.showingSearchResults = false;
  }
  
  setFilter(filter: string): void {
    this.activeFilter = filter;
    if (this.showingSearchResults) {
      this.search();
    }
  }
  
  // This is a simplified approach - in reality, you'd probably have tags or categories in your data
  private getCategoryForReference(ref: string): string {
    if (ref.toLowerCase().includes('taxonomy') || 
        ref.toLowerCase().includes('genus') || 
        ref.toLowerCase().includes('species')) {
      return 'Taxonomy';
    } else if (ref.toLowerCase().includes('morphology') || 
               ref.toLowerCase().includes('structure') || 
               ref.toLowerCase().includes('anatomy')) {
      return 'Morphology';
    } else if (ref.toLowerCase().includes('region') || 
               ref.toLowerCase().includes('zone') || 
               ref.toLowerCase().includes('distribution')) {
      return 'Native Zones';
    }
    return 'Other';
  }
  
  openSourceLink(reference?: string): void {
    // Check if this is one of the 3 Martin R./Palma Encyclopedia references
    if (reference && this.isCustomReference(reference)) {
      window.open('https://github.com/kitsuiwebster/palma-project', '_blank');
    } else {
      window.open(this.dataSourceUrl, '_blank');
    }
  }

  private isCustomReference(reference: string): boolean {
    return reference.includes('Martin, R. (2025)') || 
           reference.includes('Palma Encyclopedia');
  }
  
  copyText(text: string): void {
    navigator.clipboard.writeText(text)
      .then(() => {
        this.showToast('Copied to clipboard!');
      })
      .catch(err => {
        console.error('Could not copy text: ', err);
        this.showToast('Failed to copy text.');
      });
  }
  
  showToast(message: string): void {
    // Clear any existing timer
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    
    // Show the toast
    this.toast = {
      show: true,
      message: message
    };
    
    // Auto-hide after 2 seconds (shorter duration for better UX)
    this.toastTimer = setTimeout(() => {
      this.toast = {
        show: false,
        message: ''
      };
      this.toastTimer = null;
    }, 2000);
  }
  
  exportTraitsReferences(): void {
    // Export traits.txt as ReferenceToSpecies_PalmTraits_1.0.txt
    const content = this.traits.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ReferenceToSpecies_PalmTraits_1.0.txt';
    link.click();
    window.URL.revokeObjectURL(url);
    this.showToast('Species references exported successfully!');
  }

  exportAllReferences(): void {
    // Export references.txt as AllReferences_PalmTraits_1.0.txt
    const content = this.references.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'AllReferences_PalmTraits_1.0.txt';
    link.click();
    window.URL.revokeObjectURL(url);
    this.showToast('All references exported successfully!');
  }
}