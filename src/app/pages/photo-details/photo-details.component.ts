import { Component, input } from '@angular/core';

@Component({
  selector: 'app-photo-details',
  imports: [],
  templateUrl: './photo-details.component.html',
  styleUrl: './photo-details.component.scss'
})
export class PhotoDetailsComponent {
  readonly id = input<string>();
}

