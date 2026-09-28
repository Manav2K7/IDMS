import { Intern } from '@data/schema/intern/intern';

/**
 * Mirrors `com.company.internmgmt.dto.BatchResponseDto`.
 *
 * `internCount` comes straight from the backend's grouped count query, so the
 * list view never has to fetch interns just to show a number.
 */
export interface Batch {
  id: number;
  startDate: string;
  endDate: string;
  internCount: number;
}

/**
 * Mirrors `BatchRequestDto` — start date only. The end date is derived by the
 * service layer (start + 6 months), so there is no field for it here on purpose.
 */
export interface BatchRequest {
  startDate: string;
}

/** Mirrors `BatchOverviewDto`: the batch plus its interns. */
export interface BatchOverview {
  id: number;
  startDate: string;
  endDate: string;
  interns: Intern[];
}
