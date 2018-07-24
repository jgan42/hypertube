import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'duration'
})
export class DurationPipe implements PipeTransform {

  transform(value: number): string {
    value = Math.floor(value || 0);
    let minutes: number = Math.floor(value / 60);
    const hours = minutes > 59 ? Math.floor(minutes / 60) + ':' : '';
    minutes = minutes % 60;
    return hours + minutes.toString().padStart(2, '0') + ':' +
      (value % 60).toString().padStart(2, '0');
  }

}
