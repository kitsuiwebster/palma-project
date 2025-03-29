// src/app/features/palms/pages/palm-detail/palm-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Observable, of, switchMap, catchError } from 'rxjs';
import { DataService, PalmTrait } from '../../../../core/services/data.service';
import { Title, Meta } from '@angular/platform-browser';
import { ConservationClassPipe } from '../../../../shared/pipes/conservation-class.pipe';
import { CommonModule } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatDivider } from '@angular/material/divider';
import { MatTabGroup, MatTab } from '@angular/material/tabs';

@Component({
  selector: 'app-palm-detail',
  templateUrl: './palm-detail.component.html',
  styleUrls: ['./palm-detail.component.scss'],
  standalone: true,
  imports: [
    ConservationClassPipe,
    RouterModule,
    CommonModule,
    MatIcon,
    MatButton,
    MatIconButton,
    MatProgressSpinner,
    MatDivider,
    MatTabGroup,
    MatTab,
  ],
})
export class PalmDetailComponent implements OnInit {
  palm$: Observable<PalmTrait | undefined>;
  loading = true;
  error = false;
  notFound = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dataService: DataService,
    private titleService: Title,
    private metaService: Meta
  ) {
    this.palm$ = of(undefined);
  }

  ngOnInit(): void {
    this.palm$ = this.route.paramMap.pipe(
      switchMap((params) => {
        const speciesSlug = params.get('species') || '';
        const speciesName = speciesSlug.split('-').join(' ');
        this.loading = true;

        return this.dataService.getPalmBySpecies(speciesName).pipe(
          catchError((error) => {
            console.error('Error fetching palm details:', error);
            this.loading = false;
            this.error = true;
            return of(undefined);
          })
        );
      })
    );

    this.palm$.subscribe((palm) => {
      this.loading = false;

      if (!palm) {
        this.notFound = true;
        this.titleService.setTitle('Palm Not Found - Palm Encyclopedia');
        return;
      }

      // Set page title and meta for SEO
      this.titleService.setTitle(`${palm.species} - Palm Encyclopedia`);
      this.metaService.updateTag({
        name: 'description',
        content: `Learn about ${palm.species}, a palm species from the ${palm.genus} genus native to ${palm.distribution}.`,
      });
    });
  }
}
