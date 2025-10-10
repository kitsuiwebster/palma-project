// src/app/shared/components/paginator/paginator.component.ts
import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-paginator',
  templateUrl: './paginator.component.html',
  styleUrls: ['./paginator.component.scss'],
  standalone: true,
  imports: [CommonModule, MatButtonModule, FormsModule]
})
export class PaginatorComponent implements OnChanges, OnInit {
  @Input() length = 0;
  @Input() pageSize = 20;
  @Input() pageSizeOptions: number[] = [10, 20, 50, 100];
  @Input() pageIndex = 0;
  @Output() page = new EventEmitter<{
    pageIndex: number;
    pageSize: number;
    length: number;
  }>();

  // Utilisé pour le dropdown
  internalPageSize = 20;

  ngOnInit(): void {
    // Forcer la valeur initiale à 20
    this.internalPageSize = 20;
    this.pageSize = 20;
    
    // Émettre l'événement initial avec pageSize=20
    setTimeout(() => {
      this.emitPageEvent();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Si c'est le premier changement, forcer à 20
    if (changes['pageSize'] && changes['pageSize'].firstChange) {
      this.internalPageSize = 20;
      this.pageSize = 20;
      
      setTimeout(() => {
        this.emitPageEvent();
      });
    } 
    // Si pageSize change depuis le composant parent, mettre à jour internalPageSize
    else if (changes['pageSize'] && !changes['pageSize'].firstChange) {
      this.internalPageSize = changes['pageSize'].currentValue;
    }
  }

  get totalPages(): number {
    return Math.ceil(this.length / this.pageSize);
  }

  get pages(): number[] {
    const totalPages = this.totalPages;
    const currentPage = this.pageIndex;
    
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i);
    }

    if (currentPage < 4) {
      return [0, 1, 2, 3, 4, -1, totalPages - 1];
    } else if (currentPage > totalPages - 5) {
      return [0, -1, totalPages - 5, totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1];
    } else {
      return [0, -1, currentPage - 1, currentPage, currentPage + 1, -1, totalPages - 1];
    }
  }

  get showFirstLastButtons(): boolean {
    return this.totalPages > 7;
  }

  get showPrevNextButtons(): boolean {
    return this.totalPages > 1;
  }

  get rangeLabel(): string {
    if (this.length === 0) {
      return '0 of 0';
    }
    const start = this.pageIndex * this.pageSize + 1;
    const end = Math.min((this.pageIndex + 1) * this.pageSize, this.length);
    return `${start} - ${end} of ${this.length}`;
  }

  changePage(newPage: number): void {
    if (newPage >= 0 && newPage < this.totalPages && newPage !== this.pageIndex) {
      this.pageIndex = newPage;
      this.emitPageEvent();
    }
  }

  changePageSize(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const newPageSize = Number(selectElement.value);
    
    // Mettre à jour les deux valeurs
    this.pageSize = newPageSize;
    this.internalPageSize = newPageSize;
    
    // Ajustement de l'index de page pour maintenir à peu près la même position
    const firstItemOnCurrentPage = this.pageIndex * this.pageSize;
    this.pageIndex = Math.floor(firstItemOnCurrentPage / this.pageSize);
    
    this.emitPageEvent();
  }

  private emitPageEvent(): void {
    this.page.emit({
      pageIndex: this.pageIndex,
      pageSize: this.pageSize,
      length: this.length
    });
  }
}