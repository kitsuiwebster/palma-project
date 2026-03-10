import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SeoService } from '../../core/services/seo.service';

@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './privacy.component.html',
  styleUrl: './privacy.component.scss'
})
export class PrivacyComponent implements OnInit {
  currentDate = new Date();

  constructor(private seoService: SeoService) {}

  ngOnInit(): void {
    this.seoService.update({
      title: 'Privacy Policy',
      description: 'Privacy policy for Palm Encyclopedia. Learn how we handle your data and protect your privacy.',
    });
  }
}
