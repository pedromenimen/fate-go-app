import { Observable } from 'rxjs';
import { Component, Input, OnInit } from '@angular/core';
import { Servant } from '../../../types/servant-type';

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.css']
})
export class CardComponent implements OnInit {
  @Input() filteredServantList!: Observable<Servant[]>
  
  constructor() { }

  ngOnInit(): void {
  }

}
