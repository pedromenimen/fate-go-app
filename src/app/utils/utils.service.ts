import { Injectable } from '@angular/core';
import { DetailedServant, Sval, Skill } from './../types/servant-type';

@Injectable({
  providedIn: 'root',
})
export class UtilsService {
  constructor() {}

  /**
   * Atlas Academy returns skill values as integers whose unit depends on the
   * `funcType` of the function the placeholder refers to:
   *   - addStateShort / addState (buff/debuff rates): Value is percent * 10
   *       (e.g. 30% DEF up => Value 300). Divide by 10 to render as percent.
   *   - gainNp / NP-charge: Value is percent * 100
   *       (e.g. 20% NP charge => Value 2000). Divide by 100 to render.
   *   - gainStar: Value is the raw star count (already in human units).
   *   - hastenNpturn / other flat-count functions: Value is the raw number.
   *
   * When the funcType is unknown we fall back to a simple heuristic (multiple
   * of 10 with 2+ digits => divide by 10 and show as percent; otherwise raw).
   */
  formatSkillSvalValue(value: number, funcType?: string): string {
    const type = (funcType ?? '').toLowerCase();
    if (type === 'gainstar' || type === 'hastennpturn' || type === 'hastennpturninline') {
      return `${value}`;
    }
    if (type === 'gainnp' || type === 'gainnpfromtargets' || type === 'losenp') {
      // NP values are stored as percent * 100 (Value 2000 => 20%).
      return `${value / 100}%`;
    }
    if (
      type === 'addstateshort' ||
      type === 'addstate' ||
      type === 'substateshort' ||
      type === 'substate'
    ) {
      // Buff/debuff values are stored as percent * 10 (Value 300 => 30%).
      // Some `addState` functions only carry a Count/Turn flag without an
      // actual rate (e.g. Skill Reload's `Value: 1`); treat small values
      // (< 10) as raw counts so we don't render them as fractional percents.
      if (value < 10) {
        return `${value}`;
      }
      return `${value / 10}%`;
    }
    // Fallback heuristic for unrecognised func types.
    if (value >= 10 && value % 10 === 0) {
      return `${value / 10}%`;
    }
    return `${value}`;
  }

  /**
   * Renders the human-readable description of a skill or append skill.
   *
   * Atlas Academy exposes two fields per skill:
   *   - `detail`          — already-substituted text the API ships ready for
   *                         display (e.g. `Apply Ignore Invincible (1 turn) &
   *                         increase Arts card effectiveness (1 turn) for
   *                         yourself`).
   *   - `unmodifiedDetail` — the raw template containing `{N}` placeholders,
   *                          BBCode upgrade markers and funcquest brackets.
   *
   * `detail` is almost always what we want; it doesn't depend on the chosen
   * skill level and doesn't carry `{N}` leftovers. We only fall back to
   * `unmodifiedDetail` for the few append/passive entries where `detail` is
   * empty.
   *
   * The `detail` text still ships with cosmetic noise we strip here:
   *   - `▲` — Unicode "strengthened-from-previous-level" marker Atlas renders
   *     around values that grew between upgrades. No numeric meaning for us.
   *   - `[Demerit]`, `[Advantage]` — colour-only labels with no value.
   *   - `[N]` numeric brackets that sit after a value as a duplicate copy.
   *   - Empty `[]` / `[{N}]` brackets left from funcquest slots.
   *
   * `<N times ... >` conditional multipliers (Skill Reload) are kept intact
   * since they describe real per-level behaviour.
   */
  renderSkillDetail(skill: Skill, _level: number): string {
    // Prefer the pre-rendered `detail` field; only fall back to the raw
    // template when the API hasn't populated it.
    let template = skill.detail || skill.unmodifiedDetail || '';
    if (!template) return '';

    // Drop the `▲` strengthening marker and its surrounding whitespace runs.
    template = template.replace(/\s*▲\s*/g, ' ');
    // Drop empty `[]` / `[{N}]` brackets that resolve to nothing.
    template = template.replace(/\[\{\d*\}\]/g, '');
    template = template.replace(/\[\s*\]/g, '');
    // Drop a plain `[N]` suffix that duplicates a value already shown.
    // Keep `[N,m]` since the multiplier is real.
    template = template.replace(/\s*\[\d+\](?!\s*[,.])/g, '');
    // Drop bracketed colour-only labels like `[Demerit]` / `[Advantage]`.
    // We restrict to letter-only contents so we never eat numeric brackets.
    template = template.replace(/\[[A-Za-z][A-Za-z\s]*\]/g, '');

    return template
      .replace(/\s{2,}/g, ' ')
      .replace(/\s+([,.;:])/g, '$1')
      .trim();
  }

  /**
   * When a placeholder references `functions[N]` that doesn't exist (or has
   * no numeric `Value` at the requested level), search sibling functions for
   * any sval with a numeric `Value` at the same level and reuse it. Used by
   * `renderSkillDetail` for Atlas Academy append/passive skills that
   * reference out-of-range function indices.
   */
  private fallbackSiblingValue(functions: any[], level: number): string {
    for (const candidate of functions) {
      const sv = candidate.svals?.[level];
      if (sv && sv.Value !== undefined) {
        return this.formatSkillSvalValue(sv.Value, candidate.funcType);
      }
    }
    return '';
  }

  getSkillCooldown(skill: Skill, level: number): number {
    return skill.coolDown?.[level] ?? 0;
  }

  getCostumeNames(servantDetailedInfo: DetailedServant): string[] {
    if (Object.keys(servantDetailedInfo.profile.costume).length > 0) {
      const costumeIds = Object.keys(servantDetailedInfo.profile.costume);
      const costumeNames: string[] = [];
      costumeIds.map((id) => {
        costumeNames.push(servantDetailedInfo.profile.costume[id].shortName);
      });
      return costumeNames;
    }
    return [];
  }

  getServantImages(servantDetailedInfo: DetailedServant): string[] {
    const ascensionImages = Object.values(
      servantDetailedInfo.extraAssets.charaGraph.ascension ?? {}
    );
    const costumeImages = Object.values(
      servantDetailedInfo.extraAssets.charaGraph.costume ?? {}
    );
    return [...ascensionImages, ...costumeImages];
  }

  getServantActiveSkills(
    detailedServant: DetailedServant,
    detailedServantEnglish: DetailedServant
  ): Array<Skill> {
    // Prefer the English version when present; otherwise fall back to the main payload.
    const source = detailedServantEnglish?.skills?.length
      ? detailedServantEnglish
      : detailedServant;

    // The API returns skill strengthenings as additional entries that share the
    // same `num` as their base skill (num 1/2/3). We only want the base version
    // of each active skill, so we keep the first occurrence of every `num`.
    const seen = new Set<number>();
    const baseActives: Skill[] = [];
    for (const skill of source.skills ?? []) {
      if (skill.type !== 'active') continue;
      if (seen.has(skill.num)) continue;
      seen.add(skill.num);
      baseActives.push(skill);
    }

    return baseActives.sort((a, b) => a.num - b.num);
  }

  /**
   * Atlas Academy exposes skill strengthenings as additional entries that
   * share the same `num` as the base version. The order is given by `priority`
   * (1 = base, 2 = first strengthening, 3 = second, ...). This helper groups
   * every active skill by `num` and returns each group's versions sorted by
   * priority, so the UI can offer a version selector (e.g. Yin-Yang A / A+).
   */
  getServantActiveSkillGroups(
    detailedServant: DetailedServant,
    detailedServantEnglish: DetailedServant
  ): Array<{ num: number; versions: Skill[] }> {
    const source = detailedServantEnglish?.skills?.length
      ? detailedServantEnglish
      : detailedServant;

    const groups = new Map<number, Skill[]>();
    for (const skill of source.skills ?? []) {
      if (skill.type !== 'active') continue;
      if (!groups.has(skill.num)) groups.set(skill.num, []);
      groups.get(skill.num)!.push(skill);
    }
    return Array.from(groups.entries())
      .sort(([a], [b]) => a - b)
      .map(([num, versions]) => ({
        num,
        versions: versions.sort((a, b) => a.priority - b.priority),
      }));
  }
}
