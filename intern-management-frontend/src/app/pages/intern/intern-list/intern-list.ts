import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  ViewEncapsulation,
  computed,
  inject,
  signal
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { BatchService } from '@core/services/batch.service';
import { InternService } from '@core/services/intern.service';
import { apiErrorMessage } from '@core/utils/api-error.util';
import { IdCardType, Intern } from '@data/schema/intern/intern';
import { ConfirmDialogService } from '@shared/components/confirm-dialog/confirm-dialog.service';
import { Loader } from '@shared/components/loader/loader';
import { ToastService } from '@shared/components/toast/toast.service';

const INPUT_CLASS =
  'w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-700';

@Component({
  selector: 'intern-list',
  imports: [ReactiveFormsModule, RouterLink, Loader],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  template: `<div class="flex flex-col gap-6">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 class="font-bold text-xl sm:text-3xl dark:text-white text-gray-900">Interns</h1>
        <p class="mt-1 text-sm dark:text-gray-300 text-gray-700">
          Every intern belongs to a batch and has a backend-generated intern ID.
        </p>
      </div>
      <a
        routerLink="/intern/new"
        class="bg-primary w-full rounded-lg px-5 py-2 text-center text-white hover:bg-primary-800 dark:hover:bg-primary-400 sm:w-auto"
        >Register intern</a
      >
    </div>

    @if (error()) {
      <p
        class="rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/30 px-3 py-2 text-sm text-red-700 dark:text-red-300"
      >
        {{ error() }}
      </p>
    }

    <!-- Filters are sent to the backend as query params (name / batchId / idCardType). -->
    <form [formGroup]="filterForm" class="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <label class="flex flex-col gap-1">
        <span class="text-sm font-medium dark:text-gray-200 text-gray-700">Search by name</span>
        <input
          type="search"
          formControlName="name"
          placeholder="e.g. Ada"
          [class]="inputClass"
        />
      </label>

      <label class="flex flex-col gap-1">
        <span class="text-sm font-medium dark:text-gray-200 text-gray-700">Batch</span>
        <select formControlName="batchId" [class]="inputClass">
          <option [ngValue]="null">All batches</option>
          @for (batch of batches(); track batch.id) {
            <option [ngValue]="batch.id">#{{ batch.id }} · {{ batch.startDate }}</option>
          }
        </select>
      </label>

      <label class="flex flex-col gap-1">
        <span class="text-sm font-medium dark:text-gray-200 text-gray-700">ID card type</span>
        <select formControlName="idCardType" [class]="inputClass">
          <option [ngValue]="null">All types</option>
          @for (type of idCardTypes; track type) {
            <option [ngValue]="type">{{ type }}</option>
          }
        </select>
      </label>

      @if (hasActiveFilters()) {
        <div class="sm:col-span-3">
          <button
            type="button"
            (click)="clearFilters()"
            class="rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm dark:text-gray-200 text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Clear filters
          </button>
        </div>
      }
    </form>

    @if (loading()) {
      <loader />
    } @else if (!interns().length) {
      @if (hasActiveFilters()) {
        <p class="dark:text-gray-300 text-gray-700">No interns match these filters.</p>
      } @else {
        <p class="dark:text-gray-300 text-gray-700">No interns yet.</p>
      }
    } @else {
      <p class="text-sm dark:text-gray-400 text-gray-500">
        {{ interns().length }} {{ interns().length === 1 ? 'intern' : 'interns' }}
      </p>

      <div class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
        <table class="min-w-full text-left text-sm">
          <thead class="bg-gray-50 dark:bg-gray-800/60 dark:text-gray-200 text-gray-700">
            <tr>
              <th class="px-4 py-3 font-medium">Intern ID</th>
              <th class="px-4 py-3 font-medium">Name</th>
              <th class="px-4 py-3 font-medium">Email</th>
              <th class="px-4 py-3 font-medium">Mobile</th>
              <th class="px-4 py-3 font-medium">Batch</th>
              <th class="px-4 py-3 font-medium">ID card</th>
              <th class="px-4 py-3 font-medium">Joined</th>
              <th class="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-800">
            @for (intern of interns(); track intern.id) {
              <tr class="dark:text-gray-200 text-gray-800">
                <td class="px-4 py-3 font-medium">{{ intern.internId }}</td>
                <td class="px-4 py-3">{{ intern.name }}</td>
                <td class="px-4 py-3">{{ intern.email }}</td>
                <td class="px-4 py-3">{{ intern.mobile }}</td>
                <td class="px-4 py-3">{{ batchLabel(intern.batchId) }}</td>
                <td class="px-4 py-3">{{ intern.idCardType }}</td>
                <td class="px-4 py-3">{{ intern.dateOfJoining }}</td>
                <td class="px-4 py-3">
                  <div class="flex justify-end gap-3 whitespace-nowrap">
                    <a
                      [routerLink]="['/intern', intern.id, 'edit']"
                      class="text-primary hover:underline"
                      >Edit</a
                    >
                    <button
                      type="button"
                      [disabled]="deletingId() === intern.id"
                      (click)="remove(intern)"
                      class="cursor-pointer text-red-600 hover:underline disabled:cursor-not-allowed disabled:opacity-60 dark:text-red-400"
                    >
                      {{ deletingId() === intern.id ? 'Deleting…' : 'Delete' }}
                    </button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  </div>`
})
export class InternList implements OnInit {
  private fb = inject(FormBuilder);
  private internService = inject(InternService);
  private batchService = inject(BatchService);
  private confirmDialog = inject(ConfirmDialogService);
  private toast = inject(ToastService);

  readonly inputClass = INPUT_CLASS;
  readonly idCardTypes: IdCardType[] = ['FREE', 'PREMIUM'];

  interns = this.internService.interns;
  batches = this.batchService.batches;

  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  deletingId = signal<number | null>(null);

  filterForm = this.fb.group({
    name: this.fb.nonNullable.control(''),
    batchId: this.fb.control<number | null>(null),
    idCardType: this.fb.control<IdCardType | null>(null)
  });

  hasActiveFilters = computed(() => {
    const value = this.filterForm.value;
    return !!value.name?.trim() || value.batchId != null || value.idCardType != null;
  });

  // Batches only give us ids, so resolve them to something readable ("#3 · 2026-01-05").
  private batchLabels = computed(
    () =>
      new Map(
        this.batchService.batches().map(batch => [batch.id, `#${batch.id} · ${batch.startDate}`])
      )
  );

  constructor() {
    // Typing fires a request per keystroke without this: the debounce waits for
    // a pause in typing so we aren't hammering the API for every character.
    this.filterForm.controls.name.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe(() => this.runQuery());

    // Dropdowns are single deliberate choices — filtering immediately feels
    // right and there's nothing to debounce.
    this.filterForm.controls.batchId.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.runQuery());

    this.filterForm.controls.idCardType.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.runQuery());
  }

  ngOnInit(): void {
    this.runQuery();
    // Best-effort: the batch filter/label just falls back to "#id" if this fails.
    this.batchService.list().subscribe({ error: () => undefined });
  }

  batchLabel(batchId: number): string {
    return this.batchLabels().get(batchId) ?? `#${batchId}`;
  }

  clearFilters(): void {
    // reset() re-emits valueChanges, which runs the query for us.
    this.filterForm.reset({ name: '', batchId: null, idCardType: null });
  }

  private runQuery(): void {
    const value = this.filterForm.getRawValue();

    this.loading.set(true);
    this.error.set(null);

    this.internService
      .list({
        // Blank means "no filter" — the service drops empty values rather than
        // sending `?name=`.
        name: value.name.trim() || undefined,
        batchId: value.batchId ?? undefined,
        idCardType: value.idCardType ?? undefined
      })
      .subscribe({
        next: () => this.loading.set(false),
        error: err => {
          this.loading.set(false);
          this.error.set(apiErrorMessage(err));
        }
      });
  }

  async remove(intern: Intern): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Delete intern',
      message: `Delete ${intern.name} (${intern.internId})? This cannot be undone.`,
      confirmLabel: 'Delete'
    });

    if (!confirmed) {
      return;
    }

    this.deletingId.set(intern.id);
    this.internService.delete(intern.id).subscribe({
      next: () => {
        this.deletingId.set(null);
        this.toast.success(`Intern ${intern.internId} deleted.`);
        // Re-runs the last filtered list() so the table reflects the delete.
        this.internService.refresh().subscribe({
          error: err => this.error.set(apiErrorMessage(err))
        });
      },
      error: err => {
        this.deletingId.set(null);
        this.toast.error(apiErrorMessage(err));
      }
    });
  }
}
