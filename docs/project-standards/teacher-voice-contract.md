# Teacher-voice contract (WP-098)

Student-facing language should sound like a writing teacher guiding the current decision—not like an LMS, schema dump, or software narrator.

## String jobs

| Job | Intent |
|---|---|
| `task_question` | Plain, direct, student-addressed |
| `coaching` | Short explanation tied to the current decision |
| `teaching_feedback` | Explains why a choice works or needs another look |
| `status` | Factual, calm, artifact-backed |
| `recovery` | Names the problem, preserves trust, next safe action |
| `technical_instruction` | Literal UI verb and destination |
| `success` | Names the actual accomplishment and next use |
| `reference` | Optional and clearly secondary |
| `action` | Button/link verb; may stay short when adjacent coaching clarifies |

## Preferred voice

- Conversational but not childish
- Specific about the student’s current work
- Reader- and purpose-centered
- Confident without false certainty
- Concise enough for the current decision
- Respectful of student ownership
- Explicit when the system is uncertain

## Avoid

- Software narration (`the processor`, `schema`, `export row`, `flow state`, `fixture`, `rollout`)
- Empty LMS commands as headings (`Complete`, `Proceed`, `Submit` without context)
- Repeated reassurance that writing is finished on every neighboring card
- Praise disconnected from evidence
- Pass/fail or score framing where the accepted flow uses feedback
- Pretending a save/upload/submission happened before durable evidence exists
- Presenting a teacher preference as universal APA law
- Generated prose that takes authorship from the student

## Keep precise technical verbs

`Create Google Doc`, `Update Google Doc`, `Open Google Doc`, `Download PDF`, `Choose file`, and `Upload Final PDF` may be the clearest teacher guidance for real actions.

## Brand chrome

The product title **The Writing Processor** may appear in landing/sidebar chrome. Instructional narration should not say “edit in the processor” or “the Writing Processor will carry…”.

## Safety

Do not change option values, correctness, gates, destinations, test ids, persistence keys, or student-authored text under a voice pass. When a string is already clear, leave it alone.

Machine-check helpers live in `lib/ui/teacherVoiceContract.js`.
