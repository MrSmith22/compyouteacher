# Comp-YouTeacher Cognitive Load Charter

| | |
|---|---|
| **Document role** | Normative design charter (enduring rules) |
| **Status** | Adopted guidance for cognitive-load and instructional product decisions |
| **Does not prove** | Implementation acceptance, beta-readiness, or production-readiness by itself |
| **Version freeze** | 2026-07-14 · branch `observation-engine-redesign` @ `f04ddbf` |
| **Related** | [Cognitive-load audit (historical)](audits/cognitive-load-audit-modules-1-6.md) · [Writing-artifact decision architecture](writing-artifact-decision-architecture.md) · [Mission-alignment roadmap](roadmaps/cognitive-load-mission-alignment-roadmap.md) · [Master walkthrough blueprint](walkthroughs/master-walkthrough-blueprint.md) · [Issue log](walkthroughs/issue-log.md) |

This charter states **what good instruction should look like**. Checkpoint and WP work should be judged against these rules. Automated tests and a green suite are necessary evidence of mechanical integrity; they do not replace human instructional, visual, or beta verification.

## Primary mission

Comp-YouTeacher teaches writing by making complex thinking visible, sequential, and manageable.

Students should not have to hold an entire paper in their minds. At every moment, the application should help them:

1. Understand the one decision they are making now.
2. See the exact information needed to make it.
3. Use a clear strategy for making it.
4. Save the result outside their working memory.
5. Carry that result into the next decision.
6. Understand how the decisions gradually become a finished piece of writing.

The goal is not merely to help students complete one assignment. The goal is to teach a repeatable process for reducing cognitive load whenever they must organize evidence, make decisions, and communicate conclusions.

## The fundamental instructional cycle

Every meaningful step should follow this cycle:

1. **Explain the strategy:** Tell the student what kind of thinking they are about to do and why writers do it.
2. **Narrow the focus:** Ask one meaningful question or require one thinking operation.
3. **Present necessary context:** Show only the prior work, source material, definitions, or criteria needed for the task.
4. **Capture one result:** The student makes one choice, evaluation, connection, or explanation.
5. **Externalize the result:** Save it visibly so the student no longer has to remember it.
6. **Personalize the next task:** Use the decision to determine which evidence, questions, comparisons, or planning options appear next.
7. **Preserve revision:** Earlier decisions remain editable; dependent work is marked for review rather than silently rewritten or discarded.

## The screen contract

Every working screen should answer:

- What am I doing right now?
- Why am I doing it?
- What should I look at to make this decision?
- What strategy should I use?
- What will be saved when I finish?
- Where will this thinking go next?

A working screen should normally contain:

- one dominant question;
- one response mode;
- a short explanation of the strategy;
- only the relevant saved artifacts;
- an observable completion condition;
- a brief preview of the next step.

If a screen contains multiple independent thinking operations, it should usually be divided into smaller tasks.

## Necessary context, not maximum context

“One thing at a time” does not mean hiding information the student needs. It means separating the active decision from everything not currently relevant.

Distinguish among:

- **Active task:** what the student is deciding now;
- **Required context:** information needed to decide;
- **Reference material:** potentially useful information kept collapsed or secondary;
- **Future work:** information that should not yet compete for attention.

Students should never be required to remember information from a previous screen when the application can display it beside the current task.

## Student decisions should drive the path

The application should not be only a fixed sequence of generic forms. It should be a shared writing process whose contents adapt to prior student decisions.

Personalization should be:

- deterministic enough to test;
- transparent;
- traceable to saved work;
- reversible;
- advisory rather than controlling.

Use explanations such as:

- “Because you rated ethos much higher in the letter than in the speech…”
- “Because you selected this difference as important…”
- “These are the quotations you connected to that pattern…”
- “This paragraph is carrying the comparison you chose earlier…”

Students must be able to choose a different direction.

## The rhetorical-strategy matrix

For the current King assignment:

| Work | Ethos | Pathos | Logos |
|---|---:|---:|---:|
| Speech | Student evaluation | Student evaluation | Student evaluation |
| Letter | Student evaluation | Student evaluation | Student evaluation |

The completed matrix is useful, but students should not initially confront all six evaluations simultaneously.

### One cell at a time

For each work and appeal, ask:

1. How strongly does King rely on this appeal in this work?
2. Which saved evidence best supports that evaluation?
3. What does this appeal help King accomplish with this audience?

Use an anchored scale such as:

- **0:** Not meaningfully used
- **3:** Limited or secondary
- **5:** Clearly present
- **7:** Strong and important
- **10:** Central to how the audience is persuaded

The rating is a provisional analytical judgment, not an objective measurement. It must remain connected to evidence and editable.

### Reveal the matrix gradually

After each microtask, fill one cell. The matrix becomes a visual record of completed thinking, not a large form completed all at once.

### Derive personalized comparisons

After completion, identify:

- the largest difference between the works;
- an important similarity;
- the dominant appeal in each work;
- appeals that are present but secondary;
- ratings lacking supporting evidence.

Show the student’s ratings and evidence so each recommendation is transparent.

Example:

“You rated ethos 9 in the letter and 3 in the speech. That is your largest contrast. Why might the clergymen require more deliberate credibility than the public audience?”

### Let the student choose the direction

The matrix generates a small set of evidence-based possibilities; it does not write a thesis.

The student might select:

- a major difference;
- a meaningful similarity;
- the dominant strategy in each work;
- one appeal traced across both works;
- another pattern the student notices.

That choice determines which evidence and questions appear during claim, thesis, paragraph planning, and outlining.

## The artifact chain

Source observations  
→ appeal evaluations  
→ comparison matrix  
→ selected pattern  
→ audience/purpose explanation  
→ claim  
→ thesis and proof directions  
→ paragraph points and jobs  
→ evidence and reasoning  
→ ordered outline  
→ draft  
→ revision

Every arrow must be a comprehensible transformation.

Students should be able to answer:

- What did I already decide?
- How is that decision helping me now?
- What new decision am I adding?
- How will this become part of the paper?

No module should feel like starting over.

## Thinking support and language support are different

A student may have a strong idea but difficulty expressing it. Do not treat language difficulty as absence of thought.

First support the analytical decision. Then offer optional language support:

- sentence openings;
- transition choices;
- vocabulary reminders;
- speech-to-text;
- structural models rather than generated answers.

Language scaffolds help students express their thinking without replacing it.

## Mechanical gates

Completion gates verify observable process requirements, not whether an idea is correct.

Examples:

- a rating was selected;
- evidence was chosen;
- an explanation meets a modest threshold;
- a paragraph has a point, job, evidence, and reasoning;
- an outline contains required sections.

When a choice appears inconsistent, explain the conflict and allow intentional continuation.

## Risks to avoid

### False precision

Ratings are thinking tools, not scientific measurements. Provide anchors, evidence, and revision.

### Over-scaffolding

Reduce load without turning writing into compliance. Explain strategies, preserve choice, and allow overrides.

### Fragmentation

Microtasks must remain connected. Continually show how completed pieces accumulate.

### Hidden automation

Never silently turn a student choice into a conclusion. Show why recommendations appear.

### Static shelves

Do not display every artifact merely because it exists. Show required artifacts and keep the rest secondary.

### Premature prose

Do not ask students to draft while they are still deciding what they think. Plan the thinking first; phrase it later.

## Screen-level audit questions

Before approving a screen, ask:

1. Is there exactly one dominant thinking operation?
2. Does the student know why it matters?
3. Is every necessary piece of context visible?
4. Is unnecessary information competing for attention?
5. Does the student have a strategy for deciding?
6. Does the task produce a reusable artifact?
7. Does the next task actually use that artifact?
8. Is personalization visibly connected to student choices?
9. Can the student revise safely?
10. Does the screen teach a transferable process?
11. Does it recompose on mobile, tablet, and desktop?
12. Would an overwhelmed student know exactly where to begin?

If any of the first eight answers is no, the screen is not instructionally complete.

## Transfer beyond academic essays

The same process can support workplace reports:

Purpose and audience  
→ evaluation criteria  
→ evidence matrix  
→ important patterns  
→ selected findings  
→ prioritized recommendations  
→ report sections  
→ outline  
→ draft  
→ revision

The durable product is not a rhetorical-analysis wizard. It is a structured thinking system that teaches people to reduce cognitive load while producing evidence-based writing.

## Where this charter fits

| Document | What it is |
|---|---|
| **This charter** | Enduring rules |
| [Cognitive-load audit](audits/cognitive-load-audit-modules-1-6.md) | Historical snapshot at `6c378b8` (not current product state) |
| [Writing-artifact decision architecture](writing-artifact-decision-architecture.md) | Architectural decision record + current implementation status |
| [Mission-alignment roadmap](roadmaps/cognitive-load-mission-alignment-roadmap.md) | Executed checkpoints CP-A–H + remaining verification |
| [Master walkthrough blueprint](walkthroughs/master-walkthrough-blueprint.md) | Living beta-readiness / walkthrough execution guide |
| [Issue log](walkthroughs/issue-log.md) | Authoritative WP issue status (Resolved vs Needs Verification) |

**Shared truths this charter requires:**

- Module 2 owns the rhetorical-strategy matrix.
- Module 3 consumes a selected direction with legacy fallback when no matrix exists.
- Downstream artifacts carry provenance; upstream changes mark **needs review** without silently rewriting student prose.
- Students author Claim, Thesis, draft, and revision prose.
- Planning representation and writing representation are different; planning labels must not wrap assembled essay prose.
- Automated verification does not replace manual verification.
- **Needs Verification** is not the same as **Resolved**.
- A passing suite is necessary but not sufficient for beta-readiness or production-readiness.
