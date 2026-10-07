import { alternateOutcome, dossierSummary, dossierText } from './archive-engine.js';
import { getContext } from './contexts.js';

const $ = id => document.getElementById(id);
const n = value => Number(value).toFixed(2);
const timestamp = value => new Date(value).toISOString().replace('T', ' ').replace('Z', ' UTC');
const node = (tag, cls, text) => {
  const el = document.createElement(tag); if (cls) el.className = cls;
  if (text !== undefined) el.textContent = text; return el;
};
function metric(label, value) {
  const cell = node('div', 'archive-metric'); cell.append(node('span', '', label), node('strong', '', value)); return cell;
}
function stage(index, title, complete) {
  const section = node('section', 'dossier-stage');
  const heading = node('div', 'dossier-stage-heading'); heading.append(node('h3', '', 'STAGE ' + index + ' // ' + title), node('span', 'archive-badge', complete ? 'EVIDENCE SEALED' : 'STAGE BYPASSED'));
  section.append(heading); return section;
}

/** Read-only historical UI. No archived choices are ever written into the live pipeline. */
export class ArchiveView {
  constructor(store, onMatrix) {
    this.store = store; this.openCaseId = null; this.exportUrl = null;
    $('archive-go-matrix').addEventListener('click', onMatrix);
    $('archive-purge').addEventListener('click', () => {
      $('archive-purge-count').textContent = this.store.records.length + ' case file(s) will be removed from this browser. Live modules will keep their current state.';
      $('archive-purge-dialog').showModal(); $('archive-purge-cancel').focus();
    });
    $('archive-purge-confirm').addEventListener('click', () => { this.store.purge(); $('archive-purge-dialog').close(); });
    $('archive-purge-dialog').addEventListener('close', () => $('archive-purge').focus());
    $('archive-dossier-dialog').addEventListener('close', () => {
      this.openCaseId = null; this.releaseExport();
      (this.returnFocus?.isConnected ? this.returnFocus : $('archive-purge')).focus({ preventScroll: true });
    });
    $('archive-print').addEventListener('click', () => window.print());
    $('archive-export').addEventListener('click', () => { $('archive-export-status').textContent = 'EXPORT REQUESTED // ' + $('archive-export').download; });
    this.unsubscribe = store.subscribe(() => this.render());
  }
  render() {
    const records = this.store.records, full = records.filter(record => dossierSummary(record).status === 'FULL DOSSIER').length;
    $('archive-count').textContent = String(records.length).padStart(2, '0');
    $('archive-full-count').textContent = String(full).padStart(2, '0');
    $('archive-partial-count').textContent = String(records.length - full).padStart(2, '0');
    $('archive-storage').textContent = this.store.persistent ? 'LOCAL LOG ONLINE' : 'SESSION MEMORY ONLY';
    $('archive-storage-note').textContent = this.store.notice;
    $('archive-storage-note').hidden = !this.store.notice;
    $('archive-purge').disabled = !records.length;
    $('archive-empty').hidden = Boolean(records.length);
    $('archive-table-wrap').hidden = !records.length;
    const feed = $('archive-feed'); feed.replaceChildren();
    for (const record of records) {
      const summary = dossierSummary(record), row = node('tr'); row.dataset.caseId = record.id;
      const file = node('th'); file.scope = 'row'; file.append(node('strong', 'archive-case-id', record.id), node('small', '', timestamp(record.createdAt)));
      const choices = node('td'); choices.append(node('span', 'archive-option-a', record.matrix.a), node('small', 'archive-versus', 'VS'), node('span', 'archive-option-b', record.matrix.b));
      const winner = node('td'); winner.append(node('span', 'archive-winner', summary.winner), node('small', '', summary.source));
      const status = node('td'); const badge = node('span', 'archive-badge', summary.status); badge.dataset.full = String(summary.status === 'FULL DOSSIER');
      status.append(badge, node('small', '', summary.stages + '/3 stages sealed · ' + record.trials.length + ' trial(s)'));
      const action = node('td'), button = node('button', 'archive-button', 'EXAMINE DOSSIER'); button.type = 'button';
      button.setAttribute('aria-label', 'Examine dossier ' + record.id);
      button.addEventListener('click', () => this.openDossier(record.id, button)); action.append(button);
      row.append(file, choices, winner, status, action); feed.append(row);
    }
    if (this.openCaseId) {
      const record = this.store.get(this.openCaseId);
      if (!record) $('archive-dossier-dialog').close();
      else {
        const loser = dossierSummary(record).loser;
        if (loser !== this.alternateLoser) { this.alternateLoser = loser; this.alternate = alternateOutcome(loser); }
        this.renderDossier(record);
      }
    }
  }
  openDossier(id, trigger = $('module-archives')) {
    const record = this.store.get(id); if (!record) return;
    this.openCaseId = id; this.returnFocus = trigger;
    this.alternateLoser = dossierSummary(record).loser; this.alternate = alternateOutcome(this.alternateLoser);
    this.renderDossier(record); $('archive-dossier-dialog').showModal();
    $('archive-dossier-dialog').scrollTop = 0; $('archive-close').focus({ preventScroll: true });
  }
  renderDossier(record) {
    const m = record.matrix, summary = dossierSummary(record), report = $('archive-report'); report.replaceChildren();
    const title = node('h2', 'archive-report-title', 'Unified post-mortem dossier'); title.id = 'archive-dossier-title';
    report.append(node('p', 'archive-kicker', 'ODDM // FORENSIC RECORD // ' + record.id), title);
    const meta = node('div', 'archive-report-meta'); meta.append(node('span', '', timestamp(record.createdAt)), node('span', 'archive-badge', summary.status + ' · ' + summary.stages + '/3 STAGES')); report.append(meta);
    const verdict = node('section', 'archive-verdict');
    verdict.append(node('span', 'archive-kicker', 'FINAL DECLARED WINNER // ' + summary.source), node('h3', '', summary.winner));
    const metrics = node('div', 'archive-metrics'); metrics.append(metric('POST-DECISION REGRET INDEX', n(m.regret) + '%'), metric('MATRIX RECOMMENDATION', m.winner)); verdict.append(metrics);
    verdict.append(node('p', 'archive-caption', 'Regret is the original Matrix estimate. The arena champion and the Matrix recommendation are recorded independently.'));
    report.append(verdict);
    const matrix = stage('01', 'QUANTUM MATRIX', true), grid = node('div', 'archive-metrics');
    grid.append(metric('OPTION A', m.a), metric('OPTION B', m.b), metric('WIN PROBABILITY A / B', n(m.probabilityA) + '% / ' + n(m.probabilityB) + '%'),
      metric('MEAN UTILITY A / B', n(m.utilityA.mean) + ' / ' + n(m.utilityB.mean)), metric('MEDIAN A / B', n(m.utilityA.median) + ' / ' + n(m.utilityB.median)),
      metric('STD. DEVIATION A / B', n(m.utilityA.sd) + ' / ' + n(m.utilityB.sd)), metric('TAIL RISK A / B', n(m.utilityA.tail) + '% / ' + n(m.utilityB.tail) + '%'),
      metric('INITIAL COMPLEXITY', m.complexity), metric('CONTEXT', getContext(m.context).title), metric('SCENARIOS', Number(m.samples).toLocaleString()));
    matrix.append(grid); report.append(matrix);
    const combat = stage('02', 'OPTION FIGHTER', Boolean(summary.combat));
    if (!summary.combat) combat.append(node('p', 'archive-bypass', '[ STAGE BYPASSED // COMBAT SKIPPED ]'), node('p', 'archive-caption', 'The plasma blades remained politely sheathed. No completed three-round tournament was linked to this run.'));
    else {
      const c = summary.combat, cg = node('div', 'archive-metrics');
      cg.append(metric('ARENA CHAMPION', c.name), metric('SERIES SCORE', c.wins.join('–')), metric('COMBAT DURATION', n(c.duration) + 's'),
        metric('TOTAL DAMAGE A / B', c.damage.map(n).join(' / ')), metric('FINAL RESOLUTION', c.reason.toUpperCase()), metric('CHAMPION LAST WIN HP', n(c.health) + '%'),
        metric('FINAL ROUND HP A / B', (c.finalHP || []).map(n).join(' / ')), metric('MAX COMBO / VOLATILITY', c.maxCombo + ' hits / ' + n(c.volatility) + '%'));
      combat.append(cg); const rounds = node('ol', 'archive-rounds');
      for (const r of c.history) rounds.append(node('li', '', 'ROUND ' + r.round + ' // ' + r.name + ' · ' + n(r.duration) + 's · ' + n(r.health) + '% HP · ' + r.reason.toUpperCase()));
      combat.append(rounds, node('p', 'archive-caption', record.combats.length + ' tournament(s) retained. Latest complete series shown. Champion last-win HP may differ from final-round HP.'));
    }
    report.append(combat);
    const court = stage('03', 'QUANTUM TRIBUNAL', Boolean(summary.trial));
    if (!summary.trial) court.append(node('p', 'archive-bypass', '[ STAGE BYPASSED // COURT DOCKET UNCALLED ]'), node('p', 'archive-caption', 'The jury has not been inconvenienced. No completed judicial decree was linked to this run.'));
    else {
      const t = summary.trial;
      court.append(node('p', 'archive-kicker', t.caseId + ' // ' + timestamp(t.issuedAt)), node('h4', '', t.classificationName), node('p', 'archive-prose', t.decision));
      const cg = node('div', 'archive-metrics'); cg.append(metric('JURY VERDICT', t.verdict), metric('FINAL PUBLIC OUTRAGE', t.outrage + '% · ' + t.tier)); court.append(cg);
      court.append(node('p', 'archive-sentence', t.sentence));
      const testimony = node('ol', 'archive-testimony');
      for (const a of t.answers) {
        const item = node('li'); item.append(node('strong', '', a.questionText), node('p', '', 'HUMAN: ' + a.human_text), node('p', '', 'V.O.I.D.: ' + a.void_response), node('p', '', 'B.O.T.: ' + a.bot_response)); testimony.append(item);
      }
      court.append(testimony, node('p', 'archive-caption', record.trials.length + ' completed trial(s) retained. Latest decree shown. Jury outrage is independent of Matrix regret.'));
    }
    report.append(court);
    const alternate = node('section', 'archive-alternate'); alternate.append(node('h3', '', 'MULTIVERSE SIMULATION // ALTERNATE TIMELINE CONSEQUESTS'), node('span', 'archive-kicker', 'TIMELINE B // ' + summary.loser), node('p', '', this.alternate)); report.append(alternate);
    report.append(node('p', 'archive-caption', 'FICTIONAL FORENSICS // Simulated utility. Arcade violence. Scripted judicial satire. Approved by the Department of Excessive Documentation.'));
    this.releaseExport();
    this.exportUrl = URL.createObjectURL(new Blob([dossierText(record, this.alternate)], { type: 'text/plain;charset=utf-8' }));
    $('archive-export').href = this.exportUrl; $('archive-export').download = record.id + '-post-mortem.txt'; $('archive-export-status').textContent = '';
  }
  releaseExport() { if (this.exportUrl) URL.revokeObjectURL(this.exportUrl); this.exportUrl = null; $('archive-export').removeAttribute('href'); }
  destroy() { this.unsubscribe?.(); this.releaseExport(); }
}
