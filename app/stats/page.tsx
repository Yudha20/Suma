import { ConsoleShell } from '@/components/ConsoleShell';
import { ConsoleCard } from '@/components/ConsoleCard';

export default function StatsPage() {
  return (
    <ConsoleShell>
      <ConsoleCard>
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">Stats</h2>
          <p className="text-sm text-slate-400">Stats will appear here once sessions are completed.</p>
        </div>
      </ConsoleCard>
    </ConsoleShell>
  );
}
