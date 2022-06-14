import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { UtilsService } from './../../../utils/utils.service';

@Component({
  selector: 'app-accordion',
  templateUrl: './accordion.component.html',
  styleUrls: ['./accordion.component.css'],
})
export class AccordionComponent implements OnInit {
  @Input() detailedServant: any;
  @Input() detailedServantEnglish: any;
  appendSkillLevelControl = new FormControl();
  appendSkillLevel: Array<string> = ['', '', ''];
  appendSkillModifyer: Array<number> = [300, 1000, 200];
  appendDefaultLevel: Array<number> = [0, 0, 0];
  options: Array<number> = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  activeSkills: Array<any> = [];
  appendSelect!: FormGroup;
  constructor(private utilsService: UtilsService) {}
  ngOnInit(): void {}
  ngOnChanges() {
    if (this.detailedServant.id && this.detailedServantEnglish.id) {
      const activeSkills = this.utilsService.getServantSkills(
        this.detailedServant,
        this.detailedServantEnglish
      );
      console.log(activeSkills);
      this.activeSkills = activeSkills;
    }
  }

  changeSkillLevel(index: number) {
    this.appendSkillLevel[index] = this.appendSkillLevelControl.value;
    this.appendSkillModifyer[index] =
      this.detailedServant.appendPassive[index].skill.functions[0].svals[
        this.appendSkillLevel[index]
      ].Value;
  }
  getEnglishInfo() {
    if (this.detailedServantEnglish) {
      return this.detailedServantEnglish;
    } else {
      return this.detailedServant;
    }
  }

  scrollEvent() {
    console.log();
  }

  skillDetail(skillDetail: string, index: number) {
    if (skillDetail.includes('30%')) {
      return skillDetail.replace(
        '30%',
        `${this.appendSkillModifyer[index] / 10}%`
      );
    }
    if (skillDetail.includes('10%')) {
      return skillDetail.replace(
        '10%',
        `${this.appendSkillModifyer[index] / 100}%`
      );
    } else {
      return skillDetail.replace(
        '20%',
        `${this.appendSkillModifyer[index] / 10}%`
      );
    }
  }
}
