import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServantDetailsComponent } from './servant-details.component';

describe('ServantDetailsComponent', () => {
  let component: ServantDetailsComponent;
  let fixture: ComponentFixture<ServantDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ServantDetailsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ServantDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
