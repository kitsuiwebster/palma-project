// src/app/features/palms/pages/palm-list/palm-list.component.ts
import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { DataService, PalmTrait } from '../../../../core/services/data.service';
import { SearchBarComponent } from '../../../../shared/components/search-bar/search-bar.component';
import { PalmCardComponent } from '../../../../shared/components/palm-card/palm-card.component';
import { RouterModule } from '@angular/router';
import { SlugifyPipe } from '../../../../shared/pipes/slugify.pipe';
import { CommonModule } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import {
  MatButton,
  MatIconButton,
} from '@angular/material/button';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import {
  MatExpansionPanel,
  MatExpansionPanelHeader,
  MatAccordion,
} from '@angular/material/expansion';
import { MatNavList, MatListItem } from '@angular/material/list';
import { MatExpansionPanelTitle } from '@angular/material/expansion';
import { SortPipe } from '../../../../shared/pipes/sort.pipe';


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
    MatIcon,
    MatButton,
    MatIconButton,
    MatProgressSpinner,
    MatAccordion,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatNavList,
    MatListItem,
    MatExpansionPanelTitle,
    SortPipe,
  ],
})
export class PalmListComponent implements OnInit {
  palms$: Observable<PalmTrait[]>;
  palmsByGenus$: Observable<{ [genus: string]: PalmTrait[] }>;
  viewMode = 'grid'; // 'grid' or 'list'
  loading = true;
  error = false;
  protected Object = Object;

  constructor(private dataService: DataService) {
    this.palms$ = this.dataService.getAllPalms();
    this.palmsByGenus$ = this.dataService.getPalmsByGenus();
  }

  ngOnInit(): void {
    this.palms$.subscribe({
      next: () => (this.loading = false),
      error: () => {
        this.loading = false;
        this.error = true;
      },
    });
  }

  toggleView(mode: string): void {
    this.viewMode = mode;
  }
}
