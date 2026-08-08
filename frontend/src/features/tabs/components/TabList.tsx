import type { TabWithRefills } from '../types';
import { TabCard } from './TabCard';

interface Props {
  tabs: TabWithRefills[];
  onTabUpdated: (updated: TabWithRefills) => void;
}

export function TabList({ tabs, onTabUpdated }: Props) {
  if (tabs.length === 0) {
    return (
      <div className="border border-dashed border-outline-variant px-5 py-6 text-center">
        <p className="text-xs text-outline">
          Nenhum check-in realizado neste jogo ainda.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tabs.map((tab) => (
        <TabCard
          key={tab.id}
          tab={tab}
          onUpdated={onTabUpdated}
        />
      ))}
    </div>
  );
}
