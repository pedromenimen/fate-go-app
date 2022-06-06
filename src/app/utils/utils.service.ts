import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class UtilsService {
  constructor() {}

  getCostumeNames(servantDetailedInfo: any): string[] {
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

  getServantImages(servantDetailedInfo: any): string[] | unknown[] {
    const ascensionImages = Object.values(
      servantDetailedInfo.extraAssets.charaGraph.ascension
    );
    var servantImages: string[] | unknown[] = [];
    servantImages = [...ascensionImages];
    Object.keys(servantDetailedInfo.extraAssets.charaGraph).includes('costume')
      ? (servantImages = [
          ...servantImages,
          ...Object.values(servantDetailedInfo.extraAssets.charaGraph.costume),
        ])
      : null;
    return servantImages;
  }
}