/**
 * WP-101 — Cleanup ledger for reversible beta acceptance mutations.
 */

/**
 * @typedef {{
 *   id: string,
 *   scenarioId: string,
 *   kind: string,
 *   description: string,
 *   restore: () => Promise<void>|void,
 *   restored?: boolean,
 * }} CleanupEntry
 */

export class BetaCleanupLedger {
  constructor() {
    /** @type {CleanupEntry[]} */
    this.entries = [];
  }

  /**
   * @param {Omit<CleanupEntry, "restored">} entry
   */
  register(entry) {
    this.entries.push({ ...entry, restored: false });
  }

  /**
   * Restore in reverse registration order.
   * @returns {Promise<{ ok: boolean, restored: number, errors: string[] }>}
   */
  async restoreAll() {
    /** @type {string[]} */
    const errors = [];
    let restored = 0;
    for (let i = this.entries.length - 1; i >= 0; i -= 1) {
      const e = this.entries[i];
      if (e.restored) continue;
      try {
        await e.restore();
        e.restored = true;
        restored += 1;
      } catch (err) {
        errors.push(
          `${e.id}: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }
    return { ok: errors.length === 0, restored, errors };
  }

  /**
   * @param {string} scenarioId
   */
  allConfirmedForScenario(scenarioId) {
    const rows = this.entries.filter((e) => e.scenarioId === scenarioId);
    if (rows.length === 0) return true;
    return rows.every((e) => e.restored === true);
  }

  toJSON() {
    return this.entries.map((e) => ({
      id: e.id,
      scenarioId: e.scenarioId,
      kind: e.kind,
      description: e.description,
      restored: !!e.restored,
    }));
  }
}
