# Cursor Prompt 01 — Submission Trust and Persistent Receipt

Copy and give this entire prompt to Cursor as one task.

```text
Implement the first bounded task in the July 20, 2026 Writing Processor revision program: PDF integrity, durable submission confirmation, and dashboard receipt consistency.

MANDATORY READING BEFORE EDITING

Read these files completely enough to follow their relevant requirements:

1. .cursor/rules/writing-processor-revision-strategy.mdc
2. docs/project-standards/walkthroughs/complete-walkthrough-revision-strategy-2026-07-20.md
   - Section 3.15: Success screens have three jobs
   - Section 4.5: Completion and receipt states
   - Module 9: PDF download and inspection
   - Module 9: Submission confirmation
   - Dashboard: Confirm completion and preserve access
   - Phase 1: Protect artifact and submission integrity
3. docs/project-standards/cognitive-load-charter.md
4. docs/project-standards/writing-artifact-decision-architecture.md
5. Relevant Module 9, success-screen, upload, and dashboard entries in docs/project-standards/walkthroughs/issue-log.md

In your first progress report, name the exact sections you read and summarize the constraints they place on this task.

STUDENT PROBLEM

During the completed walkthrough:

- the selected PDF displayed as 0.0 MB, creating uncertainty about whether the file was empty or merely rounded poorly;
- the app appeared to show “Your paper was received” only briefly and then redirected to the dashboard;
- the student did not receive a lasting, inspectable submission receipt;
- the final success experience was visually small and under-celebrated;
- the dashboard showed duplicate “Essay completed” language rather than a concise receipt-backed state.

OBJECTIVE

Make submission trustworthy. A valid PDF must be durably accepted before the application claims success. After upload, the student must land on a persistent Module 9 success/receipt page that survives refresh and can be reconciled with the dashboard.

SCOPE

Audit and change only the code required for:

- Module 9 PDF selection and upload validation;
- the upload API/server-side validation and durable saved state;
- Module 9 post-upload routing and success/receipt presentation;
- dashboard status and final-PDF access derived from the same durable submission;
- focused tests for these behaviors;
- issue-log entries directly related to this task.

Do not redesign APA instruction, Modules 4–7, the entire dashboard, authentication, or unrelated success pages in this task.

REQUIRED BEHAVIOR

1. Inspect the current end-to-end data path before editing:
   - browser file selection;
   - client validation;
   - upload request;
   - server validation;
   - storage write;
   - database/progress write;
   - redirect;
   - Module 9 success route, if one exists;
   - dashboard query and final-PDF link.

2. Preserve unrelated working behavior and the existing illustrated PDF-download instructions.

3. File presentation and client validation:
   - Display small valid files in KB instead of rounding them to 0.0 MB.
   - Reject a truly zero-byte file.
   - Reject an unsupported file type.
   - Give a specific, student-readable recovery message.
   - Do not rely only on the filename extension.

4. Server-side validation is authoritative:
   - Revalidate size and PDF type/content before accepting the upload.
   - At minimum, confirm a nonempty payload and a plausible PDF signature/content type using the safest existing project conventions.
   - Do not mark progress complete or store a success receipt if validation or storage fails.
   - Preserve recoverability so the student can retry without losing prior work.

5. Durable ordering:
   - Store the PDF successfully.
   - Store or confirm the durable submission record and relevant progress state.
   - Only then return success and navigate to the receipt page.
   - Never show “received” before durable success.

6. Persistent receipt page:
   - Use /modules/9/success if consistent with the current routing architecture; otherwise use the smallest coherent dedicated route.
   - The page must survive refresh and direct navigation by loading durable state rather than depending only on an in-memory success flag.
   - If no completed submission exists, show a clear recovery route back to Module 9 instead of a false receipt.
   - Show:
     * clear submitted status;
     * assignment name;
     * submitted filename;
     * submission date and time;
     * human-readable file size;
     * upload status;
     * receipt/submission identifier when the existing data model provides one safely;
     * View submitted PDF;
     * the actual resubmission policy or a neutral “contact your teacher” instruction when resubmission is not supported.

7. Success design:
   - Make the result visually proportionate to completing the full writing process.
   - Use the established design system and shared success patterns rather than inventing an unrelated visual language.
   - Include a concise accomplishment trail such as Understood → Analyzed → Planned → Drafted → Revised → Formatted → Submitted.
   - Keep receipt details primary; celebration supports them.
   - Respect reduced motion and do not require animation.

8. Dashboard consistency:
   - Derive completion and final-PDF access from the same durable submitted artifact/receipt.
   - Remove duplicate “Essay completed” wording.
   - Show the latest submission time if the data is available.
   - Ensure “Open final PDF” opens the exact submitted object recorded by the receipt.
   - Do not expose developer reset controls in production behavior.

9. State semantics:
   Keep these states distinct in code and presentation: selected, validating, uploading, upload failed, stored, receipt available. Do not collapse them into a single boolean if the current architecture can represent them safely.

10. Accessibility and responsiveness:
    - Announce upload progress and errors appropriately.
    - Move focus to the receipt heading after successful navigation using normal page behavior.
    - Ensure receipt labels and values are semantic and readable.
    - Verify keyboard operation, visible focus, 390×844, and 1440×900.

TEST REQUIREMENTS

Add or update focused tests for at least:

- tiny valid PDF displays in KB and remains selectable;
- zero-byte file rejected;
- wrong extension/MIME or non-PDF content rejected according to the implemented validation contract;
- server/storage failure does not create completion or receipt;
- durable success creates/loads a receipt;
- receipt page refresh preserves the same details;
- missing receipt shows recovery, not false success;
- dashboard uses the same final PDF and does not duplicate status text;
- existing valid upload path remains functional.

Run the relevant focused tests, then the broader automated checks proportional to the touched code. Perform the browser acceptance yourself using available browser tools, seeded states, development controls, and direct data inspection. Do not hand routine verification to Jason. If a check is genuinely impossible for the agent, explain the precise access limitation and isolate only that remainder.

ISSUE LOG

Map the work to existing WP issues without changing their historical meaning. If the transient receipt, zero-byte validation, or dashboard synchronization is not accurately represented by an existing issue, add a new issue with reproduction, educational/trust impact, acceptance criteria, related files, and status. Do not mark it Resolved until browser acceptance has passed.

FINAL REPORT

Report:

1. the audited data flow and root cause of the transient confirmation;
2. the exact implementation changes;
3. files changed;
4. automated tests and results;
5. any schema or migration implications;
6. exact browser verification you performed, including refresh/direct receipt navigation, tiny PDF, corrupt/empty PDF, failed upload, final link, mobile, desktop, and keyboard;
7. any genuinely human-only verification still required and why the agent could not perform it;
8. remaining risks or deliberately deferred work.

Do not expand into APA redesign or other modules during this task.
```
