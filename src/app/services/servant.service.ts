import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SimpleServant } from '../types/servant-type';

@Injectable({
  providedIn: 'root',
})
export class ServantService {
  server: string = '';
  constructor(private http: HttpClient) {}
  basicApiUrlNA = 'https://api.atlasacademy.io/export/NA/basic_servant.json';
  basicApiUrlJP =
    'https://api.atlasacademy.io/export/JP/basic_servant_lang_en.json';
  getServantList(): Observable<SimpleServant[]> {
    this.server = localStorage.getItem('server')!;
    return this.http.get<SimpleServant[]>(
      this.server === 'JP' ? this.basicApiUrlJP : this.basicApiUrlNA
    );
  }

  getDetailedSevantInfo(id: number): Observable<any> {
    this.server = localStorage.getItem('server')!;
    return this.http.get<any>(
      this.server === 'JP'
        ? `https://api.atlasacademy.io/nice/JP/servant/${id}?lore=true&lang=en`
        : `https://api.atlasacademy.io/nice/NA/servant/${id}?lore=true`
    );
  }

  getDetailedInfoEnglish(id: number): Observable<any> {
    return this.http.get<any>(
      `https://api.atlasacademy.io/nice/NA/servant/${id}?lore=true`
    );
  }

  getFunction(integer: number): Observable<any> {
    return this.http.get<any>(
      `https://api.atlasacademy.io/nice/JP/function/${integer}?reverseDepth=function&reverseData=nice&lang=en`
    );
  }
}
