import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { Function, Skill } from 'src/app/types/servant-type';
import { DetailedServant } from './../../../types/servant-type';
import { UtilsService } from './../../../utils/utils.service';

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
  activeSkills: Array<Skill> = [];
  appendSkills: Array<Skill> = [];
  // One form control per active skill so each select has independent state
  // and we can react to its `(change)` event with the right index.
  activeSkillControls: UntypedFormControl[] = [];
  // Same idea for append (passive) skills.
  appendSkillControls: UntypedFormControl[] = [];
  constructor(private utilsService: UtilsService) {}
  ngOnInit(): void {}
  ngOnChanges() {
    if (this.detailedServant?.id && this.detailedServantEnglish?.id) {
      const activeSkills = this.utilsService.getServantActiveSkills(
        this.detailedServant,
        this.detailedServantEnglish
      );
      this.activeSkills = activeSkills;
      // Reset the per-skill form controls whenever the active skill set changes
      // (i.e. when the user navigates between servants).
      this.activeSkillControls = activeSkills.map(
        () => new UntypedFormControl('0')
      );

      // Append skills come wrapped in { skill: {...}, unlockMaterials: [...] }.
      // The English payload may carry translated names/details — prefer it when
      // available.
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
    // The form control already holds the new value; we just trigger a
    // re-render by reading it back. Kept as a hook for future side-effects.
    this.appendSkillControls[index].value;
  }

  changeActiveSkillLevel(index: number) {
    // The form control already holds the new value; we just trigger a
    // re-render by reading it back. Kept as a hook for future side-effects.
    this.activeSkillControls[index].value;
  }

  getActiveSkillLevel(index: number): number {
    const value = this.activeSkillControls[index]?.value ?? '0';
    return parseInt(value, 10) || 0;
  }

  getActiveSkillDetail(skill: Skill, index: number): string {
    return this.utilsService.renderSkillDetail(
      skill,
      this.getActiveSkillLevel(index)
    );
  }

  getActiveSkillCooldown(skill: Skill, index: number): number {
    return this.utilsService.getSkillCooldown(
      skill,
      this.getActiveSkillLevel(index)
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
