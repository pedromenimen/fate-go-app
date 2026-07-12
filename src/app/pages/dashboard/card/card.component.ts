import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { SimpleServant } from '../../../types/servant-type';

@Component({
    selector: 'app-card',
    templateUrl: './card.component.html',
    styleUrls: ['./card.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class CardComponent {
  @Input() filteredServantList: SimpleServant[] = [];
  loadedImages = new Set<number>();

  onImageLoad(collectionNo: number): void {
    this.loadedImages.add(collectionNo);
  }

  isImageLoaded(collectionNo: number): boolean {
    return this.loadedImages.has(collectionNo);
  }
}
