// src/app/app.component.ts
import { Component, OnInit } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, NavigationEnd } from '@angular/router';
import { HeaderComponent } from './core/components/header/header.component';
import { FooterComponent } from './core/components/footer/footer.component';
import { CookieConsentComponent } from './shared/components/cookie-consent/cookie-consent.component';
import { RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [HeaderComponent, FooterComponent, CookieConsentComponent, RouterOutlet],
})
export class AppComponent implements OnInit {
  title = 'Palm Encyclopedia';
  isFullWidthPage = false;
  isAboutPage = false;

  constructor(
    private swUpdate: SwUpdate,
    private snackBar: MatSnackBar,
    private router: Router
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

    // Check initial route
    this.checkCurrentRoute();

    // Detect route changes to apply full-width for home page
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        const currentUrl = event.urlAfterRedirects;
        this.isFullWidthPage = currentUrl === '/' || currentUrl === '/home';
        this.isAboutPage = currentUrl === '/about';

        // Scroll to top on every navigation
        window.scrollTo({ top: 0, left: 0 });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;

        // Disable scroll only on home page
        const isHomePage = currentUrl === '/' || currentUrl === '/home';
        if (isHomePage) {
          document.body.classList.add('no-scroll');
        } else {
          document.body.classList.remove('no-scroll');
        }
      });
  }

  private checkCurrentRoute(): void {
    const currentUrl = this.router.url;
    this.isFullWidthPage = currentUrl === '/' || currentUrl === '/home';
    this.isAboutPage = currentUrl === '/about';
    this.updateBodyClass();
  }

  private updateBodyClass(): void {
    // Disable scroll only on home page (not about page)
    const isHomePage = this.router.url === '/' || this.router.url === '/home';
    if (isHomePage) {
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }
  }
}