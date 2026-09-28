import { ChangeDetectionStrategy, Component, ViewEncapsulation, inject } from '@angular/core';
import { ConfirmDialogService } from '@shared/components/confirm-dialog/confirm-dialog.service';

@Component({
  selector: 'confirm-dialog',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  template: `@if (dialog(); as state) {
    <div
      class="fixed inset-0 z-[4] flex items-center justify-center bg-black/50 p-4"
      (click)="cancel()"
    >
      <div
        role="alertdialog"
        aria-modal="true"
        class="w-full max-w-sm rounded-lg bg-white p-5 shadow-xl dark:bg-gray-800"
        (click)="$event.stopPropagation()"
      >
        <h2 class="text-lg font-bold dark:text-white text-gray-900">{{ state.title }}</h2>
        <p class="mt-2 text-sm dark:text-gray-300 text-gray-700">{{ state.message }}</p>
        <div class="mt-5 flex justify-end gap-2">
          <button
            type="button"
            (click)="cancel()"
            class="rounded-lg px-4 py-2 text-sm dark:text-gray-200 text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {{ state.cancelLabel || 'Cancel' }}
          </button>
          <button
            type="button"
            (click)="confirm()"
            class="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
          >
            {{ state.confirmLabel || 'Confirm' }}
          </button>
        </div>
      </div>
    </div>
  }`
})
export class ConfirmDialog {
  private confirmDialogService = inject(ConfirmDialogService);

  dialog = this.confirmDialogService.current;

  confirm(): void {
    this.confirmDialogService.respond(true);
  }

  cancel(): void {
    this.confirmDialogService.respond(false);
  }
}
