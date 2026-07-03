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

export type AssignmentSourceDefinition = {
  sourceType: SourceType;
  label: string;
  title: string;
  audience: string;
  purpose: string;
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
};

export type AssignmentDefinition = {
  assignmentId: typeof MLK_ASSIGNMENT_ID;
  assignmentName: typeof MLK_ASSIGNMENT_NAME;
  title: string;
  essayType: string;
  essentialQuestion: string;
  authorDisplayName: string;
  subjectName: string;
  prompt: string;
  cacheNamespace: typeof MLK_ASSIGNMENT_ID;
  sources: Record<SourceType, AssignmentSourceDefinition>;
  speech: MlkRhetoricalAnalysisAssignment["speech"];
  letter: MlkRhetoricalAnalysisAssignment["letter"];
  rhetoricalStrategies: MlkRhetoricalAnalysisAssignment["rhetoricalStrategies"];
  guidedPassages: MlkRhetoricalAnalysisAssignment["guidedPassages"];
};

const mlkAssignmentSources: Record<SourceType, AssignmentSourceDefinition> = {
  speech: {
    sourceType: "speech",
    label: "Speech",
    title: mlkRhetoricalAnalysisAssignment.speech.title,
    audience: mlkRhetoricalAnalysisAssignment.speech.audience,
    purpose: mlkRhetoricalAnalysisAssignment.speech.purpose,
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

/** Canonical MLK assignment — identity + content references for Phase A. */
export const mlkAssignmentDefinition: AssignmentDefinition = {
  assignmentId: MLK_ASSIGNMENT_ID,
  assignmentName: MLK_ASSIGNMENT_NAME,
  title: mlkRhetoricalAnalysisAssignment.title,
  essayType: "compare-and-contrast-rhetorical-analysis",
  essentialQuestion: mlkRhetoricalAnalysisAssignment.essentialQuestion,
  authorDisplayName: "Dr. Martin Luther King Jr.",
  subjectName: "Dr. Martin Luther King Jr.",
  prompt: `Write a compare and contrast essay explaining how Dr. Martin Luther King Jr. uses ethos, pathos, and logos in both "I Have a Dream" and "Letter from Birmingham Jail."

In your essay, you must:
• Compare how King uses rhetorical appeals in both texts
• Explain how those appeals connect to audience and purpose
• Support your ideas with specific evidence from both works

Your goal is not to summarize what King says, but to explain how and why he says it the way he does.`,
  cacheNamespace: MLK_ASSIGNMENT_ID,
  sources: mlkAssignmentSources,
  speech: mlkAssignmentSources.speech,
  letter: mlkAssignmentSources.letter,
  rhetoricalStrategies: mlkRhetoricalAnalysisAssignment.rhetoricalStrategies,
  guidedPassages: mlkRhetoricalAnalysisAssignment.guidedPassages,
};
