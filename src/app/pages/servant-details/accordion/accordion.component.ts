import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { Function, NoblePhantasm, Skill } from 'src/app/types/servant-type';
import { DetailedServant } from './../../../types/servant-type';
import { SkillEffect, NoblePhantasmOverchargeEffect, UtilsService } from './../../../utils/utils.service';
import { ServantService } from './../../../services/servant.service';

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
  /** Noble Phantasms have exactly 5 levels (1..5). */
  npOptions: Array<number> = [0, 1, 2, 3, 4];

  activeSkillGroups: ActiveSkillGroup[] = [];
  appendSkills: Skill[] = [];
  /** Class passive skills (e.g. Magic Resistance, Riding). No level selector. */
  classPassiveSkills: Skill[] = [];
  /** Noble Phantasms with strengthenings grouped together by `num`. */
  noblePhantasmGroups: { num: number; versions: NoblePhantasm[] }[] = [];

  activeSkillControls: UntypedFormControl[] = [];
  activeVersionControls: UntypedFormControl[] = [];
  appendSkillControls: UntypedFormControl[] = [];
  npLevelControls: UntypedFormControl[] = [];
  npVersionControls: UntypedFormControl[] = [];

  /**
   * Cache of resolved quest labels keyed by `${questId}_${phase}`.
   * Populated lazily on first render of an NP/Skill condition.
   */
  questLabelCache = new Map<string, string>();

  constructor(
    private utilsService: UtilsService,
    private servantService: ServantService
  ) {}

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

      this.classPassiveSkills = this.utilsService.getServantClassPassives(
        this.detailedServant,
        this.detailedServantEnglish
      );

      const npList = this.utilsService.getServantNoblePhantasms(
        this.detailedServant,
        this.detailedServantEnglish
      );
      const npMap = new Map<number, NoblePhantasm[]>();
      for (const np of npList) {
        if (!npMap.has(np.num)) npMap.set(np.num, []);
        npMap.get(np.num)!.push(np);
      }
      this.noblePhantasmGroups = Array.from(npMap.entries())
        .sort(([a], [b]) => a - b)
        .map(([num, versions]) => ({
          num,
          versions: versions.sort((a, b) => a.priority - b.priority),
        }));
      this.npLevelControls = this.noblePhantasmGroups.map(
        () => new UntypedFormControl('0')
      );
      this.npVersionControls = this.noblePhantasmGroups.map(
        () => new UntypedFormControl(0)
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

  getActiveSkillEffects(groupIndex: number): SkillEffect[] {
    return this.utilsService.renderSkillEffects(
      this.getActiveSkill(groupIndex),
      this.getActiveSkillLevel(groupIndex)
    );
  }

  shouldShowActiveSkillEffects(groupIndex: number): boolean {
    return this.utilsService.shouldShowSkillEffects(this.getActiveSkill(groupIndex));
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

  getAppendSkillEffects(skill: Skill, index: number): SkillEffect[] {
    return this.utilsService.renderSkillEffects(
      skill,
      this.getAppendSkillLevel(index)
    );
  }

  shouldShowAppendSkillEffects(skill: Skill): boolean {
    return this.utilsService.shouldShowSkillEffects(skill);
  }

  getActiveSkillActivationTraits(groupIndex: number): string[] {
    return this.utilsService.getSkillActivationTraits(
      this.getActiveSkill(groupIndex)
    );
  }

  getAppendSkillActivationTraits(skill: Skill): string[] {
    return this.utilsService.getSkillActivationTraits(skill);
  }

  getActiveSkillCondition(groupIndex: number): string | null {
    return this.getSkillConditionWithQuestLabel(this.getActiveSkill(groupIndex));
  }

  getAppendSkillCondition(skill: Skill): string | null {
    return this.getSkillConditionWithQuestLabel(skill);
  }

  // ---------- Class passive skills ----------
  getClassPassiveDetail(skill: Skill): string {
    return this.utilsService.renderSkillDetail(skill, 0);
  }

  getClassPassiveEffects(skill: Skill): SkillEffect[] {
    return this.utilsService.renderSkillEffects(skill, 0);
  }

  shouldShowClassPassiveEffects(skill: Skill): boolean {
    return this.utilsService.shouldShowSkillEffects(skill);
  }

  getClassPassiveActivationTraits(skill: Skill): string[] {
    return this.utilsService.getSkillActivationTraits(skill);
  }

  getClassPassiveCondition(skill: Skill): string | null {
    return this.getSkillConditionWithQuestLabel(skill);
  }

  /**
   * Returns the condition string for any skill/NP and triggers a quest-name
   * lookup so the rendered condition reads e.g. "Quest #94061512 — Camelot
   * / The Battle of Fate, phase 3" instead of a bare numeric id.
   */
  private getSkillConditionWithQuestLabel(skill: Skill | NoblePhantasm): string | null {
    const base = this.utilsService.getSkillConditionInfo(skill);
    if (!base) return null;
    const condQuestId = (skill as any).condQuestId as number | undefined;
    const condQuestPhase = (skill as any).condQuestPhase as number | undefined;
    if (!condQuestId || condQuestId <= 0) return base;
    const key = `${condQuestId}_${condQuestPhase ?? 0}`;
    if (!this.questLabelCache.has(key)) {
      this.questLabelCache.set(key, '');
      this.servantService.getQuestLabel(condQuestId, condQuestPhase ?? 0).subscribe((label) => {
        if (label) this.questLabelCache.set(key, label);
      });
    }
    const questLabel = this.questLabelCache.get(key);
    if (questLabel) {
      // Replace the bare "Quest #id" part with the friendly label.
      return base.replace(/Quest #\d+/, questLabel);
    }
    return base;
  }

  // ---------- Noble Phantasm ----------
  getNoblePhantasm(groupIndex: number): NoblePhantasm {
    const group = this.noblePhantasmGroups[groupIndex];
    const versionIndex = this.npVersionControls[groupIndex]?.value ?? 0;
    return group.versions[versionIndex] ?? group.versions[0];
  }

  getNoblePhantasmLevel(groupIndex: number): number {
    const value = this.npLevelControls[groupIndex]?.value ?? '0';
    return (parseInt(value, 10) || 0) + 1;
  }

  getNoblePhantasmDetail(groupIndex: number): string {
    return this.utilsService.renderSkillDetail(
      this.getNoblePhantasm(groupIndex),
      0
    );
  }

  getNoblePhantasmEffects(groupIndex: number): SkillEffect[] {
    return this.utilsService.renderNoblePhantasmEffects(
      this.getNoblePhantasm(groupIndex),
      this.getNoblePhantasmLevel(groupIndex)
    );
  }

  shouldShowNoblePhantasmEffects(groupIndex: number): boolean {
    return this.utilsService.shouldShowSkillEffects(
      this.getNoblePhantasm(groupIndex)
    );
  }

  /**
   * Returns per-function overcharge tier values for the active NP version.
   * Empty when the NP doesn't scale anything with overcharge (e.g. simple
   * damage NPs) so the template can skip the section entirely.
   */
  getNoblePhantasmOvercharge(groupIndex: number): NoblePhantasmOverchargeEffect[] {
    const list = this.utilsService.renderNoblePhantasmOvercharge(
      this.getNoblePhantasm(groupIndex),
      this.getNoblePhantasmLevel(groupIndex)
    );
    return list;
  }

  getNoblePhantasmActivationTraits(groupIndex: number): string[] {
    const np = this.getNoblePhantasm(groupIndex);
    const traits = np.actIndividuality ?? [];
    return traits
      .filter((t) => (t.name || '').trim())
      .map((t) => (t.negative ? `Não ${t.name}` : t.name));
  }

  getNoblePhantasmCondition(groupIndex: number): string | null {
    return this.getSkillConditionWithQuestLabel(this.getNoblePhantasm(groupIndex));
  }

  /**
   * Returns the NP gain percent per card type at the given NP level, sorted
   * by typical chain (Buster → Arts → Quick → Extra → NP). Values are stored
   * already in percent units (e.g. 86 = 86% NP gain on that card).
   */
  getNoblePhantasmCardGains(np: NoblePhantasm, level: number): Array<{ label: string; value: number; title: string }> {
    const idx = Math.max(0, Math.min(4, level - 1));
    const order: Array<{ key: keyof typeof np.npGain; label: string; title: string }> = [
      { key: 'buster', label: 'Buster', title: 'NP gain ao atacar com carta Buster' },
      { key: 'arts', label: 'Arts', title: 'NP gain ao atacar com carta Arts' },
      { key: 'quick', label: 'Quick', title: 'NP gain ao atacar com carta Quick' },
      { key: 'extra', label: 'Extra', title: 'NP gain ao atacar com carta Extra' },
      { key: 'np', label: 'NP (auto)', title: 'NP gain automático no início do turno (NP por turno)' },
      { key: 'defence', label: 'Defesa', title: 'NP gain ao defender um ataque. Valores >100% indicam NP recuperado ao defender.' },
    ];
    const out: Array<{ label: string; value: number; title: string }> = [];
    for (const { key, label, title } of order) {
      const arr = np.npGain?.[key];
      if (arr && arr.length > idx) {
        out.push({ label, value: arr[idx], title });
      }
    }
    return out;
  }

  npCardLabel(card: string | number): string {
    // Atlas Academy returns the NP card as either a numeric index
    // (1 = Buster, 2 = Arts, 3 = Quick) or a lowercase string in some
    // payloads. Normalise both forms to the human label.
    const raw = String(card ?? '').trim().toLowerCase();
    if (raw === '1' || raw === 'buster') return 'Buster';
    if (raw === '2' || raw === 'arts') return 'Arts';
    if (raw === '3' || raw === 'quick') return 'Quick';
    return raw || '—';
  }

  getNoblePhantasmVersionLabel(version: NoblePhantasm, vi: number): string {
    return this.utilsService.getNoblePhantasmVersionLabel(version, vi);
  }

  getFunctionTargetLabel(fn: Function): string {
    return this.utilsService.getFunctionTargetLabel(fn);
  }

  getSkillCooldownAt(skill: Skill, level: number): number {
    return this.utilsService.getSkillCooldown(skill, level);
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
