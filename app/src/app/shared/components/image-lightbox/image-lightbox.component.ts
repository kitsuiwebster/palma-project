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
  @Input() imageUrls: string[] = [];
  @Input() currentIndex: number = 0;
  @Output() close = new EventEmitter<void>();
  @Output() indexChange = new EventEmitter<number>();

  photoCredit: PhotoCredit | null = null;
  isLoading: boolean = false;
  imageLoading: boolean = true;

  constructor(private photoCreditsService: PhotoCreditsService) {}

  ngOnInit() {
    if (this.imageUrl && this.speciesName) {
      this.loadPhotoCredit();
    }
  }

  ngOnChanges() {
    if (this.isVisible && (this.imageUrl || this.imageUrls.length > 0) && this.speciesName) {
      this.imageLoading = true;
      this.loadPhotoCredit();
    }
  }

  get currentImageUrl(): string {
    return this.imageUrls.length > 0 ? this.imageUrls[this.currentIndex] : this.imageUrl;
  }

  get canNavigatePrevious(): boolean {
    return this.imageUrls.length > 1 && this.currentIndex > 0;
  }

  get canNavigateNext(): boolean {
    return this.imageUrls.length > 1 && this.currentIndex < this.imageUrls.length - 1;
  }

  previousImage() {
    if (this.canNavigatePrevious && !this.imageLoading) {
      this.imageLoading = true;
      const newIndex = this.currentIndex - 1;
      this.indexChange.emit(newIndex);
      // Reload photo credit for new image with debounce
      setTimeout(() => {
        if (!this.imageLoading) { // Only load if image has finished loading
          this.loadPhotoCredit();
        }
      }, 200);
    }
  }

  nextImage() {
    if (this.canNavigateNext && !this.imageLoading) {
      this.imageLoading = true;
      const newIndex = this.currentIndex + 1;
      this.indexChange.emit(newIndex);
      // Reload photo credit for new image with debounce
      setTimeout(() => {
        if (!this.imageLoading) { // Only load if image has finished loading
          this.loadPhotoCredit();
        }
      }, 200);
    }
  }

  onImageLoad() {
    this.imageLoading = false;
    // Load photo credits once image is loaded
    if (this.isVisible) {
      this.loadPhotoCredit();
    }
  }

  onImageError() {
    this.imageLoading = false;
    this.onClose();
  }

  loadPhotoCredit() {
    if (this.isLoading) return; // Prevent multiple simultaneous requests
    
    this.isLoading = true;
    this.photoCreditsService.getPhotoCredits().subscribe({
      next: (credits) => {
        // Find credit for this specific image and species
        const currentUrl = this.currentImageUrl;
        this.photoCredit = credits.find(credit => 
          credit.photoUrl === currentUrl && 
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
    const imageUrl = this.currentImageUrl || this.imageUrl;
    if (!imageUrl) return;
    
    // Create a temporary link to download the image
    const link = document.createElement('a');
    link.href = imageUrl;
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
    if (!this.isVisible) return;
    
    switch (event.key) {
      case 'Escape':
        this.onClose();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        this.previousImage();
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.nextImage();
        break;
    }
  }

  ngOnDestroy() {
    // Clean up when component is destroyed
  }
}