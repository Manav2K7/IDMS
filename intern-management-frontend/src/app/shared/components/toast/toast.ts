import { ChangeDetectionStrategy, Component, ViewEncapsulation, inject } from '@angular/core';
import { ToastService } from '@shared/components/toast/toast.service';

@Component({
  selector: 'toast',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  template: `<div
    role="status"
    aria-live="polite"
    class="fixed right-4 top-4 z-[3] flex w-[min(20rem,calc(100vw-2rem))] flex-col gap-2"
  >
    @for (toast of toasts(); track toast.id) {
      <div
        class="flex items-start gap-2 rounded-lg border px-4 py-3 text-sm shadow-lg"
        [class]="
          toast.kind === 'success'
            ? 'border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-900/40 text-green-800 dark:text-green-200'
            : 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/40 text-red-800 dark:text-red-200'
        "
      >
        <span class="flex-1">{{ toast.message }}</span>
        <button
          type="button"
          aria-label="Dismiss"
          (click)="dismiss(toast.id)"
          class="cursor-pointer opacity-60 hover:opacity-100"
        >
          ✕
        </button>
      </div>
    }
  </div>`
})
export class Toast {
  private toastService = inject(ToastService);

  toasts = this.toastService.toasts;

  dismiss(id: number): void {
    this.toastService.dismiss(id);
  }
}
