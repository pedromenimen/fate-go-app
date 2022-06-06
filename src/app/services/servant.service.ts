import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Servant } from '../types/servant-type';

@Injectable({
  providedIn: 'root',
})
export class ServantService {
  server: string = '';
  servantId: number = 0;
  constructor(private http: HttpClient) {}
  basicApiUrlNA = 'https://api.atlasacademy.io/export/NA/basic_servant.json';
  basicApiUrlJP =
    'https://api.atlasacademy.io/export/JP/basic_servant_lang_en.json';
  getServantList(): Observable<Servant[]> {
    this.server = localStorage.getItem('server')!;
    return this.http.get<Servant[]>(
      this.server === 'JP' ? this.basicApiUrlJP : this.basicApiUrlNA
    );
  }

  getDetailedSevantInfo(id: number): Observable<any> {
    this.servantId = id;
    this.server = localStorage.getItem('server')!;
    return this.http.get<any>(
      this.server === 'JP'
        ? `https://api.atlasacademy.io/nice/JP/servant/${this.servantId}?lore=true&lang=en`
        : `https://api.atlasacademy.io/nice/NA/servant/${this.servantId}?lore=true`
    );
  }
}
