import { Component, OnInit, TemplateRef, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ServantService } from 'src/app/services/servant.service';
import { DetailedServant } from './../../types/servant-type';
import { UtilsService } from './../../utils/utils.service';

@Component({
    selector: 'app-servant-details',
    templateUrl: './servant-details.component.html',
    styleUrls: ['./servant-details.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ServantDetailsComponent implements OnInit {
  servantId: number = 0;
  servantDetailedInfo!: DetailedServant;
  servantImages!: Array<string> | Array<unknown>;
  costumeNames: string[] = [];
  servantDetailedEnglishInfo!: DetailedServant;
  immersiveMode: boolean = false;
  loadingInfo: boolean = true;
  loadingEnglish: boolean = true;

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
      error: (err) => {
        console.log(err);
        this.loadingInfo = false;
      },
      complete: () => {
        this.costumeNames = this.utilsService.getCostumeNames(
          this.servantDetailedInfo
        );
        this.servantImages = this.utilsService.getServantImages(
          this.servantDetailedInfo
        );
        this.loadingInfo = false;
      },
    });
    this.servantService.getDetailedInfoEnglish(this.servantId).subscribe({
      next: (servantInfo) => {
        this.servantDetailedEnglishInfo = servantInfo;
        this.loadingEnglish = false;
      },
      error: (err) => {
        console.log(err);
        this.loadingEnglish = false;
      },
      complete: () => {
        this.loadingEnglish = false;
      },
    });
  }
  openVerticallyCentered(content: TemplateRef<any>) {
    this.immersiveMode = false;
    this.modalService.open(content, { size: 'lg' });
  }
  toggleImmersiveMode() {
    this.immersiveMode = !this.immersiveMode;
  }
  popoverFunc(i: number) {
    if (i <= 3) {
      return `Stage ${i + 1}`;
    } else {
      return `${this.costumeNames[i - 4]}`;
    }
  }
}
