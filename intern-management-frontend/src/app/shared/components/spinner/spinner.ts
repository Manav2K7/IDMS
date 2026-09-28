import { ChangeDetectionStrategy, Component, ViewEncapsulation, input } from '@angular/core';

/**
 * Inline spinner for use inside buttons / tight rows. `loader` stays the
 * page-level spinner; this is the small one that sits next to a label.
 *
 * `border-current` means it inherits the text colour, so it reads correctly on
 * the primary (white-on-colour) buttons without extra props.
 */
@Component({
  selector: 'spinner',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  template: `<span
    role="status"
    aria-label="Loading"
    class="inline-block animate-spin rounded-full border-2 border-current border-t-transparent align-[-0.125em]"
    [style.width.px]="size()"
    [style.height.px]="size()"
  ></span>`
})
export class Spinner {
  size = input<number>(16);
}
