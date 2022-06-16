import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ServantService } from '../../../services/servant.service';
import { Servant } from '../../../types/servant-type';

@Component({
  selector: 'app-teste',
  templateUrl: './teste.component.html',
  styleUrls: ['./teste.component.css'],
})
export class TesteComponent implements OnInit {
  filterControl = new FormControl('aza');
  servantList: Servant[] = [];
  filteredServantList: Servant[] = [];

  constructor(private servantService: ServantService) {}
  ngOnInit(): void {
    this.servantService.getServantList().subscribe({
      next: (servantList) => (this.servantList = servantList),
      error: (error) => console.log(error),
      complete: () => '',
    });
  }
}
