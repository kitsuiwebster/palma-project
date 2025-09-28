import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  standalone: true,
  imports: [RouterLink, RouterLinkActive]
})
export class FooterComponent implements OnInit, OnDestroy {
  currentYear = new Date().getFullYear();
  currentQuote = 0;
  private quoteInterval: any;

  ngOnInit() {
    this.startQuoteRotation();
  }

  ngOnDestroy() {
    if (this.quoteInterval) {
      clearInterval(this.quoteInterval);
    }
  }

  private startQuoteRotation() {
    this.quoteInterval = setInterval(() => {
      this.currentQuote = (this.currentQuote + 1) % 7;
      this.updateQuoteDisplay();
    }, 8000);
  }

  private updateQuoteDisplay() {
    const items = document.querySelectorAll('.quote-item');
    const indicators = document.querySelectorAll('.indicator');
    
    items.forEach((item, index) => {
      item.classList.toggle('active', index === this.currentQuote);
    });
    
    indicators.forEach((indicator, index) => {
      indicator.classList.toggle('active', index === this.currentQuote);
    });
  }

  setCurrentQuote(index: number) {
    this.currentQuote = index;
    this.updateQuoteDisplay();
  }
}