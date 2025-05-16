// src/app/app.component.ts
import { Component, OnInit } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HeaderComponent } from './core/components/header/header.component';
import { FooterComponent } from './core/components/footer/footer.component';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [HeaderComponent, FooterComponent, RouterOutlet],
})
export class AppComponent implements OnInit {
  title = 'Palm Encyclopedia';

  constructor(
    private swUpdate: SwUpdate,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Check for service worker updates (PWA)
    if (this.swUpdate.isEnabled) {
      this.swUpdate.versionUpdates.subscribe(() => {
        const snackBarRef = this.snackBar.open(
          'A new version of the app is available',
          'Update',
          { duration: 6000 }
        );
        
        snackBarRef.onAction().subscribe(() => {
          window.location.reload();
        });
      });
    }
  }
}