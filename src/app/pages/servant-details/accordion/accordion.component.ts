import { Component, Input, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Function, Skill } from 'src/app/types/servant-type';
import { DetailedServant } from './../../../types/servant-type';
import { UtilsService } from './../../../utils/utils.service';

@Component({
  selector: 'app-accordion',
  templateUrl: './accordion.component.html',
  styleUrls: ['./accordion.component.css'],
})
export class AccordionComponent implements OnInit {
  @Input() detailedServant!: DetailedServant;
  @Input() detailedServantEnglish!: DetailedServant;
  appendSkillLevelControl = new FormControl('0');
  activeSkillLevelControl = new FormControl('0');
  appendSkillLevel: Array<string> = [];
  activeSkillLevel: Array<string> = [];
  appendSkillModifyer: Array<number> = [300, 1000, 200];
  options: Array<number> = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  activeSkills: Array<Skill> = [];
  constructor(private utilsService: UtilsService) {}
  ngOnInit(): void {}
  ngOnChanges() {
    if (this.detailedServant?.id && this.detailedServantEnglish?.id) {
      const activeSkills = this.utilsService
        .getServantActiveSkills(
          this.detailedServant,
          this.detailedServantEnglish
        )
        .sort((a: Skill, b: Skill) => a.num - b.num)
        .filter((element: Skill, index: number, array: Array<Skill>) => {
          return !array
            .map((item) => item.name)
            .includes(element.name, index + 1);
        });
      this.activeSkills = activeSkills;
      this.activeSkillLevel = activeSkills.map(() => '0');
      console.log(activeSkills);
    }
  }

  changeAppendSkillLevel(index: number) {
    this.appendSkillLevel[index] = this.appendSkillLevelControl.value;
    this.appendSkillModifyer[index] =
      this.detailedServant.appendPassive[index].skill.functions[0].svals[
        parseInt(this.appendSkillLevel[index])
      ].Value;
    console.log(this.appendSkillModifyer);
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
  activeSkillDetail(skillInfo: Skill, index: number) {
    return `Cooldown: ${
      skillInfo.coolDown[parseInt(this.activeSkillLevel[index])]
    } turns`;
  }

  skillTextPopUp(func: Function, index: number) {
    return '';
  }
}
