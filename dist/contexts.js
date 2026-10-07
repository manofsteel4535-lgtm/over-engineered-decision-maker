// Context changes the fictional vocabulary, never an option's chance of winning.
export const CONTEXT_GROUPS = [
  { label: 'Food & Dining', factors: ['Nutritional Entropy', 'Post-Lunch Lethargy', 'Financial Friction', 'Existential Satisfaction'], threats: ['Tongue Burn', 'Carb Coma', 'Sodium Coma', 'Salsa Stain on White Shirt', 'Food Envy', 'Waiter Judgment'], options: [
    ['workplace-lunch', 'Workplace Lunch Matrix'], ['late-night', 'Late Night Craving Emergency'],
    ['food-delivery', 'Food Delivery Partner Showdown'], ['dining-risk', 'Fine Dining vs. Street Food Risk']
  ]},
  { label: 'Tech & Hardware', factors: ['Reliability Entropy', 'Ecosystem Lock-In', 'Financial Friction', 'Upgrade Satisfaction'], threats: ['Dongle Proliferation', 'Driver Update Apocalypse', 'Ecosystem Stockholm Syndrome', 'Benchmark Envy', 'Thermal Throttling', 'RGB-Induced Bankruptcy'], options: [
    ['smartphone', 'Smartphone Ecosystem Pivot'], ['laptop', 'Laptop Brand Hegemony'], ['gpu', 'Desktop GPU Dilemma']
  ]},
  { label: 'Sim Racing & Gaming', factors: ['Force Feedback Entropy', 'Lap-Time Volatility', 'Setup Friction', 'Immersion Satisfaction'], threats: ['Firmware Pit Stop', 'Desk Clamp Catastrophe', 'Lap-Time Ego Collapse', 'Backlog Inflation', 'Compatibility Chicane', 'One More Lap Syndrome'], options: [
    ['wheelbase', 'Direct Drive Wheelbase Clash'], ['game-backlog', 'Game Backlog Priority'], ['gaming-platform', 'Console vs. PC Master Race Paradigm']
  ]},
  { label: 'Fragrance & Personal Style', factors: ['Projection Entropy', 'Social Judgment', 'Financial Friction', 'Signature Satisfaction'], threats: ['Elevator Scent Overload', 'Blind-Buy Remorse', 'Olfactory Fatigue', 'Designer Tax Shock', 'Compliment Drought', 'Wardrobe Identity Crisis'], options: [
    ['daily-scent', 'Daily Scent Signature'], ['apparel', 'High Street Apparel vs. Designer Footwear']
  ]},
  { label: 'Meta / Existential', factors: ['Timeline Entropy', 'Opportunity Cost', 'Commitment Friction', 'Existential Satisfaction'], threats: ['Productivity Theater', 'Calendar Singularity', 'Future-Self Judgment', 'Opportunity Cost Spiral', 'Vacation FOMO', 'Spreadsheet-Induced Ennui'], options: [
    ['productivity', 'Productivity vs. Procrastination'], ['vacation-investment', 'Spontaneous Vacation vs. ETF Investment']
  ]}
];
export function getContext(id) {
  for (const group of CONTEXT_GROUPS) {
    const option = group.options.find(([value]) => value === id);
    if (option) return { ...group, id, title: option[1] };
  }
  throw new RangeError('Unknown decision context.');
}
