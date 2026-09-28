import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '@env/environment';
import {
  Intern,
  InternFilters,
  InternRequest,
  InternUpdateRequest
} from '@data/schema/intern/intern';

/**
 * Single entry point for `/api/interns` calls.
 *
 * The active filter set is kept in the service (not just in the list component)
 * so that update/delete can refresh the list the user is actually looking at
 * instead of silently resetting their search.
 */
@Injectable({
  providedIn: 'root'
})
export class InternService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiBaseUrl}/interns`;

  private readonly state = signal<Intern[]>([]);
  private readonly filterState = signal<InternFilters>({});

  public readonly interns = this.state.asReadonly();
  public readonly filters = this.filterState.asReadonly();

  /**
   * `GET /api/interns`. All three filters are optional and the backend treats
   * a blank string as "no filter" — but an empty query param still shows up in
   * the URL and the request cache, so blank values are dropped instead of sent.
   */
  list(filters: InternFilters = {}): Observable<Intern[]> {
    return this.http.get<Intern[]>(this.baseUrl, { params: this.toParams(filters) }).pipe(
      tap(interns => {
        this.filterState.set(filters);
        this.state.set(interns);
      })
    );
  }

  /** Re-runs the last `list()` call — used after a create/update/delete. */
  refresh(): Observable<Intern[]> {
    return this.list(this.filterState());
  }

  /** `GET /api/interns/{id}`. */
  get(id: number): Observable<Intern> {
    return this.http.get<Intern>(`${this.baseUrl}/${id}`);
  }

  /**
   * `POST /api/interns` — the payload has no `internId`; the backend generates
   * it (TDA/EMP + join date + sequence) and returns it on the created record.
   */
  create(request: InternRequest): Observable<Intern> {
    return this.http.post<Intern>(this.baseUrl, request);
  }

  /**
   * `PUT /api/interns/{id}`. Only name/email/mobile are accepted; `internId`,
   * `batchId`, `idCardType` and `dateOfJoining` stay immutable.
   */
  update(id: number, request: InternUpdateRequest): Observable<Intern> {
    return this.http.put<Intern>(`${this.baseUrl}/${id}`, request);
  }

  /** `DELETE /api/interns/{id}` — responds 204 with an empty body. */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  private toParams(filters: InternFilters): HttpParams {
    let params = new HttpParams();
    if (filters.name) {
      params = params.set('name', filters.name);
    }
    if (filters.batchId != null) {
      params = params.set('batchId', filters.batchId);
    }
    if (filters.idCardType) {
      params = params.set('idCardType', filters.idCardType);
    }
    return params;
  }
}
