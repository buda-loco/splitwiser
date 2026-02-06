'use client';

import { SettlementHistory } from '@/components/SettlementHistory';

export default function SettlementsPage() {
  return (
    <div className="pb-safe">
      <h1 className="text-2xl font-semibold p-4">Settlements</h1>
      <SettlementHistory />
    </div>
  );
}
