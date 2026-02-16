import { SlaRisk } from '../types';

const chipClass: Record<SlaRisk, string> = {
  SAFE: 'bg-emerald-100 text-emerald-800',
  AT_RISK: 'bg-amber-100 text-amber-800',
  BREACHED: 'bg-rose-100 text-rose-800'
};

export const SlaChip = ({ risk }: { risk: SlaRisk }) => {
  return <span className={`rounded-full px-3 py-1 text-xs font-bold ${chipClass[risk]}`}>{risk}</span>;
};
