import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
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
    const primary =
      this.server === 'JP'
        ? `https://api.atlasacademy.io/nice/JP/servant/${id}?lore=true&lang=en`
        : `https://api.atlasacademy.io/nice/NA/servant/${id}?lore=true`;
    return this.fetchWithFallback(primary, id, /* english */ false);
  }

  getDetailedInfoEnglish(id: number): Observable<any> {
    return this.fetchWithFallback(
      `https://api.atlasacademy.io/nice/NA/servant/${id}?lore=true`,
      id,
      /* english */ true
    );
  }

  private fetchWithFallback(
    primaryUrl: string,
    id: number,
    english: boolean
  ): Observable<any> {
    return this.http.get<any>(primaryUrl).pipe(
      switchMap((data) => {
        // NA returns a 404 payload as { detail: 'Svt not found' } — treat as
        // missing and fall back to JP. JP payloads always have an id.
        if (data && data.id) {
          return of(data);
        }
        const jpUrl = english
          ? `https://api.atlasacademy.io/nice/JP/servant/${id}?lore=true&lang=en`
          : `https://api.atlasacademy.io/nice/JP/servant/${id}?lore=true&lang=en`;
        return this.http.get<any>(jpUrl);
      }),
      catchError(() => {
        const jpUrl = `https://api.atlasacademy.io/nice/JP/servant/${id}?lore=true&lang=en`;
        return this.http.get<any>(jpUrl);
      })
    );
  }

  getFunction(integer: number): Observable<any> {
    return this.http.get<any>(
      `https://api.atlasacademy.io/nice/JP/function/${integer}?reverseDepth=function&reverseData=nice&lang=en`
    );
  }
}
