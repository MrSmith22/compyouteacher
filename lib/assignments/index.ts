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
  prompt: `Write a compare and contrast essay explaining how Dr. Martin Luther King Jr. uses ethos, pathos, and logos in both "I Have a Dream" and "Letter from Birmingham Jail."

In your essay, you must:
• Compare how King uses rhetorical appeals in both texts
• Explain how those appeals connect to audience and purpose
• Support your ideas with specific evidence from both works

Your goal is not to summarize what King says, but to explain how and why he says it the way he does.`,
  cacheNamespace: MLK_ASSIGNMENT_ID,
  speech: mlkRhetoricalAnalysisAssignment.speech,
  letter: mlkRhetoricalAnalysisAssignment.letter,
  rhetoricalStrategies: mlkRhetoricalAnalysisAssignment.rhetoricalStrategies,
  guidedPassages: mlkRhetoricalAnalysisAssignment.guidedPassages,
};
