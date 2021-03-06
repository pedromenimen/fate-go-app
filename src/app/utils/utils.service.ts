import { Injectable } from '@angular/core';
import { DetailedServant, Skill } from './../types/servant-type';

@Injectable({
  providedIn: 'root',
})
export class UtilsService {
  constructor() {}

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

  getServantImages(servantDetailedInfo: DetailedServant): string[] | unknown[] {
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

  getServantActiveSkills(
    detailedServant: DetailedServant,
    detailedServantEnglish: DetailedServant
  ): Array<Skill> {
    if (detailedServant.skills.length > detailedServantEnglish.skills.length) {
      let englishSkills = detailedServantEnglish.skills;
      let japanese_skills = detailedServant.skills.splice(
        detailedServantEnglish.skills.length,
        detailedServant.skills.length - detailedServantEnglish.skills.length
      );
      return [...new Set([...englishSkills, ...japanese_skills])];
    } else {
      return detailedServantEnglish.skills;
    }
  }
}
