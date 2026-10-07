/**
 * @typedef {Object} StagePalette
 * @property {[string, string]} bgGradient
 * @property {string} gridColor
 * @property {string} horizonColor
 * @property {string} skylineOrStructureColor
 * @property {string} accentGlow
 * @property {string} floorLineColor
 * @property {string} particleColor
 * @property {string} structureFill
 * @property {string} [hazardBarColor]
 * @property {'NEON_SKYLINE'|'CAD_BLUEPRINT'} [buildingStyle]
 * @property {string} [buildingFill]
 * @property {string} [buildingStroke]
 * @typedef {{roundName: string, subtitle: string, darkSector: string, lightSector: string, dark: StagePalette, light: StagePalette}} RoundStageConfig
 */

// Scenery is immutable data and never consumes the combat random source.
const palette = config => Object.freeze({ ...config, bgGradient: Object.freeze(config.bgGradient) });
/** @type {Readonly<Record<number, RoundStageConfig>>} */
export const ARENA_ROUND_MAP = Object.freeze({
  1: Object.freeze({
    roundName: 'NEON CITADEL', subtitle: 'STAGE 01 // METROPOLIS VECTOR',
    darkSector: 'NEON CITADEL // GRID SECTOR 01', lightSector: 'BLUEPRINT METROPOLIS // ARCHITECTURAL SECTOR 01',
    dark: palette({ bgGradient: ['#020617', '#0d1b2a'], gridColor: 'rgba(6, 182, 212, 0.35)', horizonColor: 'rgba(6, 182, 212, 0.25)', buildingStyle: 'NEON_SKYLINE', buildingFill: '#0b1329', buildingStroke: 'rgba(6, 182, 212, 0.5)', skylineOrStructureColor: '#155e75', accentGlow: '#06b6d4', floorLineColor: '#0891b2', particleColor: 'rgba(56, 189, 248, 0.6)', structureFill: '#0b1329' }),
    light: palette({ bgGradient: ['#f8fafc', '#e2e8f0'], gridColor: 'rgba(51, 65, 85, 0.2)', horizonColor: 'rgba(100, 116, 139, 0.15)', buildingStyle: 'CAD_BLUEPRINT', buildingFill: '#cbd5e1', buildingStroke: '#475569', skylineOrStructureColor: '#334155', accentGlow: '#0284c7', floorLineColor: '#1e293b', particleColor: 'rgba(71, 85, 105, 0.4)', structureFill: '#cbd5e1' }),
  }),
  2: Object.freeze({
    roundName: 'NEURAL SYNAPSE MATRIX', subtitle: 'STAGE 02 // VOLATILE ESCALATION',
    darkSector: 'PLASMA WEB', lightSector: 'CLINICAL CLEANROOM',
    dark: palette({ bgGradient: ['#0a0518', '#1e0a38'], gridColor: 'rgba(217, 70, 239, 0.4)', horizonColor: '#2e1065', skylineOrStructureColor: '#a855f7', accentGlow: '#e879f9', floorLineColor: '#d946ef', particleColor: '#f5d0fe', structureFill: '#291044' }),
    light: palette({ bgGradient: ['#fdfbf7', '#f3e8ff'], gridColor: 'rgba(217, 119, 6, 0.25)', horizonColor: '#f3e8ff', skylineOrStructureColor: '#a16207', accentGlow: '#d97706', floorLineColor: '#b45309', particleColor: '#c2410c', structureFill: '#ffedd5' }),
  }),
  3: Object.freeze({
    roundName: 'SINGULARITY COURT', subtitle: 'FINAL STAGE // EVENT HORIZON',
    darkSector: 'EVENT HORIZON', lightSector: 'SOLAR FLARE SECTOR',
    dark: palette({ bgGradient: ['#120207', '#2a0410'], gridColor: 'rgba(249, 115, 22, 0.4)', horizonColor: '#450a1c', skylineOrStructureColor: '#fb7185', accentGlow: '#ef4444', floorLineColor: '#fb923c', particleColor: '#ff4d6d', structureFill: '#2a0410', hazardBarColor: '#fbbf24' }),
    light: palette({ bgGradient: ['#fff7ed', '#fed7aa'], gridColor: 'rgba(225, 29, 72, 0.3)', horizonColor: '#fed7aa', skylineOrStructureColor: '#9f1239', accentGlow: '#c2410c', floorLineColor: '#c2410c', particleColor: '#e11d48', structureFill: '#ffedd5', hazardBarColor: '#facc15' }),
  }),
});

// Defensive clamping also covers bad external values without permitting fractional map keys.
export const safeRound = round => Math.min(3, Math.max(1, Number.isFinite(round) ? Math.trunc(round) : 1));
export const stageForRound = round => ARENA_ROUND_MAP[safeRound(round)];
export const getActiveRoundStage = (round, isDark) => {
  const stage = stageForRound(round);
  return isDark ? stage.dark : stage.light;
};
