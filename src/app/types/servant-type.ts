export interface Servant {
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
