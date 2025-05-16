import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatCommonNames',
  standalone: true
})
export class FormatCommonNamesPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '';

    if (!value) return '';

    // Ensure space after every comma and capitalize the first letter after each comma and at the start
    return value
      .replace(/,(\S)/g, ', $1') // Ensure space after comma
      .replace(/(?:^|,\s+)(\w)/g, (match, firstChar) => match.replace(firstChar, firstChar.toUpperCase())); // Capitalize after comma and at start
  }
}