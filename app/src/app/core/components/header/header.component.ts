// src/app/core/components/header/header.component.ts
import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive
  ],
})
export class HeaderComponent {
  isMenuOpen = false;
  isInfoMenuOpen = false;

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
    if (this.isMenuOpen) {
      this.isInfoMenuOpen = false;
    }
  }

  toggleInfoMenu(): void {
    this.isInfoMenuOpen = !this.isInfoMenuOpen;
  }

  closeInfoMenu(): void {
    this.isInfoMenuOpen = false;
  }

  // Fermer le menu info si on clique ailleurs
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const infoButton = document.querySelector('.info-button');
    const infoMenu = document.querySelector('.info-menu');
    
    if (this.isInfoMenuOpen && 
        infoButton && 
        infoMenu && 
        !infoButton.contains(event.target as Node) && 
        !infoMenu.contains(event.target as Node)) {
      this.isInfoMenuOpen = false;
    }
  }
}