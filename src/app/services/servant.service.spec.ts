import { TestBed } from '@angular/core/testing';

import { ServantService } from './servant.service';

describe('ServantService', () => {
  let service: ServantService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ServantService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
