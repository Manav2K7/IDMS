import { Injectable, signal } from '@angular/core';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

interface ConfirmState extends ConfirmOptions {
  resolve: (confirmed: boolean) => void;
}

/**
 * Promise-based confirmation so callers read as a straight line:
 *
 *   if (!(await this.confirm.confirm({...}))) return;
 *   this.internService.delete(id).subscribe(...)
 *
 * The `<confirm-dialog/>` host in `app.ts` owns the markup.
 */
@Injectable({
  providedIn: 'root'
})
export class ConfirmDialogService {
  private readonly state = signal<ConfirmState | null>(null);
  public readonly current = this.state.asReadonly();

  confirm(options: ConfirmOptions): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      this.state.set({ ...options, resolve });
    });
  }

  /** Called by the host when either button (or the backdrop) is used. */
  respond(confirmed: boolean): void {
    const state = this.state();
    this.state.set(null);
    state?.resolve(confirmed);
  }
}
