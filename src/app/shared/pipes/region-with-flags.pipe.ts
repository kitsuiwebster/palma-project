import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { FlagService } from '../../core/services/flag.service';

@Pipe({
  name: 'regionWithFlags',
  pure: false,
  standalone: true
})
export class RegionWithFlagsPipe implements PipeTransform {
  private cache = new Map<string, string>();

  constructor(private sanitizer: DomSanitizer, private flagService: FlagService) {}

  transform(region: string): SafeHtml {
    if (!region) return '';

    if (this.cache.has(region)) {
      return this.sanitizer.bypassSecurityTrustHtml(this.cache.get(region)!);
    }

    let html = region;

    // Remove parentheses content for cleaner matching
    const noParens = region.replace(/\([^)]*\)/g, '');

    // Split on commas
    const parts = noParens.split(',');

    for (let part of parts) {
      let subParts = [part];

      if (part.includes(' to ')) {
        subParts = part.split(' to ').map(p => p.trim());
      } else if (part.includes(' and ')) {
        subParts = part.split(' and ').map(p => p.trim());
      } else if (part.includes(' & ')) {
        subParts = part.split(' & ').map(p => p.trim());
      }

      for (let subPart of subParts) {
        const cleaned = this.cleanRegionName(subPart);
        const flagUrl = this.flagService.getManualFlag(cleaned);
        if (flagUrl) {
          const flagImg = `<img src="${flagUrl}" class="flag-img" alt="${cleaned} flag"/>`;
          // Insert flag immediately after the subPart in the original string, globally
          const escaped = subPart.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(`(${escaped})`, 'g');
          html = html.replace(regex, `$1 ${flagImg}`);
        }
      }
    }

    this.cache.set(region, html);
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  private cleanRegionName(region: string): string {
    let r = region.trim();
    const prefixes = [
      'Pen.', 'N.', 'E.', 'W.', 'S.', 'NE.', 'NW.', 'SE.', 'SW.', 'C.', 'EC.', 'WC.', 'SC.', 'NC.',
      'Central', 'Eastern', 'Western', 'Northern', 'Southern'
    ];
    prefixes.forEach(prefix => {
      if (r.startsWith(prefix)) {
        r = r.substring(prefix.length).trim();
      }
    });
    return r;
  }
}