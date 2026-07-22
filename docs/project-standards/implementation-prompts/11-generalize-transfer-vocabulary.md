# Cursor Prompt 11 — Generalize Transfer-Oriented Vocabulary

Use this prompt only after WP-089 is Resolved. It generalizes the accepted ethos foundation across all six required Module 1 concepts. It does not change quiz policy or promote the new lessons to production.

```text
Generalize the accepted WP-089 transfer-oriented lesson architecture across all six required Module 1 concepts:

1. rhetoric;
2. ethos;
3. pathos;
4. logos;
5. audience;
6. purpose.

Every lesson must begin with a concrete communication situation, teach the concept through a visible choice/effect/purpose relationship, apply it to a verified short King passage or assignment-relevant comparison, and state how the concept helps answer the essay question.

Preserve concept-specific pedagogy. Do not force rhetoric, audience, or purpose into an ethos-shaped template merely because the representative component exists. Reuse the accepted WP-089 interaction and persistence architecture while allowing each concept to have the sequence, boundary examples, prompts, and application it actually needs.

Keep the generalized experience development-only. Production, the existing quiz scoring/mastery policy, and Modules 2–9 remain unchanged.

MANDATORY READING BEFORE EDITING

1. .cursor/rules/writing-processor-revision-strategy.mdc
2. docs/project-standards/walkthroughs/complete-walkthrough-revision-strategy-2026-07-20.md
   - Sections 1–2 and 3.1–3.16
   - Sections 4.1–4.5
   - Module 1 required revision and acceptance criteria
   - Phase 4 and its exit condition
   - Sections 8–9
3. docs/project-standards/cognitive-load-charter.md
4. docs/project-standards/writing-artifact-decision-architecture.md
5. docs/working-set-v1.md
6. docs/writing-learning-process-v1.md
7. WP-055, WP-057, WP-078, WP-079, WP-088, and WP-089 in docs/project-standards/walkthroughs/issue-log.md
8. Prompt 10 and the accepted WP-089 implementation/tests/browser evidence
9. lib/module1/ethosTransferLessonContract.js
10. components/module1/EthosTransferLessonFlow.jsx
11. lib/module1/assignmentInterpretationCarryForward.js
12. lib/module1/vocabularyTermHelpers.js, step2MicrostageHelpers.js, quizHelpers.js, ModuleOne.js, and Module 1 completion/success code
13. The production Module 2–3 evidence/argument contracts and the recurring choice → audience effect → purpose language
14. Authoritative assignment source passages/citation assets already stored in the repository

Create one new bounded issue, WP-090. Do not reopen WP-089. Keep WP-090 Open during implementation and Needs Verification until all six concept families, legacy ethos state, resume, and agent browser acceptance pass.

FIRST PROGRESS REPORT — GENERALIZATION AND CONTENT AUDIT

Before editing, report:

- every ethos-only assumption in the WP-089 contract, state, component, gate, seed, tests, copy, option names, and step logic;
- the existing six canonical `VOCABULARY_TERMS`, order, definitions, visuals, King examples, essay-use cues, and mapped quiz questions;
- what instructional relationship each current term must teach—not only its definition;
- which concepts can share the WP-089 six-microstep pattern and which require term-specific variants;
- the exact conceptual boundaries students commonly confuse:
  - rhetoric versus a single appeal;
  - ethos versus unsupported authority or fame;
  - pathos versus any mention of emotion;
  - logos versus any number/fact without reasoning;
  - audience versus topic or “everyone”;
  - purpose versus topic, main idea, or audience;
- the familiar scenario proposed for each concept and why it is age-appropriate;
- the verified King/assignment passage or comparison proposed for each concept, including source ids/locators and quote-verification strategy;
- how the student’s saved assignment interpretation will appear at each transfer stage without becoming repetitive;
- how existing ethos schema-v1 state will migrate into a generalized vocabulary state without losing the current microstep or responses;
- how all six lessons will resume, mark completion, unlock the existing quiz, and preserve completed Module 1 records;
- the shared contract/renderer architecture that avoids six copied components while permitting concept-specific instruction;
- the dev gate and configurable seed/fixture matrix.

Do not edit until the concept map, passage plan, generalized state shape, and ethos migration are explicit. Do not solve generalization with one giant switch statement full of duplicated JSX.

PROBLEM TO SOLVE

WP-089 proves that ethos can be taught as transferable analysis rather than isolated vocabulary. The other five concepts still use the definition-heavy path. Simply copying the ethos lesson six times would create repetitive, misleading instruction because the concepts play different roles:

- rhetoric is the umbrella of strategic communication choices;
- ethos, pathos, and logos are analytical lenses that may overlap;
- audience is the particular group whose beliefs, needs, expectations, or situation affect a communication choice;
- purpose is the result the communicator wants the audience to understand, feel, believe, or do.

The generalized experience must help students use each concept within the recurring analysis process, not memorize six labels.

TARGET STUDENT EXPERIENCE

Across all six lessons, students repeatedly practice:

Rhetorical choice → effect on audience → contribution to purpose

By the end of Module 1 vocabulary, the student should be able to explain:

- rhetoric: communicators make strategic choices;
- ethos: a choice may build credibility or trust;
- pathos: a choice may shape feeling or emotional urgency;
- logos: a choice may help the audience follow reasoning or evidence;
- audience: choices should account for the people being addressed;
- purpose: choices and audience effects matter because the communicator wants a result.

The repetition should feel like one increasingly useful lens, not six versions of the same page.

SHARED LESSON ARCHITECTURE

Create one generalized, pure lesson-contract system derived from the accepted WP-089 contract. It should support:

- canonical term id and order;
- lesson schema version;
- term role/family (`umbrella`, `appeal`, `situation`, `goal` or similarly explicit internal classification);
- student-facing term name;
- analytical anchor and concept-specific emphasis;
- familiar scenario;
- notice-before-name prompt;
- concise definition and plain-language bridge;
- example/nonexample or another concept-appropriate boundary task;
- named audience/context;
- audience-effect reasoning where relevant;
- purpose connection;
- verified King passage/comparison/application;
- one small transfer response;
- assignment-transfer statement and essay-use cue;
- teaching feedback;
- term-specific microstep order;
- readiness/completion criteria;
- optional/reference content;
- persistence adapter/version metadata.

Architecture rules:

- one shared renderer/composable microstep system, not six full copied flows;
- content and decision logic remain pure/testable outside React;
- term-specific variants are explicit in the contract rather than hidden in fragile text matching;
- every term begins with noticing before the academic label dominates the task;
- every term ends by reconnecting to the saved assignment interpretation;
- examples model reasoning structure without answering the King task;
- no contract contains student response prose;
- no automatic advancement.

CONCEPT-SPECIFIC INSTRUCTIONAL CONTRACTS

## Rhetoric — the umbrella

Teach rhetoric as purposeful communication choices, not as a synonym for lying, fancy language, or ethos/pathos/logos alone.

- Familiar situation: one message can be phrased differently depending on audience and goal.
- Notice: what choice did the communicator make and why might it matter?
- Boundary: rhetoric includes many strategic choices; ethos/pathos/logos are important analytical lenses under that larger umbrella.
- Application: use a short King example showing a deliberate choice, then ask what it may do for the audience and purpose.
- Transfer: the essay studies how King chooses different rhetorical resources in a speech and letter.

The lesson must visibly establish the umbrella relationship preserved by existing tests.

## Ethos — credibility and trust

Preserve the accepted WP-089 content and behavior unless generalization reveals a correctness/accessibility defect. Migrate existing ethos responses without loss.

- Keep notice before name.
- Keep credibility distinct from unsupported “trust me,” fame alone, emotion, or data alone.
- Keep probabilistic audience-effect language.
- Keep the verified `speech-ethos` passage unless the audit establishes a stronger authoritative choice.

## Pathos — emotion and audience response

Teach pathos as a communication choice intended to shape feeling in service of purpose—not merely the presence of emotional subject matter.

- Familiar situation should expose a deliberate emotional choice.
- Boundary task must distinguish purposeful emotional appeal from emotion that is incidental, unsupported emotional manipulation, ethos, or logos.
- Audience-effect reasoning should name a plausible feeling and what it may make the audience more ready to consider or do.
- King application should use a verified short passage with a defensible emotional move.
- Do not assert that every listener will feel the same thing.

## Logos — reasoning and support

Teach logos as reasons/evidence connected so an audience can follow why a claim makes sense—not “a fact,” “a number,” or “logic” as a label alone.

- Familiar situation should require choosing between a supported reason and an unsupported assertion.
- Boundary task should distinguish relevant reasoning from random statistics, credentials, or emotional storytelling.
- Audience-effect reasoning should focus on understanding, plausibility, or ability to follow the case.
- King application should use a verified passage with an actual reasoning connection.
- Do not imply that evidence proves a conclusion automatically.

## Audience — people and context

Teach audience as the particular person/group being addressed, with beliefs, concerns, expectations, knowledge, and situation—not “anyone who reads” or the essay topic.

- Familiar situation should compare how the same request/message changes for two audiences.
- Notice task may ask which communication choice better fits a named audience.
- Boundary task must distinguish audience from purpose and topic.
- Application should compare or inspect a short speech/letter choice whose fit depends on audience.
- The anchor should emphasize: choice is made for an audience → likely effect → purpose.

Do not force “audience effect” as a separate duplicate stage if a combined audience-fit decision is clearer; preserve all required reasoning in the term-specific contract.

## Purpose — intended result

Teach purpose as what the communicator wants the audience to understand, feel, believe, or do—not the topic, length, audience, or vague “to inform/persuade” label without a concrete result.

- Familiar situation should show one topic used for different intended results or one communicator changing choices because the desired result changes.
- Boundary task must distinguish purpose from audience and subject.
- Application should ask what King wants this audience to understand, feel, believe, or do and how a visible choice supports that result.
- End by assembling the complete recurring anchor across all six terms.

TERM ORDER AND CUMULATIVE LEARNING

Preserve the canonical order:

rhetoric → ethos → pathos → logos → audience → purpose

Use cumulative recall sparingly:

- rhetoric introduces the umbrella and anchor;
- ethos/pathos/logos reuse the anchor with distinct effects;
- audience makes the recipient/context explicit;
- purpose completes and consolidates the chain.

Show a compact “What you’ve learned” trail after each completed lesson. Do not display all prior lesson text on every screen. The final purpose transfer may show the full six-term concept map before the existing quiz unlocks.

FAMILIAR SCENARIO QUALITY

Every scenario must:

- be understandable without specialist knowledge;
- identify or make inferable the communicator, audience, and purpose;
- contain a real communication choice;
- support one plausible nonexample/boundary distinction;
- avoid stereotypes, culture-specific assumptions, medical/legal certainty, or fear-heavy framing;
- remain concise on mobile;
- differ enough across terms to avoid monotony;
- not pre-teach the academic answer in the heading.

Scenarios should feel like communication decisions students could encounter, not six mini textbook passages.

KING PASSAGE AND SOURCE INTEGRITY

For rhetoric, ethos, pathos, logos, audience, and purpose, use only verified assignment-owned short passages or comparisons.

Each application contract must retain:

- source id (`speech` or `letter`, or an explicit two-work comparison);
- guided passage id;
- exact quotation or precise locator;
- enough surrounding context or a source link/disclosure for honest inspection;
- citation-safe metadata already available;
- a documented instructional justification;
- quote-verification test against the authoritative stored source asset when technically available.

Do not fabricate, paraphrase as a quotation, or use the same passage for every term merely for convenience. Reuse is allowed only when the different analytical lens is genuinely instructive and clearly named.

If an authoritative passage is missing, log the source gap and keep that term out of the generalized gate until it is resolved. Do not silently substitute fallback text.

APPLICATION AND FEEDBACK

Each King application must require a small act of transfer appropriate to the concept:

- choose/identify a communication move or relationship;
- predict or explain an audience response;
- connect it to purpose;
- optionally complete one short sentence stem.

Students should not have to draft paragraphs in Module 1. Definition recall alone is insufficient.

Preserve WP-055 teaching feedback:

- “That works.” / “Let’s look closer.” or accepted neutral equivalents;
- explanation of why the choice fits or what distinction to inspect;
- accessible status announcement;
- not color-only;
- reasonable uncertainty accepted where audience effect is interpretive;
- student text preserved exactly;
- feedback before Continue.

ASSIGNMENT INTERPRETATION CARRY-FORWARD

Reuse `assignmentInterpretationCarryForward` for every term’s final transfer stage.

- Keep the student’s saved wording when available.
- Use the assignment-owned fallback only when necessary.
- Do not overwrite or polish the paraphrase automatically.
- Keep the reference on the shelf during early microsteps.
- Bring it onto the desk only when connecting the concept to the assignment.
- Vary the transfer statement by concept so it explains that concept’s role rather than repeating identical boilerplate six times.
- If the paraphrase changes, mark only the affected transfer confirmations for review; preserve completed instructional decisions.

GENERALIZED PERSISTENCE AND ETHOS MIGRATION

Replace/extend the representative state with one versioned state keyed by canonical term id, for example an additive `vocabularyTransfer` object in the existing Module 1 Step 2 draft.

Persist per term:

- current microstep;
- decisions/responses;
- feedback-seen states;
- King application response;
- assignment-transfer confirmation/signature;
- completion;
- updated timestamp.

Also persist:

- active term id/index;
- generalized schema version;
- cumulative completion trail;
- quiz-unlock readiness derived from all six lessons.

Migration requirements:

- normalize existing WP-089 `ethosTransfer` schema-v1 into the generalized ethos entry;
- preserve current ethos microstep, every choice, optional follow-up text, feedback state, paraphrase signature, review flag, and completion;
- never concatenate or reinterpret student text;
- preserve legacy students outside the development gate;
- completed Module 1 remains completed and never reopens;
- upgrade only on an authenticated normal save, not render;
- refresh/direct reopen restore the active term and microstep;
- Back remains local within a term, and prior/next term navigation preserves progress.

QUIZ BOUNDARY

Do not change the quiz’s scoring, passing threshold, retry/mastery policy, question ids, or persistence schema in this prompt.

Integration requirements:

- the quiz remains hidden until all required vocabulary lessons complete;
- every quiz concept has been explicitly taught in the generalized lessons;
- existing quiz questions remain answerable from visible instruction;
- if a quiz item conflicts with corrected transfer instruction, report it and make only the smallest content-alignment fix without changing policy or identifiers;
- returning students with completed vocabulary/quiz state are not forced through the new lessons under the dev gate unless explicitly seeded for testing.

SHARED UI AND COGNITIVE LOAD

Build one generalized flow component/composable lesson renderer from WP-089.

- one decision per microstep;
- notice before term label dominates;
- active task above references;
- explicit Check/Continue;
- completed microsteps collapse to a concise trail;
- Back is local;
- next term is explicit;
- no selection/length/timer auto-advance;
- optional definition/visual/source context under meaningful disclosures;
- no duplicate top headings or repeated reassurance blocks;
- progress states identify term and local step without presenting an intimidating total of every click across all six lessons.

DEVELOPMENT GATE AND SEEDS

Generalize the existing gate using the canonical `VOCABULARY_TERMS` ids/order rather than a duplicated one-off list.

- Development only.
- All six valid terms use the generalized lesson path.
- Unknown/malformed term ids fail safely.
- Production remains unchanged.

Provide a configurable WP-090 seed or a small set of family variants:

- start of rhetoric;
- mid-pathos application;
- mid-logos boundary task;
- audience versus purpose distinction;
- purpose/final concept-map transfer;
- partially completed all-six path;
- completed vocabulary ready for quiz;
- legacy WP-089 ethos schema-v1 resume;
- changed assignment paraphrase;
- missing authoritative passage failure fixture.

Do not add six cluttering panel buttons. Use a variant selector or concise seed family. Seeds remain development-only.

AUTOMATED ACCEPTANCE

Add table-driven executable tests proving:

1. exactly the six canonical terms are covered in canonical order;
2. every lesson begins with notice before name/definition;
3. every lesson connects choice, audience effect/fit, and purpose appropriately;
4. every lesson includes a concept-appropriate boundary task;
5. rhetoric preserves the umbrella relationship;
6. ethos preserves accepted WP-089 behavior;
7. pathos distinguishes purposeful emotional appeal from emotional subject matter;
8. logos requires connected reasoning/support, not a random fact;
9. audience remains distinct from purpose/topic;
10. purpose names an intended audience result;
11. every King passage/comparison has source metadata and verification evidence;
12. every King task requires transfer, not definition recall;
13. feedback teaches target and non-target choices;
14. assignment paraphrase carries forward without overwrite;
15. concept-specific transfer statements are not duplicated boilerplate;
16. generalized state round-trips for all terms;
17. WP-089 ethos schema-v1 migration is lossless;
18. paraphrase changes preserve lesson responses and mark transfer review;
19. no selection/character/timer auto-advance;
20. quiz remains gated until six completions and existing quiz policy/ids persist;
21. completed Module 1 records remain completed;
22. canonical gate covers all six only in development;
23. production/dev-tool boundaries remain intact;
24. Module 2 analytical-anchor compatibility remains intact.

Run focused WP-055/WP-078/WP-089/WP-090 tests, the proportional Module 1 suite, and read-only Module 2 handoff compatibility tests.

AGENT BROWSER ACCEPTANCE — REQUIRED

Cursor owns routine acceptance. Verify at 390×844 and 1440×900:

1. Rhetoric: familiar notice precedes academic label; umbrella relationship appears; King application uses the full anchor.
2. Ethos: legacy WP-089 state resumes at the same microstep with identical responses.
3. Pathos: boundary feedback distinguishes deliberate emotional effect; audience-effect uncertainty remains truthful.
4. Logos: reasoning/support boundary does not reduce logos to “a fact.”
5. Audience: same-message/different-audience task clearly distinguishes audience from purpose.
6. Purpose: intended result is distinguished from topic/audience; final six-term concept map appears.
7. Verified passages/source context are accessible for each concept.
8. Saved assignment paraphrase appears on each transfer desk without repetitive top-page clutter.
9. Refresh restores the active term/microstep and response.
10. Back stays local; next-term navigation preserves completion.
11. Selecting an answer never auto-advances; feedback appears before Continue.
12. Completing all six unlocks the unchanged quiz; incomplete lessons do not.
13. Quiz questions remain answerable from the taught instruction.
14. Changed paraphrase preserves progress and requests only transfer review.
15. Keyboard/focus order is logical; feedback is announced; active work is primary; no horizontal overflow.

Use agent automation, API/persistence inspection, and executable tests wherever possible. Human review is limited to irreducibly subjective age fit or coaching tone; do not ask Jason to repeat routine checks.

FIRST RESPONSE AFTER READING

Return:

1. governing sections read;
2. ethos-only assumptions found;
3. six-concept instructional map;
4. familiar-scenario and verified-passage table;
5. generalized contract/UI architecture;
6. state schema and ethos-v1 migration plan;
7. quiz-boundary compatibility plan;
8. gate/seed strategy;
9. files expected to change;
10. automated/browser acceptance matrix;
11. explicit out-of-scope boundaries.

Then implement, run agent acceptance, fix findings, update WP-090, and report evidence. Do not mark WP-090 Resolved until all six concepts and ethos-v1 migration pass.

OUT OF SCOPE

- changing quiz scoring, mastery, retry, question ids, or persistence policy;
- production promotion of the generalized vocabulary lessons;
- changing the Module 1 prompt-breakdown task;
- Modules 2–9 redesign;
- broad visual-system or success-screen redesign;
- AI-generated or automatically rewritten student explanations;
- removing the legacy Module 1 vocabulary path.
```
