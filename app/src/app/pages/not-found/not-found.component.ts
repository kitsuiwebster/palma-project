import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SeoService } from '../../core/services/seo.service';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="not-found-container">
      <div class="not-found-content">
        <h1>404</h1>
        <h2>Page Not Found</h2>
        <p>The page you're looking for doesn't exist or has been moved.</p>
        <div class="not-found-actions">
          <a routerLink="/palms" class="btn-primary">Browse Palm Species</a>
          <a routerLink="/" class="btn-outline">Go Home</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .not-found-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 60vh;
      padding: 2rem;
      text-align: center;
    }
    .not-found-content h1 {
      font-size: 6rem;
      font-weight: 800;
      color: #1976d2;
      margin: 0;
      line-height: 1;
    }
    .not-found-content h2 {
      font-size: 1.5rem;
      color: #333;
      margin: 0.5rem 0 1rem;
    }
    .not-found-content p {
      color: #666;
      margin-bottom: 2rem;
    }
    .not-found-actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
    }
    .btn-primary, .btn-outline {
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      transition: all 0.2s;
    }
    .btn-primary {
      background: #1976d2;
      color: white;
    }
    .btn-primary:hover { background: #1565c0; }
    .btn-outline {
      border: 2px solid #1976d2;
      color: #1976d2;
    }
    .btn-outline:hover {
      background: #1976d2;
      color: white;
    }
  `]
})
export class NotFoundComponent implements OnInit {
  constructor(private seoService: SeoService) {}

  ngOnInit(): void {
    this.seoService.update({
      title: 'Page Not Found (404)',
      description: 'The page you are looking for could not be found. Browse our encyclopedia of over 2,500 palm species.',
    });
  }
}
