import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '@env/environment';
import { Batch, BatchOverview, BatchRequest } from '@data/schema/batch/batch';

/**
 * Single entry point for `/api/batches` calls — components never touch
 * HttpClient directly. List state is held in a signal so the batch list, the
 * overview and the intern form's batch dropdown all read the same data.
 */
@Injectable({
  providedIn: 'root'
})
export class BatchService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiBaseUrl}/batches`;

  private readonly state = signal<Batch[]>([]);
  public readonly batches = this.state.asReadonly();

  /**
   * `GET /api/batches`. Response is cached in the `batches` signal so a second
   * component mount doesn't refetch the same list.
   */
  list(): Observable<Batch[]> {
    return this.http.get<Batch[]>(this.baseUrl).pipe(
      tap(batches => this.state.set(batches))
    );
  }

  /** `GET /api/batches/{id}` — the batch plus its interns. */
  getOverview(id: number): Observable<BatchOverview> {
    return this.http.get<BatchOverview>(`${this.baseUrl}/${id}`);
  }

  /**
   * `POST /api/batches`. The request carries only `startDate`; the backend
   * returns the persisted batch with its calculated `endDate`, and we refresh
   * the cached list so the intern form's dropdown sees the new batch.
   */
  create(request: BatchRequest): Observable<Batch> {
    return this.http.post<Batch>(this.baseUrl, request).pipe(
      tap(() => this.list().subscribe())
    );
  }
}
