/**
 * Mirrors the backend `IdCardType` enum (FREE / PREMIUM). Kept as a string
 * union so no enum import is needed on the template side.
 */
export type IdCardType = 'FREE' | 'PREMIUM';

/**
 * Same regex the backend enforces in `InternRequestDto` / `InternUpdateRequestDto`
 * (optional `+`, then 10-15 digits). Duplicated here so the form rejects bad
 * input before a round trip — the server still validates it independently.
 */
export const MOBILE_PATTERN = '^\\+?[0-9]{10,15}$';

/**
 * Mirrors `com.company.internmgmt.dto.InternResponseDto`.
 *
 * Dates are plain `yyyy-MM-dd` strings, not `Date` objects: the backend maps
 * `LocalDate` and Jackson writes it as an ISO date string, so parsing it into a
 * `Date` here would drag timezone bugs in for no benefit.
 *
 * Note there is no nested `batch` object — the DTO carries only the numeric
 * `batchId` (the batch name/label is resolved through `BatchService`).
 */
export interface Intern {
  id: number;
  internId: string;
  name: string;
  email: string;
  mobile: string;
  idCardType: IdCardType;
  dateOfJoining: string;
  batchId: number;
}

/**
 * Mirrors `InternRequestDto`. No `internId`: the backend generates it from the
 * join date + card type, so the client never sends one.
 */
export interface InternRequest {
  name: string;
  email: string;
  mobile: string;
  idCardType: IdCardType;
  dateOfJoining: string;
  batchId: number;
}

/**
 * Mirrors `InternUpdateRequestDto` — deliberately narrower than
 * `InternRequest`. Only these three fields are editable; the backend's update
 * DTO has no `internId` / `idCardType` / `dateOfJoining` / `batchId`, so extra
 * properties are simply ignored.
 */
export interface InternUpdateRequest {
  name: string;
  email: string;
  mobile: string;
}

/** Query params accepted by `GET /api/interns` — all optional. */
export interface InternFilters {
  name?: string;
  batchId?: number;
  idCardType?: IdCardType;
}
