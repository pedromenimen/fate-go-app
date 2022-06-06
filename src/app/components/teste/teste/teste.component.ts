import { startWith } from 'rxjs/operators';
import { ServantService } from '../../../services/servant.service';
import { Servant } from '../../../types/servant-type';
import { FormControl } from '@angular/forms';
import { Component, OnInit } from '@angular/core';

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
      complete: () => "",
    });
    console.log(
      this.filterControl.valueChanges.pipe(startWith("a"))
      // this.filterControl.valueChanges.subscribe({
      //   next: (inputText: string) => {
      //     this.filteredServantList = this.servantList.filter((servant) =>
      //       servant.name.toLowerCase().includes(inputText.toLowerCase())
      //     );
      //     console.log(this.filteredServantList);
        // },
      // })
    );
  }
}
