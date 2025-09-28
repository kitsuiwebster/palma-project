import { Component, Input, Output, EventEmitter, OnInit, OnChanges, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PhotoCreditsService, PhotoCredit } from '../../../core/services/photo-credits.service';

@Component({
  selector: 'app-image-lightbox',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './image-lightbox.component.html',
  styleUrl: './image-lightbox.component.scss'
})
export class ImageLightboxComponent implements OnInit, OnChanges, OnDestroy {
  @Input() imageUrl: string = '';
  @Input() speciesName: string = '';
  @Input() isVisible: boolean = false;
  @Output() close = new EventEmitter<void>();

  photoCredit: PhotoCredit | null = null;
  isLoading: boolean = false;

  constructor(private photoCreditsService: PhotoCreditsService) {}

  ngOnInit() {
    if (this.imageUrl && this.speciesName) {
      this.loadPhotoCredit();
    }
  }

  ngOnChanges() {
    if (this.isVisible && this.imageUrl && this.speciesName) {
      this.loadPhotoCredit();
    }
  }

  loadPhotoCredit() {
    this.isLoading = true;
    this.photoCreditsService.getPhotoCredits().subscribe({
      next: (credits) => {
        // Find credit for this specific image and species
        this.photoCredit = credits.find(credit => 
          credit.photoUrl === this.imageUrl && 
          credit.species.toLowerCase() === this.speciesName.toLowerCase()
        ) || null;
        this.isLoading = false;
      },
      error: () => {
        this.photoCredit = null;
        this.isLoading = false;
      }
    });
  }

  onClose() {
    this.close.emit();
  }

  onBackdropClick(event: Event) {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  downloadImage() {
    if (!this.imageUrl) return;
    
    // Create a temporary link to download the image
    const link = document.createElement('a');
    link.href = this.imageUrl;
    link.download = `${this.speciesName.replace(/\s+/g, '_')}_photo.jpg`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  getLicenseInfo() {
    if (!this.photoCredit) return null;
    
    const license = this.photoCredit.license;
    const licenseInfo: any = {
      name: license,
      warning: false,
      description: ''
    };

    // Add warnings for restrictive licenses
    if (license.includes('CC BY-NC') || license.includes('NonCommercial')) {
      licenseInfo.warning = true;
      licenseInfo.description = 'Non-commercial use only';
    } else if (license.includes('CC BY-SA')) {
      licenseInfo.description = 'Share alike required';
    } else if (license.includes('CC BY')) {
      licenseInfo.description = 'Attribution required';
    } else if (license.includes('CC0')) {
      licenseInfo.description = 'Public domain';
    }

    return licenseInfo;
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && this.isVisible) {
      this.onClose();
    }
  }

  ngOnDestroy() {
    // Clean up when component is destroyed
  }
}