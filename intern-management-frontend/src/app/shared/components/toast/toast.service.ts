import { Injectable, inject, signal } from '@angular/core';
import { PlatformCheckService } from '@core/services/platform-check.service';

export type ToastKind = 'success' | 'error';

export interface ToastMessage {
  id: number;
  kind: ToastKind;
  message: string;
}

/**
 * Tiny stand-in for the snackbar the template doesn't have (no Angular Material
 * here). Components push a message, the single `<toast/>` host in `app.ts`
 * renders the stack — so pages never need their own one-off banners.
 */
@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private platformCheck = inject(PlatformCheckService);
  private readonly state = signal<ToastMessage[]>([]);
  private nextId = 1;

  public readonly toasts = this.state.asReadonly();

  success(message: string): void {
    this.push('success', message);
  }

  error(message: string): void {
    this.push('error', message);
  }

  dismiss(id: number): void {
    this.state.update(list => list.filter(toast => toast.id !== id));
  }

  private push(kind: ToastKind, message: string): void {
    const id = this.nextId++;
    this.state.update(list => [...list, { id, kind, message }]);

    // Auto-dismiss only in the browser: a pending timer on the server would
    // outlive the render for no reason. Errors stay up longer — they usually
    // need reading (or copying) before they vanish.
    if (this.platformCheck.onBrowser) {
      setTimeout(() => this.dismiss(id), kind === 'error' ? 6000 : 3500);
    }
  }
}
