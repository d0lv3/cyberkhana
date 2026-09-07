import React from 'react';
import { Globe, Server } from 'lucide-react';
import Input from '../ui/input';
import { ChallengeTarget, TargetKind, targetError } from '../../utils/challengeTarget';

interface Props {
  kind: TargetKind;
  value: ChallengeTarget;
  onKindChange: (kind: TargetKind) => void;
  onChange: (patch: ChallengeTarget) => void;
}

const MODES: Array<{ kind: TargetKind; label: string; icon: React.ElementType; hint: string }> = [
  { kind: 'none', label: 'None', icon: Globe, hint: 'Offline challenge — players work from the attached files alone.' },
  {
    kind: 'link',
    label: 'Link',
    icon: Globe,
    hint: 'A web target. Players get a button that opens it in a new tab.',
  },
  {
    kind: 'address',
    label: 'Host & port',
    icon: Server,
    hint: 'A raw TCP target. Players get the address and an nc command to copy — not a link, because netcat targets are not clickable.',
  },
];

/**
 * Where the challenge lives, as one either/or choice.
 *
 * A single free-text field could not serve both: a URL wants to be a link and
 * `10.0.0.5:1337` wants to be copied into a terminal, and guessing which from
 * the string would get it wrong on exactly the web challenges served over a
 * bare IP. So the author says which, and the player side renders the right
 * affordance instead of inferring one.
 */
const ChallengeTargetFields: React.FC<Props> = ({ kind, value, onKindChange, onChange }) => {
  const error = targetError(kind, value);
  const active = MODES.find((m) => m.kind === kind) ?? MODES[0];

  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900/40 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <label className="font-medium text-zinc-200">Challenge target</label>
        <div className="flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-900 p-0.5">
          {MODES.map(({ kind: k, label }) => (
            <button
              key={k}
              type="button"
              onClick={() => onKindChange(k)}
              aria-pressed={kind === k}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                kind === k
                  ? 'bg-brand/15 text-brand'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {kind === 'link' && (
        <Input
          type="url"
          value={value.challengeLink ?? ''}
          onChange={(e) => onChange({ challengeLink: e.target.value })}
          placeholder="https://challenge.example.edu"
        />
      )}

      {kind === 'address' && (
        /* Host and port are two fields, not one "host:port" box: a port has its
           own type and its own range, and splitting them is what lets the form
           say which half is wrong. They stack below sm, where a side-by-side
           host field lands near 100px and truncates any real hostname. */
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_7rem]">
          <Input
            value={value.challengeHost ?? ''}
            onChange={(e) => onChange({ challengeHost: e.target.value })}
            placeholder="10.0.0.5 or challenge.example.edu"
            aria-label="Host or IP"
          />
          <Input
            type="number"
            min={1}
            max={65535}
            value={value.challengePort ?? ''}
            onChange={(e) => {
              const raw = e.target.value;
              onChange({ challengePort: raw === '' ? undefined : Number(raw) });
            }}
            placeholder="1337"
            aria-label="Port"
          />
        </div>
      )}

      <p className={`mt-2 text-xs ${error ? 'text-red-400' : 'text-zinc-500'}`}>
        {error || active.hint}
      </p>
    </div>
  );
};

export default ChallengeTargetFields;
