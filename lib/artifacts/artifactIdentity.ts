/**
 * Shared identity shape for durable writing artifacts.
 *
 * Why artifacts have identities:
 * The Writing Processor already stores real student work across several domain
 * tables. Those rows are durable, but the rest of the system still mostly knows
 * them through helper-specific or module-specific shapes. A shared artifact
 * identity gives the architecture one stable way to refer to student work across
 * the assignment without changing where that work is stored today.
 *
 * Why identity is separate from payload:
 * Identity answers "what durable thing is this, who owns it, and where does it
 * come from?" Payload answers "what instructional content does it contain right
 * now?" Keeping those concerns separate lets the payload evolve by artifact type
 * without changing how later systems reference, group, or relate artifacts.
 *
 * Why assignment identity matters more than module identity:
 * Modules are the current renderer sequence, not the enduring ownership model.
 * The architecture documents consistently treat assignments as the instructional
 * unit and artifacts as assignment-level durable work that later modules reuse.
 * An artifact may be created in one module and consumed several modules later,
 * so assignment identity is the stable boundary while module numbers remain an
 * implementation detail of the current workflow.
 *
 * How this prepares later layers:
 * - Thinking Canvas can display assignment-level continuity from shared ids.
 * - Teacher Dashboard views can group student work by assignment instead of
 *   reverse-engineering module-specific storage assumptions.
 * - A future AI Coach can read stable artifact references and relationships
 *   without owning persistence or silently rewriting student work.
 *
 * This file is intentionally additive and type-only. It does not change routes,
 * Supabase, existing persistence, or current module behavior.
 */
export interface ArtifactIdentity<TArtifactType extends string = string> {
  artifactId: string;
  artifactType: TArtifactType;
  assignmentId: string | null;
  userEmail: string;
  sourceTable: string;
  /**
   * Identifier of the record or source object inside `sourceTable`.
   *
   * This is intentionally separate from artifact-specific payload fields. For
   * example, an evidence payload may also have its own domain `sourceId` that
   * points to a reading source; that does not replace the identity's reference
   * back to the backing store entry.
   */
  sourceId: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

/**
 * Generic artifact wrapper for current and future artifact families.
 *
 * The payload remains fully generic on purpose. Evidence, thesis, paragraph
 * plans, Canvas-native Module 3 artifacts, and future teacher-review read models
 * will all carry different content, but they should share the same identity
 * envelope.
 */
export interface Artifact<TPayload, TArtifactType extends string = string> {
  identity: ArtifactIdentity<TArtifactType>;
  payload: TPayload;
}
