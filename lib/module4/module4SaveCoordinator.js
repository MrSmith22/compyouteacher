/**
 * Module 4 dirty/save coordinator (CP-E repair).
 *
 * Separates read-only provenance derivation from persistence so opening
 * Module 4, loading upstream artifacts, or deriving coaching never POSTs.
 * Only student mutations, intentional navigation saves, or explicit
 * upstream-change acknowledgement may write.
 */

function safeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

export const MODULE4_SAVE_REASONS = {
  AUTOSAVE: "autosave",
  NAVIGATION: "navigation",
  ACKNOWLEDGE: "acknowledge",
};

export const MODULE4_ACK_SAVE_ERROR =
  "Could not save your confirmation. Your paragraph plans are unchanged. Try again.";

export const MODULE4_NAV_SAVE_ERROR =
  "Could not save your progress. Your work is still here. Try again.";

/**
 * Upstream-signature baseline policy (additive flow_state.module4UpstreamSignature):
 *
 * - New Module 4 work: establish the current ready signature on the first
 *   legitimate Module 4 save caused by student work or navigation — never
 *   during passive viewing.
 * - Existing work with a saved signature: if upstream differs, show the
 *   change notice and keep the old signature until explicit acknowledgement.
 *   Passive reload must not POST or clear the notice.
 * - Legacy plans with no saved signature: do not claim an upstream change.
 *   Treat the first confirmed/current ready signature as a baseline only on
 *   the next student save or acknowledgement that connects the plan to
 *   current guidance.
 * - needs_review: never persist that signature as a confirmed baseline.
 */
export const MODULE4_UPSTREAM_SIGNATURE_BASELINE_POLICY = {
  establishOnFirstLegitimateSave: true,
  noWriteOnPassiveView: true,
  legacyWithoutSignatureDoesNotClaimChange: true,
  needsReviewNeverPersistedAsConfirmed: true,
  acknowledgementRequiredToAdvanceMismatch: true,
};

/**
 * Whether the autosave timer may fire. Hydration and derived coaching are clean.
 */
export function shouldScheduleModule4Autosave({ studentDirty = false } = {}) {
  return Boolean(studentDirty);
}

/**
 * Resolve which upstream signature (if any) belongs in a Module 4 persist payload.
 * Never advances a mismatch without acknowledge. Never confirms needs_review.
 */
export function resolveModule4UpstreamSignatureForPersist({
  provenanceModel = null,
  savedSignature = "",
  persistReason = MODULE4_SAVE_REASONS.AUTOSAVE,
} = {}) {
  const saved = safeText(savedSignature);
  const needsReview = Boolean(provenanceModel?.needsReview);
  const current =
    provenanceModel?.ready && provenanceModel?.signature
      ? safeText(provenanceModel.signature)
      : "";

  // Do not persist an unconfirmed / review-required direction as baseline.
  if (needsReview || !current) {
    return saved;
  }

  if (persistReason === MODULE4_SAVE_REASONS.ACKNOWLEDGE) {
    return current;
  }

  // First legitimate student/navigation save establishes baseline.
  if (!saved) {
    return current;
  }

  if (saved === current) {
    return saved;
  }

  // Mismatch: keep old until explicit acknowledgement.
  return saved;
}

/**
 * Mutable coordinator used by ModuleFour and production-level tests.
 * writeFn is injected so tests assert POSTs without mounting React.
 */
export function createModule4DirtySaveCoordinator({
  initialSignature = "",
} = {}) {
  let studentDirty = false;
  let savedSignature = safeText(initialSignature);
  let ackError = "";
  let ackInFlight = false;
  let navigationInFlight = false;
  let postCount = 0;
  const posts = [];

  return {
    isStudentDirty: () => studentDirty,
    getSavedSignature: () => savedSignature,
    getAckError: () => ackError,
    isAckInFlight: () => ackInFlight,
    isNavigationInFlight: () => navigationInFlight,
    getPostCount: () => postCount,
    getPosts: () => posts.slice(),

    markStudentMutation() {
      studentDirty = true;
    },

    /** Hydration / provenance / derived React state — must stay clean. */
    notePassiveView() {
      return { studentDirty, scheduled: shouldScheduleModule4Autosave({ studentDirty }) };
    },

    shouldScheduleAutosave() {
      return shouldScheduleModule4Autosave({ studentDirty });
    },

    buildPersistSignature(provenanceModel, persistReason) {
      return resolveModule4UpstreamSignatureForPersist({
        provenanceModel,
        savedSignature,
        persistReason,
      });
    },

    /**
     * @param {object} args
     * @param {(payload: object) => Promise<{ ok: boolean, error?: string }>} args.writeFn
     * @param {object|null} args.provenanceModel
     * @param {string} args.persistReason
     * @param {(signature: string) => object} args.buildPayload
     */
    async persist({
      writeFn,
      provenanceModel = null,
      persistReason = MODULE4_SAVE_REASONS.AUTOSAVE,
      buildPayload,
    }) {
      if (typeof writeFn !== "function" || typeof buildPayload !== "function") {
        return { ok: false, error: "Missing write boundary", signature: savedSignature };
      }

      if (persistReason === MODULE4_SAVE_REASONS.ACKNOWLEDGE) {
        ackInFlight = true;
        ackError = "";
      }
      if (persistReason === MODULE4_SAVE_REASONS.NAVIGATION) {
        navigationInFlight = true;
      }

      const signature = this.buildPersistSignature(provenanceModel, persistReason);
      const payload = buildPayload(signature);
      postCount += 1;
      posts.push({ persistReason, payload });

      let result;
      try {
        result = await writeFn(payload);
      } catch (err) {
        result = {
          ok: false,
          error: err?.message || MODULE4_ACK_SAVE_ERROR,
        };
      }

      if (persistReason === MODULE4_SAVE_REASONS.NAVIGATION) {
        navigationInFlight = false;
      }

      if (result?.ok) {
        savedSignature = signature;
        studentDirty = false;
        ackInFlight = false;
        ackError = "";
        return { ok: true, signature, payload };
      }

      if (persistReason === MODULE4_SAVE_REASONS.ACKNOWLEDGE) {
        ackInFlight = false;
        ackError = result?.error || MODULE4_ACK_SAVE_ERROR;
        // Keep savedSignature and notice; do not claim acknowledgement.
      }

      return {
        ok: false,
        error: ackError || result?.error || MODULE4_ACK_SAVE_ERROR,
        signature: savedSignature,
        payload,
      };
    },
  };
}
