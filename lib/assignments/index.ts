import {
  mlkRhetoricalAnalysisAssignment,
  type GuidedPassage,
  type MlkRhetoricalAnalysisAssignment,
  type RhetoricalStrategy,
  type SourceType,
} from "./mlkRhetoricalAnalysis";
import {
  DEFAULT_ASSIGNMENT_ID,
  DEFAULT_ASSIGNMENT_NAME,
  MLK_ASSIGNMENT_ID,
  MLK_ASSIGNMENT_NAME,
} from "./identity";
import {
  MLK_RHETORICAL_SITUATIONS,
  MLK_SITUATION_COMPARISON,
} from "./rhetoricalSituations";

export {
  DEFAULT_ASSIGNMENT_ID,
  DEFAULT_ASSIGNMENT_NAME,
  MLK_ASSIGNMENT_ID,
  MLK_ASSIGNMENT_NAME,
} from "./identity";

export type {
  GuidedPassage,
  MlkRhetoricalAnalysisAssignment,
  RhetoricalStrategy,
  SourceType,
};

export { mlkRhetoricalAnalysisAssignment };

export interface AuthoritativeSourceReference {
  name: string;
  url: string;
}

/**
 * Structured rhetorical-situation context. Entirely optional so assignments
 * without this data keep working; screens fall back to the legacy single
 * `audience` and `purpose` strings.
 */
export interface RhetoricalSituationDefinition {
  date?: string;
  occasion?: string;
  form?: string;
  immediateAudience?: string;
  broaderAudience?: string;
  audienceSituation?: string;
  purposes?: string[];
  historicalContext?: string;
  whyFormMatters?: string;
  /** Compact Form/Audience/Purpose cue for quotation cards. */
  compactCue?: {
    form?: string;
    audience?: string;
    purpose?: string;
  };
  authoritativeSources?: AuthoritativeSourceReference[];
}

export interface SituationComparisonDefinition {
  shared?: string[];
  different?: string[];
  caveat?: string;
}

export interface AssignmentSourceDefinition {
  sourceType: SourceType;
  label: string;
  title: string;
  audience: string;
  purpose: string;
  rhetoricalSituation?: RhetoricalSituationDefinition;
  searchQuery: string;
  officialSourceUrl: string;
  officialSiteName: string;
  trustedArchiveName: string;
  trustedArchiveDescription: string;
  apiDefaultSiteName: string;
  analysisFallbackUrl: string;
  transcriptUrlPlaceholder: string;
  transcriptTextPlaceholder: string;
  transcriptStartExample: string;
  transcriptEndExample: string;
  transcriptDescriptor: string;
  originalWorkPublishedYear: string;
  citationTitle: string;
}

export interface AssignmentIdentityDefinition {
  assignmentId: string;
  assignmentName: string;
  title: string;
  cacheNamespace: string;
}

export interface AssignmentWritingModeDefinition {
  essayType: string;
  authorDisplayName: string;
  subjectName: string;
}

export interface AssignmentTaskDefinition {
  essentialQuestion: string;
  prompt: string;
}

export interface AssignmentSourceIntelligenceDefinition {
  sources: Record<SourceType, AssignmentSourceDefinition>;
}

export interface AssignmentObservationSchemaDefinition {
  rhetoricalStrategies: readonly RhetoricalStrategy[];
  guidedPassages: readonly GuidedPassage[];
}

export interface AssignmentDefinitionSections {
  identity: AssignmentIdentityDefinition;
  writingMode: AssignmentWritingModeDefinition;
  task: AssignmentTaskDefinition;
  sourceIntelligence: AssignmentSourceIntelligenceDefinition;
  observationSchema: AssignmentObservationSchemaDefinition;
  situationComparison?: SituationComparisonDefinition;
}

export interface AssignmentDefinitionLegacyFields {
  assignmentId: string;
  assignmentName: string;
  title: string;
  essayType: string;
  essentialQuestion: string;
  authorDisplayName: string;
  subjectName: string;
  prompt: string;
  cacheNamespace: string;
  sources: Record<SourceType, AssignmentSourceDefinition>;
  speech: MlkRhetoricalAnalysisAssignment["speech"];
  letter: MlkRhetoricalAnalysisAssignment["letter"];
  rhetoricalStrategies: MlkRhetoricalAnalysisAssignment["rhetoricalStrategies"];
  guidedPassages: MlkRhetoricalAnalysisAssignment["guidedPassages"];
}

export type AssignmentDefinition = AssignmentDefinitionSections &
  AssignmentDefinitionLegacyFields;

const mlkAssignmentSources: Record<SourceType, AssignmentSourceDefinition> = {
  speech: {
    sourceType: "speech",
    label: "Speech",
    title: mlkRhetoricalAnalysisAssignment.speech.title,
    audience: mlkRhetoricalAnalysisAssignment.speech.audience,
    purpose: mlkRhetoricalAnalysisAssignment.speech.purpose,
    rhetoricalSituation: MLK_RHETORICAL_SITUATIONS.speech,
    searchQuery: "full text I Have a Dream speech",
    officialSourceUrl:
      "https://www.archives.gov/files/social-media/transcripts/transcript-march-pt3-of-3-2602934.pdf",
    officialSiteName: "National Archives",
    trustedArchiveName: "National Archives",
    trustedArchiveDescription:
      "which preserves important documents from United States history",
    apiDefaultSiteName: "National Archives",
    analysisFallbackUrl:
      "https://www.archives.gov/files/press/exhibits/dream-speech.pdf",
    transcriptUrlPlaceholder:
      "https://example.edu/i-have-a-dream-transcript",
    transcriptTextPlaceholder: "Paste the full transcript here...",
    transcriptStartExample:
      "I am happy to join with you today in what will go down in history as the greatest demonstration for freedom in the history of our nation.",
    transcriptEndExample:
      "Free at last, free at last. Thank God Almighty, we are free at last.",
    transcriptDescriptor: "Speech transcript",
    originalWorkPublishedYear: "1963",
    citationTitle: "I have a dream",
  },
  letter: {
    sourceType: "letter",
    label: "Letter",
    title: mlkRhetoricalAnalysisAssignment.letter.title,
    audience: mlkRhetoricalAnalysisAssignment.letter.audience,
    purpose: mlkRhetoricalAnalysisAssignment.letter.purpose,
    rhetoricalSituation: MLK_RHETORICAL_SITUATIONS.letter,
    searchQuery: "full text Letter from Birmingham Jail",
    officialSourceUrl:
      "https://www.africa.upenn.edu/Articles_Gen/Letter_Birmingham.html",
    officialSiteName: "University of Pennsylvania Africa Studies Center",
    trustedArchiveName:
      "Martin Luther King Jr. Research and Education Institute at Stanford University",
    trustedArchiveDescription:
      "which maintains scholarly editions of Dr. King's writings",
    apiDefaultSiteName:
      "Martin Luther King Jr. Research and Education Institute at Stanford University",
    analysisFallbackUrl:
      "https://kinginstitute.stanford.edu/king-papers/documents/letter-birmingham-jail",
    transcriptUrlPlaceholder:
      "https://example.edu/letter-from-birmingham-jail-transcript",
    transcriptTextPlaceholder: "Paste the full letter here...",
    transcriptStartExample:
      "While confined here in the Birmingham city jail...",
    transcriptEndExample:
      "Yours for the cause of Peace and Brotherhood, Martin Luther King, Jr.",
    transcriptDescriptor: "Letter transcript",
    originalWorkPublishedYear: "1963",
    citationTitle: "Letter from Birmingham jail",
  },
};

const mlkAssignmentDefinitionSections: AssignmentDefinitionSections = {
  identity: {
    assignmentId: MLK_ASSIGNMENT_ID,
    assignmentName: MLK_ASSIGNMENT_NAME,
    title: mlkRhetoricalAnalysisAssignment.title,
    cacheNamespace: MLK_ASSIGNMENT_ID,
  },
  writingMode: {
    essayType: "compare-and-contrast-rhetorical-analysis",
    authorDisplayName: "Dr. Martin Luther King Jr.",
    subjectName: "Dr. Martin Luther King Jr.",
  },
  task: {
    essentialQuestion: mlkRhetoricalAnalysisAssignment.essentialQuestion,
    prompt: `Write a compare and contrast essay explaining how Dr. Martin Luther King Jr. uses ethos, pathos, and logos in both "I Have a Dream" and "Letter from Birmingham Jail."

In your essay, you must:
• Compare how King uses rhetorical appeals in both texts
• Explain how those appeals connect to audience and purpose
• Support your ideas with specific evidence from both works

Your goal is not to summarize what King says, but to explain how and why he says it the way he does.`,
  },
  sourceIntelligence: {
    sources: mlkAssignmentSources,
  },
  observationSchema: {
    rhetoricalStrategies: mlkRhetoricalAnalysisAssignment.rhetoricalStrategies,
    guidedPassages: mlkRhetoricalAnalysisAssignment.guidedPassages,
  },
  situationComparison: MLK_SITUATION_COMPARISON,
};

function withLegacyAssignmentAliases(
  definition: AssignmentDefinitionSections
): AssignmentDefinition {
  const { identity, writingMode, task, sourceIntelligence, observationSchema } =
    definition;
  const { sources } = sourceIntelligence;

  return {
    ...definition,

    // Legacy top-level fields remain during the stabilization phase so existing
    // modules can keep reading the same data while the grouped sections become
    // the canonical structure.
    assignmentId: identity.assignmentId,
    assignmentName: identity.assignmentName,
    title: identity.title,
    essayType: writingMode.essayType,
    essentialQuestion: task.essentialQuestion,
    authorDisplayName: writingMode.authorDisplayName,
    subjectName: writingMode.subjectName,
    prompt: task.prompt,
    cacheNamespace: identity.cacheNamespace,
    sources,
    speech: sources.speech,
    letter: sources.letter,
    rhetoricalStrategies: observationSchema.rhetoricalStrategies,
    guidedPassages: observationSchema.guidedPassages,
  };
}

/** Canonical MLK assignment definition with grouped sections + legacy aliases. */
export const mlkAssignmentDefinition: AssignmentDefinition =
  withLegacyAssignmentAliases(mlkAssignmentDefinitionSections);
