/**
 * TypeScript surface for the Module 4 → Module 5 outline mapper.
 * Implementation lives in mapStudentBucketsToOutline.js for Node test compatibility.
 */

export {
  tchartEntryKey,
  jobLabelForOutline,
  resolveEvidenceSnippetsForBucket,
  buildModule4ParagraphSourceSignature,
  resolveRequiredOutlineParagraphCount,
  mapBucketToOutlineBodyItem,
  buildOutlineBodyFromModule4Plans,
  outlineBodyFromStudentBuckets,
  POINT_MIN_CHARS,
  REASONING_MIN_CHARS,
  CUSTOM_JOB_MIN_CHARS,
} from "./mapStudentBucketsToOutline.js";

export type TchartLike = {
  id?: string | number | null;
  category?: string | null;
  type?: string | null;
  quote?: string | null;
  observation?: string | null;
};

export type StudentBucketPayload = {
  claim?: string;
  reasoning?: string;
  evidenceKeys?: string[];
  evidenceSnippets?: Array<{ quote?: string; observation?: string }>;
  paragraphRole?: string;
  suggestionId?: string;
};

export type OutlineEvidenceItem = {
  quote: string;
  observation: string;
  evidenceKey?: string;
};

export type OutlineBodyItem = {
  bucket: string;
  points: string[];
  paragraphIndex?: number;
  sourceParagraphIndex?: number;
  point?: string;
  job?: string;
  jobId?: string;
  evidence?: OutlineEvidenceItem[];
  reasoning?: string;
  suggestionId?: string;
  order?: number;
  sourceSignature?: string;
};
