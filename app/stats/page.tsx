import { ConsoleShell } from '@/components/ConsoleShell';
import { ConsoleCard } from '@/components/ConsoleCard';

export default function StatsPage() {
  return (
    <ConsoleShell>
      <ConsoleCard>
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-text">Stats</h2>
          <p className="text-sm text-text-muted">Stats will appear here once sessions are completed.</p>
        </div>
      </ConsoleCard>
    </ConsoleShell>
  );
}
