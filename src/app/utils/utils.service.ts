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
   * Replaces every `{N}` placeholder in a skill's `unmodifiedDetail` with the
   * formatted value pulled from the matching `functions[N].svals[level].Value`.
   *
   * Atlas Academy skills may have multiple functions (e.g. Obscurant Wall of
   * Chalk has addState + gainNp + hastenNpturn). The placeholder `{0}` refers
   * to `functions[0].svals[level]`, `{1}` to `functions[1]`, etc. Not every
   * function has a `Value` field, so we look up the next available numeric
   * value when the requested function doesn't have one.
   *
   * Atlas Academy templates include several conditional shapes that don't add
   * meaning once the value is substituted:
   *   - `{{N:Value:flag}}` (e.g. `{{1:Value:m}}`) — the `:flag` is a server-side
   *     rendering hint. We collapse these to plain `{N}` before substitution.
   *   - `[N]` / `[N,m]` bracketed suffixes tied to a function index; the
   *     brackets wrap a copy of the value with a conditional multiplier flag.
   *     The simple `[N]` form is removed (the value already appeared once in
   *     the body); the `[N,m]` form stays since the multiplier is server-set.
   *   - `[{N}]` literal placeholder that resolves to nothing; removed.
   *   - Trailing `[{}]` / leading `[]` left over from funcquestText slots —
   *     removed.
   *   - `<N times ... >` redaction of conditional multipliers is left intact
   *     (Skill Reload uses it).
   */
  renderSkillDetail(skill: Skill, level: number): string {
    let template = skill.unmodifiedDetail || skill.detail || '';
    if (!template.includes('{') && !template.includes('[')) {
      return template;
    }
    // Normalise `{{N:Value:flag}}` -> `{N}` so the substitution regex handles it.
    template = template.replace(/\{\{(\d+):[^}]+\}\}/g, '{$1}');
    // Drop empty `[{N}]` / `[]` brackets that resolve to nothing.
    template = template.replace(/\[\{\d*\}\]/g, '');
    template = template.replace(/\[\s*\]/g, '');
    // Drop a plain `[N]` suffix that the server adds as a duplicate copy of
    // the same value. We don't touch `[N,m]` because the multiplier matters.
    template = template.replace(/\s*\[\d+\](?!\s*[,.])/g, '');

    const functions = skill.functions ?? [];
    return template.replace(/\{(\d+)\}(%)?/g, (_match, indexStr, trailingPct) => {
      const funcIndex = parseInt(indexStr, 10);
      const fn = functions[funcIndex];
      let formatted: string;
      if (fn) {
        const sval: Sval | undefined = fn.svals?.[level];
        if (sval && sval.Value !== undefined) {
          formatted = this.formatSkillSvalValue(sval.Value, fn.funcType);
        } else {
          formatted = this.fallbackSiblingValue(functions, level);
        }
      } else {
        formatted = this.fallbackSiblingValue(functions, level);
      }
      // Drop a literal `%` next to the placeholder when the resolved value
      // already ends with one — prevents the doubled-up `30%%` output.
      if (trailingPct && formatted.endsWith('%')) {
        return formatted;
      }
      return trailingPct ? `${formatted}${trailingPct}` : formatted;
    }).replace(/\s{2,}/g, ' ').trim();
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
