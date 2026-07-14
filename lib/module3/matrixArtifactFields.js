/**
 * Additive matrix provenance/review field helpers for Module 3 artifacts (CP-D).
 */

export function asOptionalMatrixObject(value) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  return value;
}

export function readAdditiveMatrixFields(record) {
  const matrixProvenance = asOptionalMatrixObject(record?.matrixProvenance);
  const matrixReview = asOptionalMatrixObject(record?.matrixReview);
  return {
    ...(matrixProvenance ? { matrixProvenance } : {}),
    ...(matrixReview ? { matrixReview } : {}),
  };
}

export function mergeAdditiveMatrixFields(input, existing) {
  return {
    matrixProvenance:
      input?.matrixProvenance !== undefined
        ? input.matrixProvenance
        : existing?.matrixProvenance ?? undefined,
    matrixReview:
      input?.matrixReview !== undefined
        ? input.matrixReview
        : existing?.matrixReview ?? undefined,
  };
}
