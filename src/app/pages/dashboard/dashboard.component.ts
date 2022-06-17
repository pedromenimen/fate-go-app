import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { ServantService } from '../../services/servant.service';
import { SimpleServant } from '../../types/servant-type';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  searchValue = new FormControl();
  options: SimpleServant[] = [];
  filteredOptions!: Observable<SimpleServant[]>;
  constructor(private servantService: ServantService) {
    this.servantService.getServantList().subscribe({
      next: (servantList) =>
        (this.options = servantList.filter(
          (servant) => servant.type.toLowerCase() !== 'enemycollectiondetail'
        )),
      error: (err: Error) => console.log(err),
      complete: () => {
        this.filteredOptions = this.searchValue.valueChanges.pipe(
          startWith(''),
          map((name) => this._filter(name))
        );
      },
    });
  }

  ngOnInit() {}

  displayFn(user: SimpleServant): string {
    return user && user.name ? user.name : '';
  }

  private _filter(name: string): SimpleServant[] {
    const filterValue = name.toLowerCase();

    return this.options.filter((option) =>
      option.name.toLowerCase().includes(filterValue)
    );
  }
}
