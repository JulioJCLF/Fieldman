import type { TabWithRefills } from '../types';
import { TabCard } from './TabCard';

interface Props {
  tabs: TabWithRefills[];
  onTabUpdated: (updated: TabWithRefills) => void;
}

export function TabList({ tabs, onTabUpdated }: Props) {
  if (tabs.length === 0) {
    return (
      <div className="border border-dashed border-[#384534] px-5 py-6 text-center">
        <p className="font-mono text-xs text-stone-500">
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
