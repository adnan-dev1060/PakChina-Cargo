export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

/** Standard success envelope: { data } — the frontend API client unwraps it. */
export const ok = <T>(data: T) => ({ data });
