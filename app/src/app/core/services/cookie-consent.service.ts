import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface CookieConsent {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
  timestamp: number;
  version: string;
}

@Injectable({
  providedIn: 'root'
})
export class CookieConsentService {
  private readonly CONSENT_KEY = 'palma_cookie_consent';
  private readonly CONSENT_VERSION = '1.0';
  
  private consentSubject = new BehaviorSubject<CookieConsent | null>(null);
  public consent$: Observable<CookieConsent | null> = this.consentSubject.asObservable();
  
  private showBannerSubject = new BehaviorSubject<boolean>(false);
  public showBanner$: Observable<boolean> = this.showBannerSubject.asObservable();

  constructor() {
    this.initializeConsent();
  }

  private initializeConsent(): void {
    const storedConsent = this.getStoredConsent();
    
    if (storedConsent && storedConsent.version === this.CONSENT_VERSION) {
      // User has already given consent for this version
      this.consentSubject.next(storedConsent);
      this.showBannerSubject.next(false);
    } else {
      // No consent or outdated version - show banner
      this.showBannerSubject.next(true);
    }
  }

  private getStoredConsent(): CookieConsent | null {
    try {
      const stored = localStorage.getItem(this.CONSENT_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  /**
   * Accept all cookies
   */
  acceptAll(): void {
    const consent: CookieConsent = {
      essential: true,
      analytics: true,
      marketing: true,
      preferences: true,
      timestamp: Date.now(),
      version: this.CONSENT_VERSION
    };
    
    this.saveConsent(consent);
  }

  /**
   * Accept only essential cookies
   */
  acceptEssentialOnly(): void {
    const consent: CookieConsent = {
      essential: true,
      analytics: false,
      marketing: false,
      preferences: false,
      timestamp: Date.now(),
      version: this.CONSENT_VERSION
    };
    
    this.saveConsent(consent);
  }

  /**
   * Save custom consent preferences
   */
  saveCustomConsent(preferences: Partial<CookieConsent>): void {
    const consent: CookieConsent = {
      essential: true, // Always required
      analytics: preferences.analytics ?? false,
      marketing: preferences.marketing ?? false,
      preferences: preferences.preferences ?? false,
      timestamp: Date.now(),
      version: this.CONSENT_VERSION
    };
    
    this.saveConsent(consent);
  }

  private saveConsent(consent: CookieConsent): void {
    try {
      localStorage.setItem(this.CONSENT_KEY, JSON.stringify(consent));
      this.consentSubject.next(consent);
      this.showBannerSubject.next(false);
      
      // Clean up non-essential cookies if not consented
      this.enforceCookiePolicy(consent);
    } catch (error) {
      console.error('Failed to save cookie consent:', error);
    }
  }

  private enforceCookiePolicy(consent: CookieConsent): void {
    // Clean up cookies based on consent
    if (!consent.analytics) {
      this.removeCookiesByCategory('analytics');
    }
    
    if (!consent.marketing) {
      this.removeCookiesByCategory('marketing');
    }
    
    if (!consent.preferences) {
      this.removeCookiesByCategory('preferences');
    }
  }

  private removeCookiesByCategory(category: string): void {
    // Remove cookies by category (implement based on your specific cookies)
    const cookiesToRemove: { [key: string]: string[] } = {
      analytics: ['_ga', '_gid', '_gat', '_gtag'],
      marketing: ['_fbp', '_fbc', 'fr'],
      preferences: ['user_theme', 'search_preferences']
    };

    const cookies = cookiesToRemove[category] || [];
    cookies.forEach(cookieName => {
      this.deleteCookie(cookieName);
    });
  }

  private deleteCookie(name: string): void {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`;
  }

  /**
   * Check if a specific cookie category is consented
   */
  hasConsent(category: 'essential' | 'analytics' | 'marketing' | 'preferences'): boolean {
    const consent = this.consentSubject.value;
    return consent ? consent[category] : false;
  }

  /**
   * Get current consent status
   */
  getCurrentConsent(): CookieConsent | null {
    return this.consentSubject.value;
  }

  /**
   * Reset consent (for testing or user request)
   */
  resetConsent(): void {
    try {
      localStorage.removeItem(this.CONSENT_KEY);
      this.consentSubject.next(null);
      this.showBannerSubject.next(true);
      
      // Remove all non-essential cookies
      this.removeCookiesByCategory('analytics');
      this.removeCookiesByCategory('marketing');
      this.removeCookiesByCategory('preferences');
    } catch (error) {
      console.error('Failed to reset consent:', error);
    }
  }

  /**
   * Show the consent banner again
   */
  showConsentBanner(): void {
    this.showBannerSubject.next(true);
  }

  /**
   * Hide the consent banner
   */
  hideConsentBanner(): void {
    this.showBannerSubject.next(false);
  }

  /**
   * Check if consent is required (GDPR compliance)
   */
  isConsentRequired(): boolean {
    // You can implement geo-location logic here if needed
    // For now, we'll require consent for all users
    return true;
  }

  /**
   * Get consent age in days
   */
  getConsentAge(): number | null {
    const consent = this.getCurrentConsent();
    if (!consent) return null;
    
    const ageMs = Date.now() - consent.timestamp;
    return Math.floor(ageMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if consent needs refresh (older than 365 days)
   */
  needsConsentRefresh(): boolean {
    const age = this.getConsentAge();
    return age !== null && age > 365;
  }
}