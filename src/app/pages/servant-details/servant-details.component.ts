import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ServantService } from 'src/app/services/servant.service';
import { UtilsService } from './../../utils/utils.service';

@Component({
  selector: 'app-servant-details',
  templateUrl: './servant-details.component.html',
  styleUrls: ['./servant-details.component.css'],
})
export class ServantDetailsComponent implements OnInit {
  servantId: number = 0;
  servantDetailedInfo: any = {};
  servantImages: any = [];
  costumeNames: string[] = [];
  servantDetailedEnglishInfo: any | false = {};

  constructor(
    private servantService: ServantService,
    private route: ActivatedRoute,
    private utilsService: UtilsService,
    private modalService: NgbModal
  ) {}
  ngOnInit(): void {
    this.route.params.subscribe({
      next: (param) => (this.servantId = param['id']),
      error: (err) => console.log(err),
    });
    this.servantService.getDetailedSevantInfo(this.servantId).subscribe({
      next: (servantInfo) => (this.servantDetailedInfo = servantInfo),
      error: (err) => console.log(err),
      complete: () => {
        this.costumeNames = this.utilsService.getCostumeNames(
          this.servantDetailedInfo
        );
        this.servantImages = this.utilsService.getServantImages(
          this.servantDetailedInfo
        );
      },
    });
    this.servantService.getDetailedInfoEnglish(this.servantId).subscribe({
      next: (servantInfo) => (this.servantDetailedEnglishInfo = servantInfo),
      error: (err) => {
        console.log(err);
        this.servantDetailedEnglishInfo = { skill: [] };
      },
      complete: () => {},
    });
  }
  openVerticallyCentered(content: any) {
    this.modalService.open(content, { size: 'lg' });
  }
  popoverFunc(i: number) {
    if (i <= 3) {
      return `Stage ${i + 1}`;
    } else {
      return `${this.costumeNames[i - 4]}`;
    }
  }
}
