import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  ViewEncapsulation,
  inject,
  signal
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { BatchService } from '@core/services/batch.service';
import { apiErrorMessage } from '@core/utils/api-error.util';
import { Loader } from '@shared/components/loader/loader';

@Component({
  selector: 'batch-list',
  imports: [RouterLink, Loader],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  template: `<div class="flex flex-col gap-6">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 class="font-bold text-xl sm:text-3xl dark:text-white text-gray-900">Batches</h1>
        <p class="mt-1 text-sm dark:text-gray-300 text-gray-700">
          Every batch runs six months from its start date.
        </p>
      </div>
      <a
        routerLink="/batch/new"
        class="bg-primary w-full rounded-lg px-5 py-2 text-center text-white hover:bg-primary-800 dark:hover:bg-primary-400 sm:w-auto"
        >New batch</a
      >
    </div>

    @if (loading()) {
      <loader />
    } @else if (error()) {
      <p
        class="rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/30 px-3 py-2 text-sm text-red-700 dark:text-red-300"
      >
        {{ error() }}
      </p>
    } @else if (!batches().length) {
      <p class="dark:text-gray-300 text-gray-700">
        No batches yet — create the first one to start registering interns.
      </p>
    } @else {
      <div class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
        <table class="min-w-full text-left text-sm">
          <thead class="bg-gray-50 dark:bg-gray-800/60 dark:text-gray-200 text-gray-700">
            <tr>
              <th class="px-4 py-3 font-medium">Batch</th>
              <th class="px-4 py-3 font-medium">Start date</th>
              <th class="px-4 py-3 font-medium">End date</th>
              <th class="px-4 py-3 font-medium">Interns</th>
              <th class="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-800">
            @for (batch of batches(); track batch.id) {
              <tr class="dark:text-gray-200 text-gray-800">
                <td class="px-4 py-3 font-medium">#{{ batch.id }}</td>
                <td class="px-4 py-3">{{ batch.startDate }}</td>
                <td class="px-4 py-3">{{ batch.endDate }}</td>
                <td class="px-4 py-3">{{ batch.internCount }}</td>
                <td class="px-4 py-3 text-right">
                  <a [routerLink]="['/batch', batch.id]" class="text-primary hover:underline">Overview</a>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  </div>`
})
export class BatchList implements OnInit {
  private batchService = inject(BatchService);

  // Straight from the service's signal — creating a batch elsewhere updates
  // this table without a manual refetch.
  batches = this.batchService.batches;

  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.batchService.list().subscribe({
      next: () => this.loading.set(false),
      error: err => {
        this.loading.set(false);
        this.error.set(apiErrorMessage(err));
      }
    });
  }
}
