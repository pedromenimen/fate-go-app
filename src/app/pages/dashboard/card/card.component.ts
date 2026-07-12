import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Observable } from 'rxjs';
import { SimpleServant } from '../../../types/servant-type';

@Component({
    selector: 'app-card',
    templateUrl: './card.component.html',
    styleUrls: ['./card.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class CardComponent implements OnInit {
  @Input() filteredServantList!: Observable<SimpleServant[]>;

  constructor() {}

  ngOnInit(): void {}
}
