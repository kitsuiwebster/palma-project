import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription, Observable } from 'rxjs';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { CookieConsentService, CookieConsent } from '../../../core/services/cookie-consent.service';

@Component({
  selector: 'app-cookie-consent',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './cookie-consent.component.html',
  styleUrl: './cookie-consent.component.scss',
  animations: [
    trigger('slideIn', [
      state('void', style({ transform: 'translateY(100%)', opacity: 0 })),
      state('*', style({ transform: 'translateY(0)', opacity: 1 })),
      transition('void => *', animate('300ms ease-out')),
      transition('* => void', animate('200ms ease-in'))
    ])
  ]
})
export class CookieConsentComponent implements OnInit, OnDestroy {
  showBanner$!: Observable<boolean>;
  showAdvanced = false;
  
  preferences = {
    analytics: false,
    marketing: false,
    preferences: false
  };
  
  private subscription = new Subscription();

  constructor(private cookieConsentService: CookieConsentService) {
    this.showBanner$ = this.cookieConsentService.showBanner$;
  }

  ngOnInit(): void {
    // Initialize preferences with current consent if available
    const currentConsent = this.cookieConsentService.getCurrentConsent();
    if (currentConsent) {
      this.preferences = {
        analytics: currentConsent.analytics,
        marketing: currentConsent.marketing,
        preferences: currentConsent.preferences
      };
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  acceptAll(): void {
    this.cookieConsentService.acceptAll();
    this.showAdvanced = false;
  }

  acceptEssentialOnly(): void {
    this.cookieConsentService.acceptEssentialOnly();
    this.showAdvanced = false;
  }

  showAdvancedOptions(): void {
    this.showAdvanced = true;
  }

  closeAdvanced(): void {
    this.showAdvanced = false;
  }

  saveCustomPreferences(): void {
    this.cookieConsentService.saveCustomConsent(this.preferences);
    this.showAdvanced = false;
  }

  resetConsent(): void {
    this.cookieConsentService.resetConsent();
    this.showAdvanced = false;
    // Reset preferences to defaults
    this.preferences = {
      analytics: false,
      marketing: false,
      preferences: false
    };
  }
}
