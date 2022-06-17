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

export interface Sval {
  Rate: number;
  Turn: number;
  Count: number;
  Value: number;
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
  funcTargetTeam: string;
  funcPopupText: string;
  funcPopupIcon: string;
  functvals: Array<any>;
  funcquestTvals: Array<any>;
  funcGroup: Array<any>;
  buffs: Array<any>;
  svals: Array<Sval>;
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
  actIndividuality: Array<any>;
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
  unlockMaterials: Array<any>;
}

export interface Ascension {
  [key: string]: string;
}

export interface CostumeImage extends Ascension {}
export interface Story extends Ascension {}

export interface ExtraAssets {
  charaGraph: {
    ascension: Ascension;
    costume: Costume;
  };
  faces: {
    ascension: Ascension;
    costume: Costume;
  };
  charaGraphEx: {};
  charaGraphName: {};
  narrowFigure: {
    ascension: Ascension;
    costume: Costume;
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
  classPassive: Array<any>;
  extraPassive: Array<any>;
  appendPassive: Array<AppendPassive>;
  noblePhantasms: Array<any>;
  profile: Profile;
}
