// src/app/shared/pipes/conservation-class.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'conservationClass',
  standalone: true,
})
export class ConservationClassPipe implements PipeTransform {
  transform(status: string): string {
    if (!status) {
      return 'status-unknown';
    }

    const statusLower = status.toLowerCase();

    if (
      statusLower.includes('extinct') ||
      statusLower.includes('critically') ||
      statusLower.includes('endangered')
    ) {
      return 'status-endangered';
    } else if (
      statusLower.includes('vulnerable') ||
      statusLower.includes('near threatened')
    ) {
      return 'status-vulnerable';
    } else if (
      statusLower.includes('concern') ||
      statusLower.includes('safe')
    ) {
      return 'status-safe';
    } else {
      return 'status-unknown';
    }
  }
}

