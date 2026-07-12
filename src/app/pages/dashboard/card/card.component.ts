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
  @Input() loading = false;
  @Input() skeletonCount = 20;

  loadedImages = new Set<number>();

  get skeletonArray(): number[] {
    return Array.from({ length: this.skeletonCount }, (_, i) => i);
  }

  onImageLoad(collectionNo: number): void {
    this.loadedImages.add(collectionNo);
  }

  isImageLoaded(collectionNo: number): boolean {
    return this.loadedImages.has(collectionNo);
  }
}
