# Data Plan Draft (AI ready)

## Purpose
Define the core student work artifacts we store, why we store them, and how AI will use them later.

## Core Concepts
- assignment (the prompt/topic)
- module
- step
- student work artifact (text, quote, reflection, upload, etc.)
- progress/resume_path
- teacher visibility (dashboard)

## Current Tables (fill in)
List the tables you already have and what they store:
- student_assignments:
- module2_sources:
- tchart_entries:
- student_outlines:
- student_drafts:
- (other):

## Target Long Term Shape (draft)
Artifacts we will eventually treat as first class tables or unified “student_artifacts”:
- sources (APA citations + URLs + raw text)
- t-chart entries (ethos/pathos/logos comparisons)
- thesis versions
- bucket groups
- outlines
- draft versions
- revision notes
- audio recordings metadata
- APA quiz results
- final submissions (pdf url)

## AI Notes (future)
- coaching_interactions table to log:
  - input snapshot
  - prompt template id
  - response
  - timestamps
  - optional rubric scores
