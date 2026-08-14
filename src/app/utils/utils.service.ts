import { Injectable } from '@angular/core';
import {
  DetailedServant,
  Function,
  NiceBuff,
  NiceTrait,
  NoblePhantasm,
  Sval,
  Skill,
} from './../types/servant-type';
import {
  FUNC_APPLY_TARGET_LABELS,
  FUNC_TARGET_TYPE_LABELS,
  FUNC_TYPE_LABELS,
} from './func-type-labels';

export interface SkillEffect {
  name: string;
  value: string;
  /** Optional duration in turns (when the function carries a non-zero Turn). */
  turn?: number;
  /** Optional charge/stack count (when the function carries a non-zero Count). */
  count?: number;
  /** Optional secondary value rendered when it differs from `value` (e.g. NP dmg vs heal). */
  value2?: string;
  /** Optional raw funcType for callers that want to style by category. */
  funcType?: string;
  /** Optional icon URL from the resolved buff, if any. */
  icon?: string | null;
}

/**
 * Describes how a Noble Phantasm function scales with overcharge tiers (1-5).
 * `tiers[i]` holds the formatted value the function produces when the NP is
 * fired with overcharge tier `i + 1`. When the underlying `svals2` is empty
 * or constant, `tiers` is still populated but `scales` is false.
 */
export interface NoblePhantasmOverchargeEffect {
  name: string;
  /**
   * Per overcharge-tier formatted value at the requested NP level
   * (index 0 = OC 1, index 4 = OC 5). OC 1 always equals the function's
   * un-overcharged value (`svals`); OC 2..5 come from `svals2`..`svals5`.
   * Missing higher tiers inherit the previous tier's value.
   */
  tiers: string[];
  /**
   * True when the overcharge tier value itself changes between tiers
   * (true overcharge scaling). When false, every OC tier gives the same
   * value (a fixed OC upgrade) — UI shows an "OC ✦" badge.
   */
  variesByTier: boolean;
  funcType?: string;
}

@Injectable({
  providedIn: 'root',
})
export class UtilsService {
  constructor() {}

  /**
   * Best-effort label for a function. Prefers `funcPopupText` (the localised
   * human name Atlas ships). Falls back to:
   *   1. `funcGroup[0].name` — when the function belongs to an event drop-up
   *      or bond point-up group (Atlas ships a meaningful label there).
   *   2. `FUNC_TYPE_LABELS[funcType]` — the canonical Portuguese label for
   *      the function type (covers every enum value in NiceFuncType).
   *   3. `funcType` itself — when nothing else matches.
   */
  getFunctionLabel(fn: Function): string {
    const popup = (fn.funcPopupText || '').replace(/\s+/g, ' ').trim();
    // Reject Atlas's placeholder strings ("なし", "None", pure ASCII "null"
    // etc.) so we fall through to the enum label. These appear whenever
    // the function has no localised popup — common for raw `damageNp`,
    // `gainNp`, `hastenNpturn` entries on a Noble Phantasm.
    if (popup && popup !== 'なし' && popup !== 'None' && popup !== 'null' && popup !== '-') {
      return popup;
    }
    const groupName = fn.funcGroup?.[0]?.name?.trim();
    if (groupName) return groupName;
    const enumLabel = FUNC_TYPE_LABELS[fn.funcType];
    if (enumLabel) return enumLabel;
    return fn.funcType || 'Efeito';
  }

  /**
   * Returns a friendly description of the function's targeting (e.g.
   * "1 aliado", "Todos inimigos"). Combines `funcTargetTeam` and
   * `funcTargetType` so the user understands *who* the effect applies to.
   */
  getFunctionTargetLabel(fn: Function): string {
    const target = FUNC_TARGET_TYPE_LABELS[fn.funcTargetType];
    const team = FUNC_APPLY_TARGET_LABELS[fn.funcTargetTeam];
    if (target && team) return `${target} (${team})`;
    if (target) return target;
    if (fn.funcTargetType) return fn.funcTargetType;
    return '';
  }

  /**
   * Activation traits for a skill (the individualities a Servant must have
   * for the skill to be usable). Returns the `name` of each
   * `actIndividuality` entry, with optional `negative: true` rendered as
   * "não [trait]".
   */
  getSkillActivationTraits(skill: Skill): string[] {
    const traits = skill.actIndividuality ?? [];
    const labels: string[] = [];
    for (const t of traits) {
      const name = (t.name || '').replace(/\s+/g, ' ').trim();
      if (!name) continue;
      labels.push(t.negative ? `Não ${name}` : name);
    }
    return labels;
  }

  /**
   * Returns human-readable unlock conditions for a skill (quest id, level,
   * ascension limit). Returns null when the skill has no conditions.
   */
  getSkillConditionInfo(skill: Skill | NoblePhantasm): string | null {
    const parts: string[] = [];
    if (skill.condQuestId && skill.condQuestId > 0) {
      parts.push(`Quest #${skill.condQuestId}`);
    }
    if (skill.condQuestPhase && skill.condQuestPhase > 0) {
      parts.push(`fase ${skill.condQuestPhase}`);
    }
    if (skill.condLv && skill.condLv > 0) {
      parts.push(`nível ${skill.condLv}`);
    }
    if (skill.condLimitCount && skill.condLimitCount > 0) {
      parts.push(`Ascensão ${skill.condLimitCount}`);
    }
    return parts.length ? `Requer: ${parts.join(', ')}` : null;
  }

  /**
   * Returns the per-function effect list enriched with `count`, `value2`
   * and `icon`. The renderer in the template uses this to show a compact
   * chip row with name, value, turns and (when relevant) extra charges or
   * the secondary value.
   */
  renderSkillEffects(skill: Skill, level: number): SkillEffect[] {
    const effects: SkillEffect[] = [];
    for (const fn of skill.functions ?? []) {
      const sv: Sval | undefined = fn.svals?.[level];
      if (!sv || sv.Value === undefined || sv.Value === null) continue;
      const name = this.getFunctionLabel(fn);
      const value = this.formatSkillSvalValue(sv.Value, fn.funcType);
      const effect: SkillEffect = { name, value, funcType: fn.funcType };
      if (sv.Turn && sv.Turn > 0) effect.turn = sv.Turn;
      if (sv.Count && sv.Count > 0) effect.count = sv.Count;
      if (sv.Value2 !== undefined && sv.Value2 !== null && sv.Value2 !== sv.Value) {
        effect.value2 = this.formatSkillSvalValue(sv.Value2, fn.funcType);
      }
      const icon = fn.buffs?.[0]?.icon;
      if (icon) effect.icon = icon;
      effects.push(effect);
    }
    return effects;
  }

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
    if (type === 'damagenp' || type === 'damage' || type === 'damagenpstate') {
      // NP/regular damage values are stored as percent * 100 (Value 3000 =>
      // 30% of ATK). Artoria's NP at lvl 1: 3000 (= 30% AoE damage).
      return `${value / 100}%`;
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
  renderSkillDetail(skill: Skill | NoblePhantasm, level: number): string {
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
   * Atlas Academy resolves `{N}` placeholders in `skill.detail` for most
   * active skills, so the numeric values already appear inline (e.g.
   * "Increase Extra Attack Card's effectiveness by 50% for yourself").
   * For those skills the per-function effect chips would be redundant.
   *
   * Append/passive skills also inline numbers once `renderSkillDetail`
   * resolves them, so showing "Extra Attack Up: 50%" next to "by 50%" is
   * pure repetition.
   *
   * The remaining case — *active* skills where the description stays
   * qualitative ("Apply Ignore Invincible (1 turn) & increase Arts card
   * effectiveness (1 turn)") — is the one where the per-level chip list
   * adds real information ("Arts Up: 25%"). We detect it by stripping the
   * cosmetic `[...]` and `[{N}]` noise and checking whether either field
   * still contains a real `{N}` placeholder. If neither does, Atlas was
   * happy with the qualitative text and the chips add value.
   */
  shouldShowSkillEffects(skill: Skill | NoblePhantasm): boolean {
    const preRendered = (skill.detail || '').trim();
    const raw = skill.unmodifiedDetail || '';
    return !this.hasRealPlaceholder(preRendered) && !this.hasRealPlaceholder(raw);
  }

  /**
   * Returns true when `text` contains a placeholder that needs resolving
   * (e.g. `{N}` or `{{N:Value:flag}}`). Cosmetic brackets like `[{N}]` or
   * `[Demerit]` are stripped first since they don't carry a value to show.
   */
  private hasRealPlaceholder(text: string): boolean {
    if (!text) return false;
    const noBrackets = text.replace(/\[[^\]]*\]/g, '');
    return /\{\{|\{[A-Za-z0-9]+\}/.test(noBrackets);
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
  private resolveSkillPlaceholders(raw: string, skill: Skill | NoblePhantasm, level: number): string {
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
          if (sv && sv.Value !== undefined && sv.Value !== null) {
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

  /**
   * Returns the servant's class passive skills (e.g. Magic Resistance,
   * Riding, Territory Creation). Atlas ships them under
   * `detailedServant.classPassive` already shaped as `Skill[]` (they have
   * `type: 'passive'`, no cooldown, no `actIndividuality`).
   *
   * The English payload is preferred (fallback to JP) since class names use
   * the player's locale translation.
   */
  getServantClassPassives(
    detailedServant: DetailedServant,
    detailedServantEnglish: DetailedServant
  ): Skill[] {
    const source = detailedServantEnglish?.classPassive?.length
      ? detailedServantEnglish
      : detailedServant;
    return (source.classPassive ?? []).slice();
  }

  /**
   * Returns the servant's Noble Phantasms, each rendered with all of its
   * strengthenings (priority > 1 versions). The English payload is
   * preferred when present; otherwise the JP payload is returned as-is.
   *
   * We don't filter by `priority === 1` because the API only includes
   * a single NP entry unless strengthenings exist, in which case each
   * strengthening is a separate entry sharing the same `num`. Sorting by
   * `priority` keeps the base at index 0.
   */
  getServantNoblePhantasms(
    detailedServant: DetailedServant,
    detailedServantEnglish: DetailedServant
  ): NoblePhantasm[] {
    const source = detailedServantEnglish?.noblePhantasms?.length
      ? detailedServantEnglish
      : detailedServant;
    return (source.noblePhantasms ?? [])
      .slice()
      .sort((a, b) => a.priority - b.priority);
  }

  /**
   * Returns the human label for a NP version tab. When the API ships the
   * same `name` for both base and strengthened versions (Ozymandias' NP is
   * "Ramesseum Tentyris" twice in EN, for example), we suffix the
   * strengthened copy with "+" so users can distinguish them.
   */
  getNoblePhantasmVersionLabel(version: NoblePhantasm, vi: number): string {
    const name = (version.name || '').trim();
    if (vi === 0) return name || 'NP';
    return `${name || 'NP'}+`;
  }

  /**
   * Same NP-level rendering as skills, but indexed by NP level (1-5) rather
   * than skill level. The output is structurally identical to
   * `renderSkillEffects`, so the same chip UI works.
   */
  renderNoblePhantasmEffects(np: NoblePhantasm, npLevel: number): SkillEffect[] {
    const idx = Math.max(0, Math.min(4, npLevel - 1));
    const effects: SkillEffect[] = [];
    for (const fn of np.functions ?? []) {
      const sv: Sval | undefined = fn.svals?.[idx];
      if (!sv || sv.Value === undefined || sv.Value === null) continue;
      const name = this.getFunctionLabel(fn);
      const value = this.formatSkillSvalValue(sv.Value, fn.funcType);
      const effect: SkillEffect = { name, value, funcType: fn.funcType };
      if (sv.Turn && sv.Turn > 0) effect.turn = sv.Turn;
      if (sv.Count && sv.Count > 0) effect.count = sv.Count;
      if (sv.Value2 !== undefined && sv.Value2 !== null && sv.Value2 !== sv.Value) {
        effect.value2 = this.formatSkillSvalValue(sv.Value2, fn.funcType);
      }
      const icon = fn.buffs?.[0]?.icon;
      if (icon) effect.icon = icon;
      effects.push(effect);
    }
    return effects;
  }

  /**
   * For each NP function that scales with overcharge, returns a row
   * describing the function value at each OC tier at the supplied NP level.
   * Functions that aren't affected by overcharge are excluded.
   *
   * Atlas semantics (confirmed by Atlas openapi.json `NiceFunction` schema):
   *   - `svals[i]`    = value at NP level `i+1`, **OC tier 1** (base overcharge)
   *   - `svals2[i]`   = value at NP level `i+1`, OC tier 2
   *   - `svals3[i]`   = value at NP level `i+1`, OC tier 3
   *   - `svals4[i]`   = value at NP level `i+1`, OC tier 4
   *   - `svals5[i]`   = value at NP level `i+1`, OC tier 5
   *
   * FGO's in-game OC display goes from 1 to 5, where OC 1 is the minimum
   * overcharge (== `svals`) and OC 5 is the maximum (== `svals5`). Higher
   * tiers whose svals array is missing are filled by the previous tier's
   * value (the game shows the same number for higher OC when scaling
   * plateaus).
   */
  renderNoblePhantasmOvercharge(np: NoblePhantasm, npLevel = 1): NoblePhantasmOverchargeEffect[] {
    const idx = Math.max(0, Math.min(4, npLevel - 1));
    const out: NoblePhantasmOverchargeEffect[] = [];
    for (const fn of np.functions ?? []) {
      const svalsByTier: (Sval | undefined)[][] = [
        fn.svals ?? [],
        fn.svals2 ?? [],
        fn.svals3 ?? [],
        fn.svals4 ?? [],
        fn.svals5 ?? [],
      ];

      // Build per-OC-tier (1..5) string. Tier N uses svals(N)[idx]; if missing,
      // fall back to the previous (lower) tier array.
      const tiers: string[] = [];
      let lastValue: Sval | undefined;
      for (let t = 0; t < 5; t++) {
        const arr = svalsByTier[t];
        const v = arr ? arr[idx] : undefined;
        const effective = v ?? lastValue;
        tiers.push(this.formatSvalEntry(effective, fn.funcType));
        if (v) lastValue = v;
      }

      // Determine whether any higher OC tier differs from OC tier 1. If not,
      // the function isn't truly OC-scaled and we skip it.
      const baseVal = svalsByTier[0][idx];
      const differsAcrossHigherTiers =
        svalsByTier[1].some((sv, i) => this.svalsDiffer(sv, svalsByTier[0][i]))
        || svalsByTier[2].some((sv, i) => this.svalsDiffer(sv, svalsByTier[1][i]))
        || svalsByTier[3].some((sv, i) => this.svalsDiffer(sv, svalsByTier[2][i]))
        || svalsByTier[4].some((sv, i) => this.svalsDiffer(sv, svalsByTier[3][i]));
      if (!differsAcrossHigherTiers) continue;

      const variesByTier = tiers.some((v, i) => i > 0 && v !== tiers[0]);

      out.push({
        name: this.getFunctionLabel(fn),
        tiers,
        variesByTier,
        funcType: fn.funcType,
      });
    }
    return out;
  }

  /** Returns true when two `Sval` entries differ in any meaningful field. */
  private svalsDiffer(a?: Sval, b?: Sval): boolean {
    if (!a && !b) return false;
    if (!a || !b) return true;
    return a.Value !== b.Value || a.Rate !== b.Rate;
  }

  /** Formats a single `Sval` entry (returns '—' when undefined / no Value / no Rate). */
  private formatSvalEntry(sv: Sval | undefined, funcType?: string): string {
    if (!sv) return '—';
    if (sv.Value !== undefined && sv.Value !== null) {
      return this.formatSkillSvalValue(sv.Value, funcType);
    }
    if (sv.Rate !== undefined && sv.Rate !== null) {
      return this.formatSvalRate(sv, funcType) ?? '—';
    }
    return '—';
  }

  /** Formats a `Rate` (probability) as percentage. Returns null if no Rate. */
  private formatSvalRate(sv: Sval | undefined, _funcType?: string): string | null {
    if (!sv || sv.Rate === undefined || sv.Rate === null) return null;
    return `${(sv.Rate / 10).toFixed(0)}%`;
  }
}
