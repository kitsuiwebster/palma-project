import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

type GroupKey = 'taxonomy' | 'geography' | 'growth' | 'leaves' | 'fruits';

interface Toast {
  show: boolean;
  message: string;
}

@Component({
  selector: 'app-dataset',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dataset.component.html',
  styleUrl: './dataset.component.scss',
})
export class DatasetComponent {
  expandedGroups: Record<GroupKey, boolean> = {
    taxonomy: false,
    geography: false,
    growth: false,
    leaves: false,
    fruits: false
  };

  toast: Toast = {
    show: false,
    message: ''
  };
  private toastTimer: any;

  citationText = 'Palma-1.0: A global database of palm functional traits, based on PalmTraits 1.0 and enhanced with GBIF, iNaturalist, Wikimedia Commons and POWO data (2025). Encyclopedia of Palms Project. Available at: https://huggingface.co/datasets/kitsuiwebster/Palma-1.0';

  constructor(private http: HttpClient) {}

  toggleGroup(group: GroupKey, event: Event): void {
    event.stopPropagation();
    this.expandedGroups[group] = !this.expandedGroups[group];
  }

  downloadDataset(format: 'txt' | 'json' | 'csv'): void {
    const fileMap = {
      txt: { filename: 'palma_dataset_1.0.txt', path: 'assets/data/dataset.txt', type: 'text/plain' },
      json: { filename: 'palma_dataset_1.0.json', path: 'assets/data/dataset.json', type: 'application/json' },
      csv: { filename: 'palma_dataset_1.0.csv', path: 'assets/data/dataset.csv', type: 'text/csv' }
    };

    const file = fileMap[format];
    
    this.http.get(file.path, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.filename;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error(`Error downloading ${format} file:`, error);
        // Fallback: try to fetch and create blob manually
        this.downloadDatasetFallback(format);
      }
    });
  }

  private downloadDatasetFallback(format: 'txt' | 'json' | 'csv'): void {
    const fileMap = {
      txt: { filename: 'palma_dataset_1.0.txt', path: 'assets/data/dataset.txt', type: 'text/plain' },
      json: { filename: 'palma_dataset_1.0.json', path: 'assets/data/dataset.json', type: 'application/json' },
      csv: { filename: 'palma_dataset_1.0.csv', path: 'assets/data/dataset.csv', type: 'text/csv' }
    };

    const file = fileMap[format];
    
    this.http.get(file.path, { responseType: 'text' }).subscribe({
      next: (data) => {
        const blob = new Blob([data], { type: file.type });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.filename;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error(`Error downloading ${format} file:`, error);
        alert(`Sorry, the ${format.toUpperCase()} file is not available for download at the moment.`);
      }
    });
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
    
    // Auto-hide after 2 seconds
    this.toastTimer = setTimeout(() => {
      this.toast = {
        show: false,
        message: ''
      };
      this.toastTimer = null;
    }, 2000);
  }
}