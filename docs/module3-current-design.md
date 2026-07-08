# Module 3 Current Design

This document describes the **current implementation** of Module 3 exactly as it works today in the application.

It covers the student-facing sequence, every prompt and input, the data flow into and out of Supabase, the API routes and helpers involved, the reuse of earlier module data, and the direct downstream dependencies in later modules.

## Scope

This document is based on the current behavior of:

- `app/modules/3/page.js`
- `components/ModuleThreeForm.js`
- `app/modules/3/success/page.js`
- `app/api/module2/sources/route.js`
- `lib/supabase/helpers/tchartEntries.ts`
- `lib/parseModule2Observation.js`
- `lib/logActivity.js`
- `lib/supabase/helpers/studentAssignments.ts`
- `app/modules/4/page.js`
- `components/ModuleFour.js`
- `components/ModuleFive.js`
- `app/texts/speech/page.js`
- `app/texts/letter/page.js`

## High-Level Summary

Module 3 is a **single multi-step wizard** followed by a success page.

Its instructional job in the current build is to move students from Module 2 analysis into a comparative thesis by having them:

1. name the audience for each text
2. name the purpose for each text
3. explain how King uses ethos, pathos, and logos in relation to audience and purpose
4. choose one of three organizational patterns
5. write a full thesis

The module pulls in saved work from Module 2 so students can answer with their prior notes visible beside the prompts.

## Main Student Flow

The required Module 3 path is:

1. `/modules/3` loads and records a Module 3 start event
2. Welcome screen
3. Guided screen: Speech audience
4. Guided screen: Letter audience
5. Guided screen: Speech purpose
6. Guided screen: Letter purpose
7. Appeal screen: Speech appeals adapted to audience
8. Appeal screen: Speech appeals adapted to purpose
9. Appeal screen: Letter appeals adapted to audience
10. Appeal screen: Letter appeals adapted to purpose
11. Thesis screen
12. `/modules/3/success`

### Optional support pages available during the module

From the guided and appeal screens, students can also open:

- `/texts/speech` in a new tab
- `/texts/letter` in a new tab
- the original speech source URL in a new tab
- the original letter source URL in a new tab

These support pages are not part of the required forward sequence, but they are available throughout the work screens as reference tools.

## Screen-by-Screen Description

### 1. Loading state

Before the wizard is ready, the student may briefly see:

> Loading your work...

Purpose:

- load any previously saved Module 3 responses
- load Module 2 T-chart entries
- load Module 2 source URLs for the support buttons

No student input is collected on this state.

### 2. Welcome screen

Heading:

> Welcome to Module 3

Instructional paragraph shown:

> In Module 2 you collected trustworthy texts and recorded Ethos, Pathos, and Logos with quotes. In this module you will name each text's audience and purpose, explain how King's appeals reach that audience and serve that purpose, and draft a comparative thesis. Your Module 2 notes will appear beside the connection questions so you are not working from memory alone.

Media shown:

- heading: `Thesis statement walkthrough (optional)`
- video file: `/videos/thesis-intro.mp4`

Purpose:

- orient the student to what Module 3 will do
- frame the module as a bridge from Module 2 notes to a comparative thesis
- optionally give the student a thesis video before the writing steps begin

Student input on this screen:

- none

Navigation:

- `Next`

### 3. Guided screen: Speech audience

Heading:

> Speech — Audience

Instructional text shown:

> Take this one piece at a time. A clear phrase here will anchor the rest of your essay.

Tip shown:

> Tip: Picture who would be in the room or who would open the letter. Then name that group in plain language.

Grounding reminder shown above support buttons:

> Keep the text open while you work so your answer stays grounded in King's actual words.

Support buttons shown:

- `Open My Saved Speech Copy`
- `Open Original Speech Source`

Question asked:

> Who is Dr. King primarily addressing in the I Have a Dream speech?

Hint shown:

> Use a short phrase only (about six words or fewer), not a full sentence.

Purpose:

- collect the student's short audience label for the speech
- establish language that will later be reused inside dynamic appeal prompts and the thesis support text

Data collected:

- `responses[0]` = speech audience phrase

Validation:

- student cannot continue unless the response is non-empty and six words or fewer
- if too long, the screen shows:

> Keep it short—just a phrase (about six words or fewer).

### 4. Guided screen: Letter audience

Heading:

> Letter — Audience

Instructional text shown:

> Take this one piece at a time. A clear phrase here will anchor the rest of your essay.

Tip shown:

> Tip: Picture who would be in the room or who would open the letter. Then name that group in plain language.

Grounding reminder shown:

> Keep the text open while you work so your answer stays grounded in King's actual words.

Support buttons shown:

- `Open My Saved Letter Copy`
- `Open Original Letter Source`

Question asked:

> Who is the Letter from Birmingham Jail mainly written for?

Hint shown:

> Short phrase only (about six words or fewer).

Purpose:

- collect the student's short audience label for the letter

Data collected:

- `responses[2]` = letter audience phrase

Validation:

- student cannot continue unless the response is non-empty and six words or fewer
- if too long, the same short-phrase warning appears

### 5. Guided screen: Speech purpose

Heading:

> Speech — Purpose

Instructional text shown:

> Take this one piece at a time. A clear phrase here will anchor the rest of your essay.

Tip shown:

> Tip: Think about what King is trying to make this audience understand, believe, feel, or do.

Grounding reminder shown:

> Keep the text open while you work so your answer stays grounded in King's actual words.

Support buttons shown:

- `Open My Saved Speech Copy`
- `Open Original Speech Source`

Question asked:

> What is King trying to accomplish in the speech?

Hint shown:

> Short phrase only (about six words or fewer).

Purpose:

- collect the student's short purpose label for the speech

Data collected:

- `responses[1]` = speech purpose phrase

Validation:

- student cannot continue unless the response is non-empty and six words or fewer
- if too long, the same short-phrase warning appears

### 6. Guided screen: Letter purpose

Heading:

> Letter — Purpose

Instructional text shown:

> Take this one piece at a time. A clear phrase here will anchor the rest of your essay.

Tip shown:

> Tip: Think about what King is trying to make this audience understand, believe, feel, or do.

Grounding reminder shown:

> Keep the text open while you work so your answer stays grounded in King's actual words.

Support buttons shown:

- `Open My Saved Letter Copy`
- `Open Original Letter Source`

Question asked:

> What is King trying to accomplish in the letter?

Hint shown:

> Short phrase only (about six words or fewer).

Purpose:

- collect the student's short purpose label for the letter

Data collected:

- `responses[3]` = letter purpose phrase

Validation:

- student cannot continue unless the response is non-empty and six words or fewer
- if too long, the same short-phrase warning appears

System behavior after this screen:

- when the student clicks `Next` from this screen, the module generates twelve dynamic appeal prompts using the four audience/purpose phrases just entered

### 7. Appeal screen: Speech appeals adapted to audience

Heading:

> Speech: Appeals Adapted to Audience

Instructional paragraph shown:

> Below each prompt you'll see what you saved in Module 2 for that appeal. Use it as evidence while you explain how King shapes Ethos, Pathos, and Logos for the audience or purpose you named earlier.

Grounding reminder shown above support buttons:

> Keep the text open while you work so you can stay grounded in King's actual words and choose accurate evidence.

Support buttons shown:

- `My Saved Speech Copy`
- `Original Speech Source`

For each of the three appeal prompts, the student also sees a Module 2 scaffold card. If data exists for that appeal, the card may show:

- `Module 2 · ethos/pathos/logos · speech`
- `Quote:`
- `Your explanation:`
- `Audience effect:`
- `Purpose connection:`

If there is no saved Module 2 note for that appeal, the student sees:

> No saved Module 2 note for this appeal yet. You can still answer here, or go back to Module 2 to add a quote and observation.

Questions asked on this screen:

1. `In the speech, how does King use Ethos when speaking to [speech audience]?`
2. `In the speech, how does King use Pathos when speaking to [speech audience]?`
3. `In the speech, how does King use Logos when speaking to [speech audience]?`

Purpose:

- move from naming the speech audience to explaining how each appeal is shaped for that audience

Data collected:

- `responses[4]` = speech ethos for audience
- `responses[5]` = speech pathos for audience
- `responses[6]` = speech logos for audience

Validation:

- all three textareas must contain non-empty text before the student can continue

### 8. Appeal screen: Speech appeals adapted to purpose

Heading:

> Speech: Appeals Adapted to Purpose

Instructional paragraph shown:

> Below each prompt you'll see what you saved in Module 2 for that appeal. Use it as evidence while you explain how King shapes Ethos, Pathos, and Logos for the audience or purpose you named earlier.

Grounding reminder shown:

> Keep the text open while you work so you can stay grounded in King's actual words and choose accurate evidence.

Support buttons shown:

- `My Saved Speech Copy`
- `Original Speech Source`

The same Module 2 scaffold behavior appears under each appeal.

Questions asked on this screen:

1. `In the speech, how does King use Ethos to support his purpose of [speech purpose]?`
2. `In the speech, how does King use Pathos to support his purpose of [speech purpose]?`
3. `In the speech, how does King use Logos to support his purpose of [speech purpose]?`

Purpose:

- move from naming the speech purpose to explaining how each appeal supports that purpose

Data collected:

- `responses[7]` = speech ethos for purpose
- `responses[8]` = speech pathos for purpose
- `responses[9]` = speech logos for purpose

Validation:

- all three textareas must contain non-empty text before the student can continue

### 9. Appeal screen: Letter appeals adapted to audience

Heading:

> Letter: Appeals Adapted to Audience

Instructional paragraph shown:

> Below each prompt you'll see what you saved in Module 2 for that appeal. Use it as evidence while you explain how King shapes Ethos, Pathos, and Logos for the audience or purpose you named earlier.

Grounding reminder shown:

> Keep the text open while you work so you can stay grounded in King's actual words and choose accurate evidence.

Support buttons shown:

- `My Saved Letter Copy`
- `Original Letter Source`

The same Module 2 scaffold behavior appears under each appeal.

Questions asked on this screen:

1. `In the letter, how does King use Ethos when speaking to [letter audience]?`
2. `In the letter, how does King use Pathos when speaking to [letter audience]?`
3. `In the letter, how does King use Logos when speaking to [letter audience]?`

Purpose:

- move from naming the letter audience to explaining how each appeal is shaped for that audience

Data collected:

- `responses[10]` = letter ethos for audience
- `responses[11]` = letter pathos for audience
- `responses[12]` = letter logos for audience

Validation:

- all three textareas must contain non-empty text before the student can continue

### 10. Appeal screen: Letter appeals adapted to purpose

Heading:

> Letter: Appeals Adapted to Purpose

Instructional paragraph shown:

> Below each prompt you'll see what you saved in Module 2 for that appeal. Use it as evidence while you explain how King shapes Ethos, Pathos, and Logos for the audience or purpose you named earlier.

Grounding reminder shown:

> Keep the text open while you work so you can stay grounded in King's actual words and choose accurate evidence.

Support buttons shown:

- `My Saved Letter Copy`
- `Original Letter Source`

The same Module 2 scaffold behavior appears under each appeal.

Questions asked on this screen:

1. `In the letter, how does King use Ethos to support his purpose of [letter purpose]?`
2. `In the letter, how does King use Pathos to support his purpose of [letter purpose]?`
3. `In the letter, how does King use Logos to support his purpose of [letter purpose]?`

Purpose:

- move from naming the letter purpose to explaining how each appeal supports that purpose

Data collected:

- `responses[13]` = letter ethos for purpose
- `responses[14]` = letter pathos for purpose
- `responses[15]` = letter logos for purpose

Validation:

- all three textareas must contain non-empty text before the student can continue

### 11. Thesis screen

Heading:

> Plan and Write Your Thesis

Introductory paragraph shown:

> Your thesis should grow out of thinking you have already done. Use the recap below as a reminder of your ideas about audience, purpose, and rhetorical appeals (Ethos, Pathos, Logos) in each text.

This screen contains two recap cards.

Speech recap card shows:

- `Audience: [responses[0]]`
- `Purpose: [responses[1]]`
- explanatory sentence:

> You also explained how King used rhetorical appeals for this crowd in earlier questions.

Letter recap card shows:

- `Audience: [responses[2]]`
- `Purpose: [responses[3]]`
- explanatory sentence:

> You also described how King shapes his rhetorical appeals for this group of readers.

This screen also shows a similarities/differences guidance box with the following text:

Possible similarities:

- `The audiences you named are similar or overlapping in some way.`
- `The purposes you named feel similar, even if the situations are different.`
- `King uses the same rhetorical appeal (Ethos, Pathos, or Logos) in a similar way in both texts.`

Possible differences:

- `The audiences are very different, so King adjusts his appeals in different ways.`
- `The purposes are different, so King leans on different appeals or different tones.`
- `One text uses more Ethos, while the other uses more Pathos or Logos.`

#### Thesis screen, Step 1: organization choice

Subheading:

> Step 1. Choose how your essay will be organized

Instructional paragraph shown:

> Pick the pattern that matches the opinion you are starting to form. Remember that the word appeals means rhetorical appeals: Ethos (credibility), Pathos (emotion), and Logos (logic and evidence).

Three choices are shown:

1. `Similarities then differences`

   Description shown:

   > Use this if you think the speech and letter share important things in common in audience, purpose, or rhetorical appeals, but also have clear differences that matter.

2. `Differences then similarities`

   Description shown:

   > Use this if you want to start by showing how the texts are different in audience, purpose, or appeals, and then show how they still connect or work toward a similar idea.

3. `Appeals organization`

   Description shown:

   > Use this if you want each body paragraph to focus on one rhetorical appeal at a time. For example, one paragraph for Ethos in both texts, one for Pathos, and one for Logos, always linking back to audience and purpose.

Data collected:

- `structure_choice`

Allowed saved values:

- `similarities-then-differences`
- `differences-then-similarities`
- `appeals-organization`

When a choice is selected, the module shows a `Suggested thesis frame`.

If `similarities-then-differences` is selected, the frame shown is:

> Although both the speech and the letter address [speech audience] and [letter audience] using strong rhetorical appeals, they differ in how they use Ethos, Pathos, and Logos to reach their purposes of [speech purpose] and [letter purpose].

If `differences-then-similarities` is selected, the frame shown is:

> While the speech and the letter aim at different audiences and purposes, King uses similar rhetorical appeals of Ethos, Pathos, and Logos in both texts to argue for justice and equal rights.

If `appeals-organization` is selected, the frame shown is:

> In both the speech and the letter, King adjusts his rhetorical appeals of Ethos, Pathos, and Logos to fit the audience and purpose of each text, which shapes how readers understand his message about justice.

#### Thesis screen, Step 2: full thesis writing

Subheading:

> Step 2. Write your full thesis

Instructional paragraph shown:

> Use the frame above as a helper, but put the thesis in your own words. Make sure you mention both texts, connect to audience and purpose, and refer to rhetorical appeals (Ethos, Pathos, Logos).

Prompt:

- one large textarea for the student's final thesis

Purpose:

- turn the guided audience/purpose and appeal work into a full comparative thesis

Data collected:

- `thesis`

Validation:

- `Submit` stays disabled until both of these are true:
  - `structure_choice` has been selected
  - `thesis` is not blank

### 12. Success page

Route:

- `/modules/3/success`

Heading:

> Module 3 Complete!

Paragraph shown:

> Great work on completing Module 3!

Primary action:

- `Start Module 4 →`

Purpose:

- confirm completion
- advance assignment progress to at least Module 4
- route the student to the next module

## Every Student Prompt and Input, in Order

### Fixed short-answer prompts

1. `Who is Dr. King primarily addressing in the I Have a Dream speech?`
2. `Who is the Letter from Birmingham Jail mainly written for?`
3. `What is King trying to accomplish in the speech?`
4. `What is King trying to accomplish in the letter?`

### Dynamic appeal prompts

5. `In the speech, how does King use Ethos when speaking to [speech audience]?`
6. `In the speech, how does King use Pathos when speaking to [speech audience]?`
7. `In the speech, how does King use Logos when speaking to [speech audience]?`
8. `In the speech, how does King use Ethos to support his purpose of [speech purpose]?`
9. `In the speech, how does King use Pathos to support his purpose of [speech purpose]?`
10. `In the speech, how does King use Logos to support his purpose of [speech purpose]?`
11. `In the letter, how does King use Ethos when speaking to [letter audience]?`
12. `In the letter, how does King use Pathos when speaking to [letter audience]?`
13. `In the letter, how does King use Logos when speaking to [letter audience]?`
14. `In the letter, how does King use Ethos to support his purpose of [letter purpose]?`
15. `In the letter, how does King use Pathos to support his purpose of [letter purpose]?`
16. `In the letter, how does King use Logos to support his purpose of [letter purpose]?`

### Choice and thesis-writing prompts

17. `Step 1. Choose how your essay will be organized`
18. `Step 2. Write your full thesis`

## Every Piece of Data Collected

### Student-authored instructional data

Module 3 stores one row per student in `module3_responses`.

The `responses` array is normalized to 16 slots. The current slot layout is:

1. `responses[0]` = speech audience
2. `responses[1]` = speech purpose
3. `responses[2]` = letter audience
4. `responses[3]` = letter purpose
5. `responses[4]` = speech ethos for audience
6. `responses[5]` = speech pathos for audience
7. `responses[6]` = speech logos for audience
8. `responses[7]` = speech ethos for purpose
9. `responses[8]` = speech pathos for purpose
10. `responses[9]` = speech logos for purpose
11. `responses[10]` = letter ethos for audience
12. `responses[11]` = letter pathos for audience
13. `responses[12]` = letter logos for audience
14. `responses[13]` = letter ethos for purpose
15. `responses[14]` = letter pathos for purpose
16. `responses[15]` = letter logos for purpose

Additional saved fields:

- `structure_choice`
- `thesis`
- `updated_at`
- `user_email`

### System-generated activity data

The module also records activity events through `POST /api/activity/log`.

Events emitted by current Module 3 behavior:

1. `module_started`
   - metadata: `{ module: 3, screen: "module3_main" }`
2. `thesis_step_viewed`
   - metadata: `{ module: 3, screen: "module3_thesis_step" }`
3. `thesis_saved`
   - metadata includes:
     - `module: 3`
     - `structureChoice`
     - `responsesAnswered`
     - `thesisLength`
4. `module_completed`
   - metadata: `{ module: 3, source: "module3_submit" }`

## Previous Module Data Reused Inside Module 3

Module 3 reuses Module 2 data in three distinct ways.

### 1. Module 2 T-chart entries are shown as scaffolds during the appeal screens

Source:

- Supabase table: `tchart_entries`

How the data is used:

- the module loads all of the student's T-chart rows
- rows are organized by `category` (`ethos`, `pathos`, `logos`) and `type` (`speech`, `letter`)
- on each appeal screen, the matching saved row is shown directly beneath the student's prompt

What the student may see from each saved row:

- the quote
- the main explanation from Module 2
- the saved audience-effect note from Module 2
- the saved purpose-connection note from Module 2

How this is parsed:

- Module 2 stored audience and purpose notes inside `tchart_entries.observation`
- `parseModule2Observation()` splits that combined string using:
  - `---AUDIENCE---`
  - `---PURPOSE---`

### 2. Module 2 source URLs determine the "Original Source" buttons

Source:

- `GET /api/module2/sources`
- underlying Supabase table: `module2_sources`

How the data is used:

- the speech original-source button uses `speech_source_url` or `mlk_url`
- the letter original-source button uses `letter_source_url` or `lfbj_url`

Fallback behavior:

- if the letter URL is missing from `module2_sources`, Module 3 scans the loaded T-chart rows and uses the first `tchart_entries.letter_url` that starts with `https://`
- if no saved URL is found, the module falls back to hard-coded public URLs:
  - speech: `https://www.archives.gov/files/press/exhibits/dream-speech.pdf`
  - letter: `https://kinginstitute.stanford.edu/king-papers/documents/letter-birmingham-jail`

### 3. Module 2 saved text-copy pages remain available as reference tools

Buttons in Module 3 open:

- `/texts/speech`
- `/texts/letter`

These pages fetch `GET /api/module2/sources` again and display:

- the student's saved speech full text
- the student's saved letter full text

In practice, this means Module 3 lets students keep using their Module 2 source collection while answering Module 3 prompts.

## Later Modules That Depend on Module 3 Data

### Direct dependency: Module 4

Route:

- `/modules/4`

Direct Supabase read:

- `module3_responses`
  - selected fields: `thesis`, `structure_choice`, `responses`

How Module 4 uses Module 3 data:

1. `thesis`
   - shown in the "Review your big picture from Module 3" screen
   - shown again in the first paragraph scaffold as part of "Your essay plan so far"

2. `structure_choice`
   - converted into a structure label
   - used to decide the expected paragraph roles:
     - similarity
     - difference
     - appeal
   - used to filter or shape paragraph-idea suggestions

3. `responses[0]` through `responses[3]`
   - shown as the saved speech/letter audience and purpose recap
   - inserted into Module 4 paragraph suggestion text

Examples of direct reuse in Module 4:

- speech audience and letter audience appear inside suggested bucket labels
- speech purpose and letter purpose appear inside suggested difference statements
- organization choice changes which scaffold suggestions appear first

### Direct dependency: Module 5

Route:

- `/modules/5`

Direct Supabase read:

- `module3_responses`
  - selected field: `thesis`
  - ordered by `created_at`

How Module 5 uses Module 3 data:

1. it loads the latest Module 3 thesis as `originalThesis`
2. it displays that thesis in a "Thesis you wrote in Module 3" reminder box
3. if the Module 5 outline does not already contain a thesis, Module 5 prefills the thesis field with the Module 3 thesis

### No later direct read after Module 5

In the current implementation:

- Module 4 directly reads `module3_responses`
- Module 5 directly reads `module3_responses`
- Modules 6 and beyond do **not** directly query `module3_responses`

After Module 5, Module 3's influence continues indirectly through later artifacts such as:

- the Module 4 bucket work
- the Module 5 outline thesis

## Supabase Tables and Fields Read

This section names the current reads used by Module 3 itself and its completion flow.

### 1. `module3_responses`

Read from:

- `components/ModuleThreeForm.js`

Query behavior:

- `select("responses, thesis, updated_at, structure_choice")`
- filter: `.eq("user_email", email)`
- `.maybeSingle()`

Fields read:

- `responses`
- `thesis`
- `updated_at`
- `structure_choice`

Filter field:

- `user_email`

Purpose of read:

- repopulate saved Module 3 work when the student revisits the module

### 2. `tchart_entries`

Read from:

- `lib/supabase/helpers/tchartEntries.ts` via `getTChartEntries({ userEmail })`

Query behavior:

- `select("*")`
- filter: `.eq("user_email", userEmail)`

Actual fields consumed by Module 3 after the read:

- `category`
- `type`
- `quote`
- `observation`
- `letter_url`

Filter field:

- `user_email`

Purpose of read:

- populate Module 2 scaffold cards for ethos/pathos/logos
- locate a fallback original letter URL if needed

### 3. `module2_sources`

Read from:

- `app/api/module2/sources/route.js`

Query behavior:

- `select("id, user_email, mlk_url, mlk_text, mlk_site_name, mlk_transcript_year, mlk_citation, lfbj_url, lfbj_text, lfbj_site_name, lfbj_transcript_year, lfbj_citation, created_at, updated_at")`
- filter: `.eq("user_email", email)`
- `.maybeSingle()`

Fields read:

- `id`
- `user_email`
- `mlk_url`
- `mlk_text`
- `mlk_site_name`
- `mlk_transcript_year`
- `mlk_citation`
- `lfbj_url`
- `lfbj_text`
- `lfbj_site_name`
- `lfbj_transcript_year`
- `lfbj_citation`
- `created_at`
- `updated_at`

Purpose of read:

- supply the original-source URLs for Module 3 support buttons
- supply saved full texts for the optional `/texts/speech` and `/texts/letter` pages

### 4. `student_assignments`

Read from:

- `advanceCurrentModuleOnSuccess()` in `lib/supabase/helpers/studentAssignments.ts`

Query behavior:

- `select("*")`
- filters:
  - `.eq("user_email", userEmail)`
  - `.eq("assignment_name", assignmentName)`
- `.maybeSingle()`

Fields consumed by the helper after read:

- `current_module`
- `status`

Filter fields:

- `user_email`
- `assignment_name`

Purpose of read:

- determine whether Module 3 success should advance progress to the next module

## Supabase Tables and Fields Written

### 1. `module3_responses`

Written from:

- autosave in `components/ModuleThreeForm.js`
- final submit in `components/ModuleThreeForm.js`

Write behavior:

- `upsert(..., { onConflict: ["user_email"] })`

Fields written:

- `user_email`
- `responses`
- `thesis`
- `structure_choice`
- `updated_at`

Purpose of write:

- persist all student answers in Module 3

Autosave timing:

- every 20 seconds while the module is loaded and the student is signed in

### 2. `student_activity_log`

Written through:

- `POST /api/activity/log`

Write behavior:

- `insert(...)`

Fields written:

- `user_email`
- `action`
- `module`
- `metadata`

Purpose of write:

- record start, thesis-step view, thesis save, and completion events for Module 3

### 3. `student_assignments`

Written from:

- `advanceCurrentModuleOnSuccess()` called by `/modules/3/success`

Write behavior:

- `upsert(..., { onConflict: "user_email,assignment_name" })`

Fields written:

- `user_email`
- `assignment_name`
- `current_module`
- `status`
- `updated_at`

Current Module 3 completion result:

- if assignment status is `in_progress`, the helper advances `current_module` to at least `4`

## API Routes Used

### `POST /api/activity/log`

Used by:

- `logActivity()` from Module 3 page and form

What it does in the current flow:

- writes activity events to `student_activity_log`

Called for:

- module start
- thesis step viewed
- thesis saved
- module completed

### `GET /api/module2/sources`

Used by:

- Module 3 main form during initial load
- optional `/texts/speech` page
- optional `/texts/letter` page

What it does in the current flow:

- loads the student's saved Module 2 source row
- supplies speech and letter original URLs
- supplies saved full-text copies for optional support pages

## Helpers Used

### Imported helpers used directly by Module 3

1. `logActivity`
   - file: `lib/logActivity.js`
   - purpose: sends activity events to `POST /api/activity/log`

2. `getTChartEntries`
   - file: `lib/supabase/helpers/tchartEntries.ts`
   - purpose: loads the student's Module 2 T-chart rows

3. `parseModule2Observation`
   - file: `lib/parseModule2Observation.js`
   - purpose: splits a Module 2 observation into:
     - main explanation
     - audience effect
     - purpose connection

4. `advanceCurrentModuleOnSuccess`
   - file: `lib/supabase/helpers/studentAssignments.ts`
   - purpose: advances assignment progress after the success page loads

### Route/helper functions used indirectly by Module 3

1. `rowToResponse`
   - file: `app/api/module2/sources/route.js`
   - purpose: maps database column names in `module2_sources` to the response payload used by the front end

2. `getStudentAssignment`
   - file: `lib/supabase/helpers/studentAssignments.ts`
   - purpose: fetches the student's assignment row before progress is advanced

### Internal helper functions inside `ModuleThreeForm`

These are not shared library helpers, but they do control the current instructional behavior.

1. `normalizeResponses`
   - pads/trims the `responses` array to exactly 16 items

2. `buildTchartLookup`
   - creates a lookup by `category-type` so the correct Module 2 scaffold row appears under each prompt

3. `openUrlInNewTab`
   - opens support resources in a new browser tab

4. `AnalysisSourceAccess`
   - renders the support resource card and buttons

5. `TChartScaffoldCard`
   - renders the saved Module 2 quote/explanation card for one appeal/source combination

6. `isPhrase`
   - enforces the six-word guideline for the audience and purpose phrase steps

7. `generateCustomLabels`
   - builds the twelve dynamic appeal questions from the student's earlier audience/purpose answers

8. `canGoNext`
   - controls when `Next` is enabled

9. `handleSubmit`
   - performs the final save, logs completion events, and routes to the success page

## Instructional Paragraphs, Explanations, and Guidance Shown to Students

This section collects the recurring teaching copy in one place.

### Welcome copy

> In Module 2 you collected trustworthy texts and recorded Ethos, Pathos, and Logos with quotes. In this module you will name each text's audience and purpose, explain how King's appeals reach that audience and serve that purpose, and draft a comparative thesis. Your Module 2 notes will appear beside the connection questions so you are not working from memory alone.

### Guided-step copy

Shown on each of the four guided audience/purpose screens:

> Take this one piece at a time. A clear phrase here will anchor the rest of your essay.

Audience tip:

> Tip: Picture who would be in the room or who would open the letter. Then name that group in plain language.

Purpose tip:

> Tip: Think about what King is trying to make this audience understand, believe, feel, or do.

Guided-step grounding reminder:

> Keep the text open while you work so your answer stays grounded in King's actual words.

### Appeal-step copy

Shown on each of the four appeal-analysis screens:

> Below each prompt you'll see what you saved in Module 2 for that appeal. Use it as evidence while you explain how King shapes Ethos, Pathos, and Logos for the audience or purpose you named earlier.

Appeal-step grounding reminder:

> Keep the text open while you work so you can stay grounded in King's actual words and choose accurate evidence.

Conditional no-note message:

> No saved Module 2 note for this appeal yet. You can still answer here, or go back to Module 2 to add a quote and observation.

### Thesis-step copy

Intro:

> Your thesis should grow out of thinking you have already done. Use the recap below as a reminder of your ideas about audience, purpose, and rhetorical appeals (Ethos, Pathos, Logos) in each text.

Speech recap sentence:

> You also explained how King used rhetorical appeals for this crowd in earlier questions.

Letter recap sentence:

> You also described how King shapes his rhetorical appeals for this group of readers.

Organization-step directions:

> Pick the pattern that matches the opinion you are starting to form. Remember that the word appeals means rhetorical appeals: Ethos (credibility), Pathos (emotion), and Logos (logic and evidence).

Full-thesis directions:

> Use the frame above as a helper, but put the thesis in your own words. Make sure you mention both texts, connect to audience and purpose, and refer to rhetorical appeals (Ethos, Pathos, Logos).

### Validation and status text

Too-long phrase warning:

> Keep it short—just a phrase (about six words or fewer).

Saved-status text:

- `Saved [time]`

Anonymous submit alert:

> You must be signed in to save your responses.

Save error alert:

> Something went wrong: [Supabase error message]

### Success-page copy

> Great work on completing Module 3!

## Video and Media Shown

### Embedded media

1. Video on the welcome screen
   - file: `/videos/thesis-intro.mp4`
   - label shown to students: `Thesis statement walkthrough (optional)`

### Reference resources accessible from the module

1. Saved speech copy page
   - route: `/texts/speech`

2. Saved letter copy page
   - route: `/texts/letter`

3. Original speech source URL
   - loaded from Module 2 source data if available
   - fallback:
     - `https://www.archives.gov/files/press/exhibits/dream-speech.pdf`

4. Original letter source URL
   - loaded from Module 2 source data if available
   - fallback from `tchart_entries.letter_url` if available
   - final fallback:
     - `https://kinginstitute.stanford.edu/king-papers/documents/letter-birmingham-jail`

## Submission and Progress Behavior

### Autosave

- runs every 20 seconds after data is loaded
- only runs when a signed-in user's email exists
- writes the full current `responses`, `thesis`, `structure_choice`, and `updated_at`

### Final submit

On `Submit`, the module:

1. upserts the final `module3_responses` row
2. logs `thesis_saved`
3. logs `module_completed`
4. routes to `/modules/3/success`

### Success-page progress update

When `/modules/3/success` loads, it calls `advanceCurrentModuleOnSuccess()` with:

- `completedModuleNumber: 3`

That helper then advances `student_assignments.current_module` to at least `4`, as long as the assignment row exists and its `status` is `in_progress`.

## Flow Diagram

```mermaid
flowchart TD
  A[Module 2 success page] --> B[/modules/3 loads]
  B --> C[Welcome screen]
  C --> D[Speech audience]
  D --> E[Letter audience]
  E --> F[Speech purpose]
  F --> G[Letter purpose]
  G --> H[Generate dynamic appeal prompts]
  H --> I[Speech appeals to audience]
  I --> J[Speech appeals to purpose]
  J --> K[Letter appeals to audience]
  K --> L[Letter appeals to purpose]
  L --> M[Thesis screen<br/>choose structure + write thesis]
  M --> N[Submit]
  N --> O[/modules/3/success]
  O --> P[Advance progress to Module 4]
  P --> Q[Start Module 4]

  D -. optional support links .-> R[/texts/speech]
  E -. optional support links .-> S[/texts/letter]
  F -. optional support links .-> R
  G -. optional support links .-> S
  I -. optional support links .-> R
  J -. optional support links .-> R
  K -. optional support links .-> S
  L -. optional support links .-> S
```

## Concise Design Summary

In its current implementation, Module 3 is a ten-step thesis-building wizard plus a success page. It begins with a welcome/video screen, collects four short audience-and-purpose phrases, turns those phrases into twelve dynamic appeal-analysis prompts, then asks the student to choose an organizational pattern and write a full comparative thesis. Throughout the work screens, it reuses Module 2 T-chart notes and Module 2 source links so the student can stay grounded in previously saved evidence while building the thesis that later Modules 4 and 5 directly consume.
