// src/app/shared/pipes/slugify.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'slugify',
  standalone: true,
})
export class SlugifyPipe implements PipeTransform {
  transform(input: string): string {
    if (!input) {
      return '';
    }

    // Convert to lowercase, replace spaces with hyphens, remove special characters
    return input
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  }
}


