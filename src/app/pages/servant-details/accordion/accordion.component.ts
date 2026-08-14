import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { Function, Skill } from 'src/app/types/servant-type';
import { DetailedServant } from './../../../types/servant-type';
import { UtilsService } from './../../../utils/utils.service';

interface ActiveSkillGroup {
  num: number;
  versions: Skill[];
}

@Component({
    selector: 'app-accordion',
    templateUrl: './accordion.component.html',
    styleUrls: ['./accordion.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class AccordionComponent implements OnInit {
  @Input() detailedServant!: DetailedServant;
  @Input() detailedServantEnglish!: DetailedServant;
  options: Array<number> = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

  activeSkillGroups: ActiveSkillGroup[] = [];
  appendSkills: Skill[] = [];

  activeSkillControls: UntypedFormControl[] = [];
  activeVersionControls: UntypedFormControl[] = [];
  appendSkillControls: UntypedFormControl[] = [];

  constructor(private utilsService: UtilsService) {}

  ngOnInit(): void {}

  ngOnChanges() {
    if (this.detailedServant?.id && this.detailedServantEnglish?.id) {
      const groups = this.utilsService.getServantActiveSkillGroups(
        this.detailedServant,
        this.detailedServantEnglish
      );
      this.activeSkillGroups = groups;
      this.activeSkillControls = groups.map(() => new UntypedFormControl('0'));
      this.activeVersionControls = groups.map(() => new UntypedFormControl(0));

      const englishSource =
        this.detailedServantEnglish?.appendPassive?.length
          ? this.detailedServantEnglish
          : this.detailedServant;
      this.appendSkills = (englishSource.appendPassive ?? []).map(
        (entry) => entry.skill
      );
      this.appendSkillControls = this.appendSkills.map(
        () => new UntypedFormControl('0')
      );
    }
  }

  changeAppendSkillLevel(index: number) {
    this.appendSkillControls[index].value;
  }

  changeActiveSkillLevel(index: number) {
    this.activeSkillControls[index].value;
  }

  changeActiveVersion(groupIndex: number) {
    this.activeVersionControls[groupIndex].value;
  }

  getActiveSkill(groupIndex: number): Skill {
    const group = this.activeSkillGroups[groupIndex];
    const versionIndex = this.activeVersionControls[groupIndex]?.value ?? 0;
    return group.versions[versionIndex] ?? group.versions[0];
  }

  getActiveSkillLevel(groupIndex: number): number {
    const value = this.activeSkillControls[groupIndex]?.value ?? '0';
    return parseInt(value, 10) || 0;
  }

  getActiveSkillDetail(groupIndex: number): string {
    return this.utilsService.renderSkillDetail(
      this.getActiveSkill(groupIndex),
      this.getActiveSkillLevel(groupIndex)
    );
  }

  getActiveSkillCooldown(groupIndex: number): number {
    return this.utilsService.getSkillCooldown(
      this.getActiveSkill(groupIndex),
      this.getActiveSkillLevel(groupIndex)
    );
  }

  getAppendSkillLevel(index: number): number {
    const value = this.appendSkillControls[index]?.value ?? '0';
    return parseInt(value, 10) || 0;
  }

  getAppendSkillDetail(skill: Skill, index: number): string {
    return this.utilsService.renderSkillDetail(
      skill,
      this.getAppendSkillLevel(index)
    );
  }

  getVersionLabel(skill: Skill): string {
    return skill.name;
  }

  getEnglishInfo() {
    if (this.detailedServantEnglish) {
      return this.detailedServantEnglish;
    } else {
      return this.detailedServant;
    }
  }

  skillTextPopUp(func: Function, index: number) {
    return '';
  }
}
