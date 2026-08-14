export interface SimpleServant {
  id: number;
  collectionNo: number;
  name: string;
  type: string;
  flag: string;
  className: string;
  attribute: string;
  rarity: number;
  atkMax: number;
  hpMax: number;
  face: string;
  costume: {
    [key: string]: {
      id: number;
      costumeCollectionNo: number;
      battleCharaId: number;
      shortName: string;
    };
  };
}
// A tipagem completa de acordo com a documentação da API (https://api.atlasacademy.io/rapidoc) no endpoint
// /nice/JP/servant/<:id> tem quase 10 mil linhas, tipei o que considerei proveitoso para o front end

/**
 * Per-level parameter bag for a function.
 * Mirrors the `Vals` schema (https://api.atlasacademy.io/docs) — most fields are
 * optional because each `funcType` consumes only a subset.
 * Values are stored as integers; divide by 100 for percentages (Rate/Value) and
 * by 10 for `addState`/`subState` probabilities. See `formatSkillSvalValue` in
 * `utils.service.ts` for the runtime normalization.
 */
export interface Sval {
  Value?: number | null;
  Value2?: number | null;
  Rate?: number | null;
  Turn?: number | null;
  Count?: number | null;
  UseRate?: number | null;
  Target?: number | null;
  Correction?: number | null;
  ParamAdd?: number | null;
  ParamMax?: number | null;
}

/**
 * A trait reference used across the schema (skills, functions, buffs, svts).
 */
export interface NiceTrait {
  id: number;
  name: string;
  negative?: boolean | null;
}

/**
 * Buff object resolved by a `function.buffs[0]` reference.
 */
export interface NiceBuff {
  id: number;
  name: string;
  originalName: string;
  detail: string;
  icon?: string | null;
  type: string;
  buffGroup: number;
  maxRate: number;
  vals: NiceTrait[];
  tvals: NiceTrait[];
  ckSelfIndv: NiceTrait[];
  ckOpIndv: NiceTrait[];
}

/**
 * Group metadata returned with some special functions (event drop up, bond
 * point up, etc.).
 */
export interface FuncGroup {
  eventId: number;
  baseFuncId: number;
  nameTotal: string;
  name: string;
  icon?: string | null;
  priority: number;
  isDispValue: boolean;
}
export interface Costume {
  [key: string]: {
    id: number;
    costumeCollectionNo: number;
    battleCharaId: number;
    name: string;
    shortName: string;
    detail: string;
    priority: number;
  };
}

export interface Function {
  funcId: number;
  funcType: string;
  funcTargetType: string;
  /** "player" | "enemy" | "playerAndEnemy" */
  funcTargetTeam: string;
  /** Human-readable effect name (e.g. "NP Gain", "Atk Up"). */
  funcPopupText: string;
  funcPopupIcon?: string | null;
  functvals: NiceTrait[];
  /** Two-dimensional trait list that overrides `functvals` if present. */
  overWriteTvalsList: NiceTrait[][];
  funcquestTvals: NiceTrait[];
  funcGroup: FuncGroup[];
  traitVals: NiceTrait[];
  /** Most functions that apply a buff have exactly one entry here. */
  buffs: NiceBuff[];
  /** Values per skill level (index = level - 1). */
  svals: Sval[];
  /** NP Overcharge tier 2 values, per NP level. Only set for TDs. */
  svals2?: Sval[] | null;
  svals3?: Sval[] | null;
  svals4?: Sval[] | null;
  svals5?: Sval[] | null;
  /** Override values when used by a support servant (e.g. Chaldea Teatime). */
  followerVals?: Sval[] | null;
}

export interface Skill {
  id: number;
  num: number;
  name: string;
  originalName: string;
  ruby: string;
  detail: string;
  unmodifiedDetail: string;
  type: string;
  strengthStatus: number;
  priority: number;
  condQuestId: number;
  condQuestPhase: number;
  condLv: number;
  condLimitCount: number;
  icon: string;
  coolDown: Array<number>;
  actIndividuality: NiceTrait[];
  script: object;
  extraPassive: Array<any>;
  skillAdd: Array<any>;
  functions: Array<Function>;
}

export interface Profile {
  costume: Costume;
}

export interface AppendPassive {
  num: number;
  priority: number;
  skill: Skill;
  unlockMaterials: ItemAmount[];
}

export interface ItemAmount {
  item: { id: number; name: string; type: string };
  amount: number;
}

/**
 * NP gain distribution per card type at each NP level (1-5).
 * Keys are card types: "buster" | "arts" | "quick" | "extra" | "defence" | "np".
 * Values are arrays of 5 ints (one per NP level), in percent * 100 (e.g.
 * `buster: [8600, 8600, ...]` = 86% NP gain on a Buster hit at any level).
 */
export interface NpGain {
  buster?: number[];
  arts?: number[];
  quick?: number[];
  extra?: number[];
  defence?: number[];
  np?: number[];
}

/**
 * Noble Phantasm descriptor returned by Atlas Academy. The shape mirrors the
 * `nice/NP` endpoint, kept minimal here — only fields the UI consumes.
 *
 * Most of the data lives in `functions[]` (a `Function[]` with `svals` per NP
 * level instead of per skill level), so the skill chip renderer can be reused
 * as long as we treat NP-level as the indexing unit.
 */
export interface NoblePhantasm {
  id: number;
  num: number;
  /** NP chain/hit count (1 = single, 2 = double, 3 = triple). */
  npNum: number;
  /** Card type of the NP: "buster" | "arts" | "quick". */
  card: string;
  name: string;
  originalName: string;
  ruby?: string;
  icon: string;
  /** Rank letter (e.g. "A", "A+", "EX"). */
  rank: string;
  /** Localised effect flag summary (Atlas returns a translated summary here). */
  effectFlags?: string;
  detail: string;
  unmodifiedDetail: string;
  npGain: NpGain;
  /** Hit distribution percentages per NP chain (e.g. [100] for single hit). */
  npDistribution: number[];
  strengthStatus: number;
  priority: number;
  condQuestId: number;
  condQuestPhase: number;
  condLv: number;
  condLimitCount: number;
  /** Traits the NP applies or targets (e.g. "attackMagical", "cardBuster"). */
  individuality: NiceTrait[];
  /** Activation traits — conditions the target must meet for the NP to land. */
  actIndividuality: NiceTrait[];
  /** No real cooldown for NPs; kept for parity with Skill. Always zeros. */
  coolDown: number[];
  functions: Function[];
}

export interface Ascension {
  [key: string]: string;
}

// `extraAssets.charaGraph.costume` (and friends) maps costume id -> image URL,
// which is just a string. `profile.costume` is a different shape (an object
// with metadata), so we keep the original `Costume` interface for that one.
export interface CostumeAssetMap {
  [key: string]: string;
}
export interface CostumeImage extends Ascension {}
export interface Story extends Ascension {}

export interface ExtraAssets {
  charaGraph: {
    ascension: Ascension;
    costume: CostumeAssetMap;
  };
  faces: {
    ascension: Ascension;
    costume: CostumeAssetMap;
  };
  charaGraphEx: {};
  charaGraphName: {};
  narrowFigure: {
    ascension: Ascension;
    costume: CostumeAssetMap;
  };
  charaFigure: {
    ascension: {};
    story: Story;
    costume: CostumeImage;
  };
  charaFigureForm: {};
  charaFigureMulti: {};
  commands: {
    ascension: {};
    costume: CostumeImage;
  };
  status: {
    ascension: {};
    costume: CostumeImage;
  };
  equipFace: {};
  image: { story: {} };
  spriteModel: {
    ascension: Ascension;
    costume: CostumeImage;
  };
  charaGraphChange: {};
  narrowFigureChange: {};
  facesChange: {};
}

export interface DetailedServant {
  id: number;
  collectionNo: number;
  name: string;
  originalName: string;
  ruby: string;
  battleName: string;
  originalBattleName: string;
  className: string;
  type: string;
  flag: string;
  rarity: number;
  cost: number;
  lvMax: number;
  extraAssets: ExtraAssets;
  gender: string;
  attribute: string;
  traits: Array<any>;
  starAbsorb: number;
  starGen: number;
  instantDeathChance: number;
  cards: Array<any>;
  hitsDistribution: object;
  cardDetails: object;
  atkBase: number;
  atkMax: number;
  hpBase: number;
  hpMax: number;
  relateQuestIds: Array<any>;
  trialQuestIds: Array<any>;
  growthCurve: number;
  atkGrowth: Array<any>;
  hpGrowth: Array<any>;
  bondGrowth: Array<any>;
  expGrowth: Array<any>;
  expFeed: Array<any>;
  bondEquip: number;
  valentineEquip: Array<any>;
  valentineScript: Array<any>;
  bondEquipOwner: number;
  valentineEquipOwner: number;
  ascensionAdd: object;
  traitAdd: Array<any>;
  svtChange: Array<any>;
  ascensionImage: Array<any>;
  ascensionMaterials: object;
  skillMaterials: object;
  appendSkillMaterials: object;
  costumeMaterials: object;
  coin: object;
  script: object;
  skills: Array<Skill>;
  /** Class-wide passive skills (e.g. Magic Resistance, Riding). */
  classPassive: Array<Skill>;
  /** Extra passive skills granted to specific servants (often redundant with append). */
  extraPassive: Array<any>;
  appendPassive: Array<AppendPassive>;
  noblePhantasms: Array<NoblePhantasm>;
  profile: Profile;
}
