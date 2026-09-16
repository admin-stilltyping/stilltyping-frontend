import type { AgentHealth as AgentHealthData } from '@/types/analytics'
import { formatNumber, formatPercent } from '@/utils/formatters'

function Ring({ ratio }: { ratio: number }) {
  const r = 34
  const c = 2 * Math.PI * r
  return (
    <div className="relative h-24 w-24 shrink-0">
      <svg viewBox="0 0 80 80" className="h-24 w-24 -rotate-90">
        <circle cx={40} cy={40} r={r} fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth={7} />
        <circle
          cx={40}
          cy={40}
          r={r}
          fill="none"
          stroke="#7c3aed"
          strokeWidth={7}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - ratio)}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-semibold text-dash-ink" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {formatPercent(ratio)}
        </span>
      </div>
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-wider text-dash-ink3">{label}</p>
      <p className="text-sm font-semibold" style={{ color: tone ?? '#111827', fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </p>
    </div>
  )
}

export function AgentHealth({ agent }: { agent: AgentHealthData }) {
  const errTone = agent.errorRate > 0.03 ? '#9a3412' : undefined
  return (
    <div>
      <div className="flex items-center gap-4">
        <Ring ratio={agent.automationRate} />
        <div>
          <p className="text-sm text-dash-ink2">Handled by the agent</p>
          <p className="mt-0.5 text-xs text-dash-ink3">
            No human needed on {formatPercent(agent.automationRate)} of chats
          </p>
          <span className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-dash-line bg-dash-surface2/60 px-2 py-0.5 font-mono text-[10px] text-dash-ink2">
            <span className="h-1.5 w-1.5 rounded-full bg-dash-cyan" />
            {agent.model}
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-x-4 gap-y-3 border-t border-dash-line pt-4">
        <Stat
          label="Est. cost"
          value={agent.estimatedCostUsd === 0 ? '$0 · free' : `$${agent.estimatedCostUsd.toFixed(2)}`}
        />
        <Stat label="Avg latency" value={`${(agent.avgLatencyMs / 1000).toFixed(1)}s`} />
        <Stat label="Cache hit" value={formatPercent(agent.cacheHitRate)} />
        <Stat label="Errors" value={formatPercent(agent.errorRate, 1)} tone={errTone} />
        <Stat label="Tools / turn" value={agent.toolCallsPerTurn.toFixed(1)} />
        <Stat label="Runs" value={formatNumber(agent.runs)} />
      </div>
    </div>
  )
}
