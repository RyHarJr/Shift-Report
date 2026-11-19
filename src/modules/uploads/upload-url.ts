export const UPLOAD_IMAGE_ID_REGEX = /^[A-Za-z0-9_-]{1,128}$/;
export const SAFE_UPLOAD_URL_REGEX = /^\/api\/uploads\/([A-Za-z0-9_-]{1,128})$/;

/** Checks whether a SharePoint/Power Automate image ID contains only safe path characters. */
export function isValidUploadImageId(id: string): boolean {
  return UPLOAD_IMAGE_ID_REGEX.test(id);
}

/** Builds the internal proxy URL stored in ShiftReport records for a SharePoint image ID. */
export function buildUploadImageUrl(id: string): string {
  return `/api/uploads/${id}`;
}

/** Extracts a validated image ID from a stored `/api/uploads/<id>` URL, or returns null. */
export function extractUploadImageId(
  url: string | null | undefined,
): string | null {
  if (!url) return null;
  const match = SAFE_UPLOAD_URL_REGEX.exec(url.trim());
  return match ? match[1] : null;
}

