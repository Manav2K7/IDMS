import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  ViewEncapsulation,
  inject,
  signal
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BatchService } from '@core/services/batch.service';
import { apiErrorMessage } from '@core/utils/api-error.util';
import { BatchOverview as BatchOverviewModel } from '@data/schema/batch/batch';
import { Loader } from '@shared/components/loader/loader';

@Component({
  selector: 'batch-overview',
  imports: [RouterLink, Loader],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  template: `<div class="flex flex-col gap-6">
    <a
      routerLink="/batch"
      class="self-start text-sm dark:text-gray-300 text-gray-700 hover:text-primary dark:hover:text-primary-400"
      >← Back to batches</a
    >

    @if (loading()) {
      <loader />
    } @else if (error()) {
      <p
        class="rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/30 px-3 py-2 text-sm text-red-700 dark:text-red-300"
      >
        {{ error() }}
      </p>
    } @else {
      @if (overview(); as batch) {
        <div>
          <h1 class="font-bold text-xl sm:text-3xl dark:text-white text-gray-900">
            Batch #{{ batch.id }}
          </h1>
          <p class="mt-1 text-sm dark:text-gray-300 text-gray-700">
            {{ batch.startDate }} → {{ batch.endDate }} ·
            {{ batch.interns.length }} {{ batch.interns.length === 1 ? 'intern' : 'interns' }}
          </p>
        </div>

        @if (!batch.interns.length) {
          <p class="dark:text-gray-300 text-gray-700">
            No interns in this batch yet.
            <a routerLink="/intern/new" class="text-primary hover:underline">Register one</a>.
          </p>
        } @else {
          <div class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
            <table class="min-w-full text-left text-sm">
              <thead class="bg-gray-50 dark:bg-gray-800/60 dark:text-gray-200 text-gray-700">
                <tr>
                  <th class="px-4 py-3 font-medium">Intern ID</th>
                  <th class="px-4 py-3 font-medium">Name</th>
                  <th class="px-4 py-3 font-medium">Email</th>
                  <th class="px-4 py-3 font-medium">Mobile</th>
                  <th class="px-4 py-3 font-medium">ID card</th>
                  <th class="px-4 py-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-800">
                @for (intern of batch.interns; track intern.id) {
                  <tr class="dark:text-gray-200 text-gray-800">
                    <td class="px-4 py-3 font-medium">{{ intern.internId }}</td>
                    <td class="px-4 py-3">{{ intern.name }}</td>
                    <td class="px-4 py-3">{{ intern.email }}</td>
                    <td class="px-4 py-3">{{ intern.mobile }}</td>
                    <td class="px-4 py-3">{{ intern.idCardType }}</td>
                    <td class="px-4 py-3">{{ intern.dateOfJoining }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      }
    }
  </div>`
})
export class BatchOverview implements OnInit {
  private route = inject(ActivatedRoute);
  private batchService = inject(BatchService);

  overview = signal<BatchOverviewModel | null>(null);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!Number.isFinite(id)) {
      this.loading.set(false);
      this.error.set('That batch id is not valid.');
      return;
    }

    this.batchService.getOverview(id).subscribe({
      next: batch => {
        this.overview.set(batch);
        this.loading.set(false);
      },
      error: err => {
        this.loading.set(false);
        this.error.set(apiErrorMessage(err));
      }
    });
  }
}
