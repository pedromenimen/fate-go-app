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
   * Most skills ship with a usable `detail`; we use it when present and fall
   * back to parsing `unmodifiedDetail` only when `detail` is empty. The
   * parsing path resolves `{N}` placeholders against `functions[N].svals
   * [level].Value` so append skills still get numeric values inlined.
   *
   * Both paths strip Atlas' cosmetic noise:
   *   - `▲` — Unicode "strengthened-from-previous-level" marker.
   *   - `[Demerit]`, `[Advantage]` — colour-only labels with no value.
   *   - `[N]` numeric brackets that sit after a value as a duplicate copy.
   *   - Empty `[]` / `[{N}]` brackets left from funcquest slots.
   *   - `[g][o]...[/o][/g]` BBCode upgrade wrappers.
   *
   * `<N times ... >` conditional multipliers (Skill Reload) are kept intact
   * since they describe real per-level behaviour.
   */
  renderSkillDetail(skill: Skill, level: number): string {
    const preRendered = (skill.detail || '').trim();
    // Prefer `detail` when Atlas already resolved it (active skill class
    // skills, NPs, etc.). Append/passive skills ship a `detail` that *still*
    // contains `{{N:Value:flag}}` placeholders; for those we fall through
    // to the `unmodifiedDetail` resolver. We detect the unresolved case by
    // looking for any `{` in the candidate text.
    const hasUnresolvedPlaceholders = /\{[^}]{1,30}\}/.test(preRendered);
    if (preRendered && !hasUnresolvedPlaceholders) {
      return this.cleanSkillText(preRendered);
    }
    const raw = skill.unmodifiedDetail || '';
    if (!raw) {
      return preRendered ? this.cleanSkillText(preRendered) : '';
    }
    return this.cleanSkillText(this.resolveSkillPlaceholders(raw, skill, level));
  }

  /**
   * Strips Atlas Academy's cosmetic noise (BBCode upgrade markers, empty
   * funcquest brackets, duplicate `[N]` suffixes, colour-only labels and the
   * `▲` strengthening glyph) and collapses stray whitespace/punctuation.
   *
   * We keep a small allow-list of bracketed labels that carry real meaning
   * (the seven main class names plus a few quality/trait tags Atlas uses),
   * so e.g. `[Foreigner] class` survives intact while `[Demerit]` is removed.
   */
  private cleanSkillText(text: string): string {
    let out = text
      .replace(/\s*▲\s*/g, ' ')
      .replace(/\[g\]\[o\][^[]*\[\/o\]\[\/g\]/g, '')
      .replace(/\[\{\d*\}\]/g, '')
      .replace(/\[\s*\]/g, '')
      .replace(/\s*\[\d+\](?!\s*[,.])/g, '')
      .replace(/\s{2,}/g, ' ');
    // Drop bracketed labels that aren't in the preserve list.
    out = out.replace(/\[([A-Za-z][A-Za-z\s]*)\]/g, (_match, inner: string) => {
      const trimmed = inner.trim();
      if (UtilsService.PRESERVED_BRACKETED.has(trimmed)) {
        return trimmed;
      }
      return '';
    });
    return out
      .replace(/\s+([,.;:])/g, '$1')
      .replace(/\(\s+/g, '(')
      .replace(/\s+\)/g, ')')
      .trim();
  }

  /**
   * Bracketed labels Atlas uses that we keep as plain text. Everything else
   * inside `[...]` is stripped as cosmetic noise (e.g. `[Demerit]`,
   * `[Advantage]`, colour markers).
   */
  private static readonly PRESERVED_BRACKETED = new Set<string>([
    'Foreigner',
    'Saber', 'Archer', 'Lancer', 'Rider', 'Caster', 'Assassin', 'Berserker',
    'Ruler', 'Avenger', 'Moon Cancer', 'Alter Ego', 'Pretender', 'Beast',
    'Human', 'Divine', 'Demonic', 'Good', 'Evil', 'Neutral',
    'Chaotic', 'Lawful', 'Summer', 'Christmas',
  ]);

  /**
   * Resolves every `{N}` placeholder in `unmodifiedDetail` against the skill's
   * `functions[N].svals[level].Value`. Functions without a numeric `Value`
   * fall back to the next sibling that has one, matching Atlas Academy's
   * own fallback behaviour.
   *
   * Note: we strip `[{N}]` *before* substituting `{N}` because the bracketed
   * form is Atlas's way of marking "this placeholder should resolve to empty
   * here". If we let it survive into substitution, the inner `{N}` would
   * also get filled in (e.g. `[{0}]` would become `[30%]` instead of `""`).
   */
  private resolveSkillPlaceholders(raw: string, skill: Skill, level: number): string {
    const functions = skill.functions ?? [];
    // Drop bracketed placeholders first so they don't get their inner {N}
    // resolved to a leftover value next to the description.
    const stripped = raw.replace(/\[\{\d+\}\]/g, '');
    return stripped
      .replace(/\{\{(\d+):[^}]+\}\}/g, '{$1}')
      .replace(/\{(\d+)\}(%)?/g, (_match, indexStr, trailingPct) => {
        const fn = functions[parseInt(indexStr, 10)];
        let resolved = '';
        if (fn) {
          const sv: Sval | undefined = fn.svals?.[level];
          if (sv && sv.Value !== undefined) {
            resolved = this.formatSkillSvalValue(sv.Value, fn.funcType);
          }
        }
        if (!resolved) {
          resolved = this.fallbackSiblingValue(functions, level);
        }
        if (trailingPct && !resolved.endsWith('%')) {
          resolved += trailingPct;
        }
        return resolved;
      });
  }

  /**
   * Returns one entry per function of the skill that has a numeric `Value`
   * at the requested level. Each entry carries the function's popup label
   * (e.g. "Arts Up"), the formatted per-level value, and the duration in
   * turns when the function carries a `Turn` field. The UI renders this as a
   * compact "effects" list under the description so users can see *what each
   * level actually does* — information Atlas's `detail` text often omits.
   */
  renderSkillEffects(
    skill: Skill,
    level: number
  ): Array<{ name: string; value: string; turn?: number }> {
    const effects: Array<{ name: string; value: string; turn?: number }> = [];
    for (const fn of skill.functions ?? []) {
      const sv: Sval | undefined = fn.svals?.[level];
      if (!sv || sv.Value === undefined || sv.Value === null) continue;
      const name = (fn.funcPopupText || '').replace(/\s+/g, ' ').trim();
      if (!name) continue;
      const value = this.formatSkillSvalValue(sv.Value, fn.funcType);
      const turn = sv.Turn && sv.Turn > 0 ? sv.Turn : undefined;
      effects.push({ name, value, turn });
    }
    return effects;
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
