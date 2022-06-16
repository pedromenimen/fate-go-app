import { Component, Input, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { UtilsService } from './../../../utils/utils.service';

@Component({
  selector: 'app-accordion',
  templateUrl: './accordion.component.html',
  styleUrls: ['./accordion.component.css'],
})
export class AccordionComponent implements OnInit {
  @Input() detailedServant: any;
  @Input() detailedServantEnglish: any;
  appendSkillLevelControl = new FormControl('0');
  activeSkillLevelControl = new FormControl('0');
  appendSkillLevel: Array<string> = [];
  activeSkillLevel: Array<string> = [];
  appendSkillModifyer: Array<number> = [300, 1000, 200];
  activeSkillModifyer: Array<number> = [];
  // appendDefaultLevel: Array<number> = [0, 0, 0];
  // activeDefaultLevel: Array<number> = [0, 0, 0];
  options: Array<number> = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  activeSkills: Array<any> = [];
  constructor(private utilsService: UtilsService) {}
  ngOnInit(): void {}
  ngOnChanges() {
    if (this.detailedServant.id && this.detailedServantEnglish.id) {
      const activeSkills = this.utilsService
        .getServantActiveSkills(
          this.detailedServant,
          this.detailedServantEnglish
        )
        .sort((a: any, b: any) => a.num - b.num);
      console.log(activeSkills);
      let functions: Array<any> = [];
      activeSkills.map(
        (skill: any) => (functions = [...functions, ...skill.functions])
      );
      // console.log(functions.map((qqq) => qqq.svals));
      this.activeSkills = activeSkills;
      this.activeSkillLevel = activeSkills.map(() => '0');
    }
  }

  changeAppendSkillLevel(index: number) {
    this.appendSkillLevel[index] = this.appendSkillLevelControl.value;
    this.appendSkillModifyer[index] =
      this.detailedServant.appendPassive[index].skill.functions[0].svals[
        this.appendSkillLevel[index]
      ].Value;
  }

  changeActiveSkillLevel(index: number) {
    this.activeSkillLevel[index] = this.activeSkillLevelControl.value;
    this.activeSkillModifyer[index] =
      this.activeSkills[index].functions[0].svals[index];
  }
  getEnglishInfo() {
    if (this.detailedServantEnglish) {
      return this.detailedServantEnglish;
    } else {
      return this.detailedServant;
    }
  }

  appendSkillDetail(skillDetail: string, index: number) {
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
  activeSkillDetail(skillInfo: any, index: number) {
    return `Cooldown: ${
      skillInfo.coolDown[this.activeSkillLevel[index]]
    } turns`;
  }

  skillTextPopUp(func: any, index: number) {
    if (func.funcType === 'gainHp') {
      return `HP Gain: ${func.svals[this.activeSkillLevel[index]].Value}`;
    }
    if (func.funcType === 'gainNp') {
      return `${func.funcPopupText}: ${
        func.svals[this.activeSkillLevel[index]].Value / 100
      }%`;
    }
    return `${func.funcPopupText}: ${
      func.svals[this.activeSkillLevel[index]].Value / 10
    }%`;
  }
}
