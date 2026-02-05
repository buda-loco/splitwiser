'use client';

import { use } from 'react';
import { ExpenseDetail } from '@/components/ExpenseDetail';

export default function ExpenseDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <ExpenseDetail id={id} />;
}
