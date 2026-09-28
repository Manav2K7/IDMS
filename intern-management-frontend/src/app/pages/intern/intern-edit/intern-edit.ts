import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  ViewEncapsulation,
  inject,
  signal
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { InternService } from '@core/services/intern.service';
import { apiErrorMessage } from '@core/utils/api-error.util';
import { Intern, MOBILE_PATTERN } from '@data/schema/intern/intern';
import { Loader } from '@shared/components/loader/loader';
import { Spinner } from '@shared/components/spinner/spinner';
import { ToastService } from '@shared/components/toast/toast.service';

const INPUT_CLASS =
  'w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-700';

@Component({
  selector: 'intern-edit',
  imports: [ReactiveFormsModule, RouterLink, Loader, Spinner],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  template: `<div class="flex flex-col gap-6">
    <div>
      <h1 class="font-bold text-xl sm:text-3xl dark:text-white text-gray-900">Edit intern</h1>
      <p class="mt-1 text-sm dark:text-gray-300 text-gray-700">Only the contact details can change.</p>
    </div>

    @if (loading()) {
      <loader />
    } @else if (error() && !intern()) {
      <p
        class="rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/30 px-3 py-2 text-sm text-red-700 dark:text-red-300"
      >
        {{ error() }}
      </p>
    } @else {
      <form [formGroup]="form" (ngSubmit)="submit()" class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <!--
          Intern ID is read-only on purpose: it is generated once at registration
          and is the business key the rest of the system refers to. The backend's
          InternUpdateRequestDto doesn't even accept the field, so this disabled
          input is the honest UI for that rule, not a missing feature.
        -->
        <label class="flex flex-col gap-1 sm:col-span-2">
          <span class="text-sm font-medium dark:text-gray-200 text-gray-700">Intern ID</span>
          <input
            type="text"
            [value]="intern()?.internId ?? ''"
            disabled
            class="w-full cursor-not-allowed rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 px-3 py-2 text-gray-500 dark:text-gray-400"
          />
        </label>

        <label class="flex flex-col gap-1">
          <span class="text-sm font-medium dark:text-gray-200 text-gray-700">Name</span>
          <input type="text" formControlName="name" [class]="inputClass" />
          @if (isInvalid('name')) {
            <span class="text-sm text-red-600 dark:text-red-400">Name is required (max 100).</span>
          }
        </label>

        <label class="flex flex-col gap-1">
          <span class="text-sm font-medium dark:text-gray-200 text-gray-700">Email</span>
          <input type="email" formControlName="email" [class]="inputClass" />
          @if (isInvalid('email')) {
            <span class="text-sm text-red-600 dark:text-red-400">A valid email is required.</span>
          }
        </label>

        <label class="flex flex-col gap-1">
          <span class="text-sm font-medium dark:text-gray-200 text-gray-700">Mobile</span>
          <input type="tel" inputmode="tel" formControlName="mobile" [class]="inputClass" />
          @if (isInvalid('mobile')) {
            <span class="text-sm text-red-600 dark:text-red-400">
              10–15 digits, optional leading +.
            </span>
          }
        </label>

        <div class="flex flex-wrap items-center gap-3 sm:col-span-2">
          <button
            type="submit"
            [disabled]="saving()"
            class="bg-primary flex w-full items-center justify-center gap-2 rounded-lg px-5 py-2 text-white hover:bg-primary-800 dark:hover:bg-primary-400 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            @if (saving()) {
              <spinner [size]="14" />
            }
            {{ saving() ? 'Saving…' : 'Save changes' }}
          </button>
          <a
            routerLink="/intern"
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
    }
  </div>`
})
export class InternEdit implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private internService = inject(InternService);
  private toast = inject(ToastService);

  readonly inputClass = INPUT_CLASS;

  intern = signal<Intern | null>(null);
  loading = signal<boolean>(true);
  saving = signal<boolean>(false);
  error = signal<string | null>(null);

  private internId = 0;

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
    mobile: ['', [Validators.required, Validators.pattern(MOBILE_PATTERN)]]
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!Number.isFinite(id)) {
      this.loading.set(false);
      this.error.set('That intern id is not valid.');
      return;
    }

    this.internId = id;
    this.internService.get(id).subscribe({
      next: intern => {
        this.intern.set(intern);
        // Only the mutable fields are patched — internId / batch / card type
        // have no controls at all.
        this.form.patchValue({
          name: intern.name,
          email: intern.email,
          mobile: intern.mobile
        });
        this.loading.set(false);
      },
      error: err => {
        this.loading.set(false);
        this.error.set(apiErrorMessage(err));
      }
    });
  }

  isInvalid(name: string): boolean {
    const control = this.form.get(name);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    this.internService.update(this.internId, this.form.getRawValue()).subscribe({
      next: intern => {
        this.saving.set(false);
        this.intern.set(intern);
        // Patch back so the form is pristine again after a successful save.
        this.form.markAsPristine();
        this.toast.success(`Saved changes to ${intern.internId}.`);
        this.router.navigate(['/intern']);
      },
      error: err => {
        this.saving.set(false);
        this.error.set(apiErrorMessage(err));
        this.toast.error(apiErrorMessage(err));
      }
    });
  }
}
