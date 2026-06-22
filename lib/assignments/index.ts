import { MLK_ESSAY_PROMPT } from "./mlkEssayPrompt";
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
export { MLK_ESSAY_PROMPT };

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
  speech: MlkRhetoricalAnalysisAssignment["speech"];
  letter: MlkRhetoricalAnalysisAssignment["letter"];
  rhetoricalStrategies: MlkRhetoricalAnalysisAssignment["rhetoricalStrategies"];
  guidedPassages: MlkRhetoricalAnalysisAssignment["guidedPassages"];
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
  prompt: MLK_ESSAY_PROMPT,
  cacheNamespace: MLK_ASSIGNMENT_ID,
  speech: mlkRhetoricalAnalysisAssignment.speech,
  letter: mlkRhetoricalAnalysisAssignment.letter,
  rhetoricalStrategies: mlkRhetoricalAnalysisAssignment.rhetoricalStrategies,
  guidedPassages: mlkRhetoricalAnalysisAssignment.guidedPassages,
};
