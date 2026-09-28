import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  inject,
  signal
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BatchService } from '@core/services/batch.service';
import { apiErrorMessage } from '@core/utils/api-error.util';
import { Batch } from '@data/schema/batch/batch';
import { Spinner } from '@shared/components/spinner/spinner';
import { ToastService } from '@shared/components/toast/toast.service';

@Component({
  selector: 'batch-form',
  imports: [ReactiveFormsModule, RouterLink, Spinner],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  template: `<div class="flex max-w-xl flex-col gap-6">
    <div>
      <h1 class="font-bold text-xl sm:text-3xl dark:text-white text-gray-900">Create batch</h1>
      <p class="mt-1 text-sm dark:text-gray-300 text-gray-700">
        Pick a start date — the end date is worked out by the backend.
      </p>
    </div>

    <form [formGroup]="form" (ngSubmit)="submit()" class="flex flex-col gap-4">
      <label class="flex flex-col gap-1">
        <span class="text-sm font-medium dark:text-gray-200 text-gray-700">Start date</span>
        <input
          type="date"
          formControlName="startDate"
          class="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-700"
        />
        @if (startDateInvalid) {
          <span class="text-sm text-red-600 dark:text-red-400">A start date is required.</span>
        }
      </label>

      <div class="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          [disabled]="saving()"
          class="bg-primary flex w-full items-center justify-center gap-2 rounded-lg px-5 py-2 text-white hover:bg-primary-800 dark:hover:bg-primary-400 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          @if (saving()) {
            <spinner [size]="14" />
          }
          {{ saving() ? 'Creating…' : 'Create batch' }}
        </button>
        <a
          routerLink="/batch"
          class="text-sm dark:text-gray-300 text-gray-700 hover:text-primary dark:hover:text-primary-400"
          >Back to list</a
        >
      </div>
    </form>

    @if (error()) {
      <p
        class="rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/30 px-3 py-2 text-sm text-red-700 dark:text-red-300"
      >
        {{ error() }}
      </p>
    }

    @if (created(); as batch) {
      <div class="rounded-lg border border-gray-200 dark:border-gray-800 px-4 py-3 text-sm">
        <p class="font-medium dark:text-white text-gray-900">Batch #{{ batch.id }} created.</p>
        <!-- endDate is the value the backend stored (startDate + 6 months). -->
        <p class="mt-1 dark:text-gray-300 text-gray-700">
          Runs {{ batch.startDate }} → {{ batch.endDate }}
        </p>
        <a [routerLink]="['/batch', batch.id]" class="mt-2 inline-block text-primary hover:underline"
          >Open batch overview</a
        >
      </div>
    }
  </div>`
})
export class BatchForm {
  private fb = inject(FormBuilder);
  private batchService = inject(BatchService);
  private toast = inject(ToastService);

  saving = signal<boolean>(false);
  error = signal<string | null>(null);
  created = signal<Batch | null>(null);

  form = this.fb.nonNullable.group({
    startDate: ['', Validators.required]
  });

  get startDateInvalid(): boolean {
    const control = this.form.controls.startDate;
    return control.invalid && (control.dirty || control.touched);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    this.created.set(null);

    // The end date shown below is read back off the created batch, not computed
    // here: BatchServiceImpl owns the "+6 months" rule, and a local `plusMonths(6)`
    // would quietly disagree with it the day the program length changes.
    this.batchService.create({ startDate: this.form.getRawValue().startDate }).subscribe({
      next: batch => {
        this.saving.set(false);
        this.created.set(batch);
        this.toast.success(`Batch #${batch.id} created.`);
        this.form.reset({ startDate: '' });
      },
      error: err => {
        this.saving.set(false);
        this.error.set(apiErrorMessage(err));
        this.toast.error(apiErrorMessage(err));
      }
    });
  }
}
