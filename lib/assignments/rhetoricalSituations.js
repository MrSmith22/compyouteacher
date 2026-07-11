/**
 * Structured rhetorical-situation context for the MLK assignment.
 *
 * Stable historical facts live here (per-assignment, derived at render time) —
 * never copied into student evidence records. Kept as plain JS so pure helpers
 * and node tests can consume it directly; lib/assignments/index.ts attaches it
 * to the typed assignment definition.
 *
 * Facts are grounded in the authoritative sources listed on each entry.
 * Purpose lists and "why form matters" lines are instructional tendencies for
 * students to test against the text — not rules.
 */

export const MLK_RHETORICAL_SITUATIONS = {
  speech: {
    date: "August 28, 1963",
    occasion:
      "The March on Washington for Jobs and Freedom at the Lincoln Memorial in Washington, D.C.",
    form: "Public speech",
    immediateAudience:
      "More than 250,000 marchers who gathered to demand jobs, freedom, civil rights, and racial justice.",
    broaderAudience:
      "People across the nation who watched or listened through television, radio, and news coverage.",
    audienceSituation:
      "Many marchers already supported the civil-rights movement. King was speaking to people who needed hope, unity, direction, and a powerful call for the nation to act.",
    purposes: [
      "Inspire hope and unite supporters.",
      "Create urgency about racial injustice.",
      "Push the nation and its government toward action.",
      "Call America to live up to its stated ideals of freedom and equality.",
    ],
    historicalContext:
      "In August 1963, more than 250,000 people joined the March on Washington for Jobs and Freedom. The march was a massive public demonstration demanding jobs, freedom, civil rights, and federal action. King delivered this speech to the crowd at the Lincoln Memorial while the nation watched.",
    whyFormMatters:
      "A speech to a huge public crowd is heard out loud and in the moment. Rhythm, repetition, memorable images, and shared emotion can help unite and move listeners.",
    /**
     * Compact quotation-card cue derived from form, occasion, audiences, and purposes.
     * Presentation only — not a second historical source of truth.
     */
    compactCue: {
      form: "Public speech at the March on Washington",
      audience: "Marchers and a broader national audience",
      purpose: "Inspire, unite, create urgency, and call the nation to act",
    },
    saveStageCallout:
      "You’re about to save a speech King delivered out loud to more than 250,000 people at the March on Washington—with a much larger national audience watching and listening.",
    authoritativeSources: [
      {
        name: "National Archives — Official Program for the March on Washington",
        url: "https://www.archives.gov/milestone-documents/official-program-for-the-march-on-washington",
      },
      {
        name: "National Archives — The March on Washington for Jobs and Freedom",
        url: "https://www.archives.gov/legislative/features/march-on-washington",
      },
      {
        name: "Library of Congress — Civil Rights Era / “I Have a Dream”",
        url: "https://loc.gov/exhibits/civil-rights-act/civil-rights-era.html",
      },
    ],
  },
  letter: {
    date: "April 16, 1963",
    occasion:
      "Written from a jail cell during the Birmingham Campaign after King was arrested for participating in nonviolent demonstrations.",
    form: "Written letter and public argument in reply to criticism",
    immediateAudience:
      "Eight white Alabama clergymen who criticized the Birmingham demonstrations as “unwise and untimely.”",
    broaderAudience:
      "White moderates, religious readers, and other people who questioned the campaign’s methods, timing, or urgency — readers King could expect the published letter to reach.",
    audienceSituation:
      "The clergymen questioned whether the demonstrations were wise or well-timed. King was addressing readers who might value order and patience but did not yet accept why direct action could not wait.",
    purposes: [
      "Defend nonviolent direct action.",
      "Answer criticism of the Birmingham demonstrations.",
      "Explain why waiting allows injustice to continue.",
      "Challenge moderate readers to recognize the urgency of civil rights.",
    ],
    historicalContext:
      "In April 1963, King was arrested during the Birmingham Campaign of nonviolent demonstrations against segregation. Eight white Alabama clergymen published a statement calling the demonstrations “unwise and untimely.” King answered them from his jail cell with this letter.",
    whyFormMatters:
      "A written reply can answer criticism carefully and point by point. Readers can return to its reasoning, examples, and explanations.",
    /**
     * Compact quotation-card cue derived from form, occasion, audiences, and purposes.
     * Presentation only — not a second historical source of truth.
     */
    compactCue: {
      form: "Written reply from Birmingham Jail",
      audience: "Clergymen and other doubtful readers",
      purpose: "Defend direct action, answer criticism, and explain why justice cannot wait",
    },
    saveStageCallout:
      "You’re about to save a letter King wrote from a Birmingham jail cell, answering clergymen who criticized the demonstrations as “unwise and untimely.”",
    authoritativeSources: [
      {
        name: "Martin Luther King, Jr. Research and Education Institute — Letter from Birmingham Jail",
        url: "https://kinginstitute.stanford.edu/letter-birmingham-jail",
      },
      {
        name: "Martin Luther King, Jr. Research and Education Institute — Birmingham Campaign",
        url: "https://kinginstitute.stanford.edu/birmingham-campaign",
      },
    ],
  },
};

export const MLK_SITUATION_COMPARISON = {
  shared: [
    "Both works pursue civil rights and racial justice.",
    "Both create moral urgency.",
    "Both call on American, religious, or moral ideals.",
    "Both try to persuade people that change is necessary.",
  ],
  different: [
    "The speech addresses marchers and a broad national audience; the letter directly answers critics and doubtful readers.",
    "The speech is a public performance; the letter is a written reply.",
    "The speech often inspires, unites, and mobilizes; the letter often explains, defends, rebuts, and challenges delay.",
    "King can use similar appeals differently because each audience and situation creates different needs.",
  ],
  caveat:
    "These are tendencies to test against the text—not rules that decide every passage in advance.",
};
