import React, { useRef, useState } from 'react';
import { Link2, Paperclip, Plus, Upload, X } from 'lucide-react';
import Input from '../ui/input';
import { fileNameFromUrl, isHttpUrl, isUploadedFileUrl } from '../../utils/url';

/** Matches multer's `files: 10` on the upload route. */
export const MAX_CHALLENGE_FILES = 10;

/**
 * One row in the list. An entry either already has a URL — because it was saved
 * with the challenge, or because the author pasted a link — or it is a local
 * File still waiting to be uploaded on save.
 */
export interface ChallengeFileEntry {
  /** Local only, for React keys and removal; never sent to the server. */
  id: string;
  name: string;
  url?: string;
  file?: File;
}

interface Props {
  value: ChallengeFileEntry[];
  onChange: (entries: ChallengeFileEntry[]) => void;
}

let seq = 0;
export const newEntryId = () => `f${Date.now().toString(36)}${(seq += 1)}`;

/** Existing `{name, url}` files from a saved challenge → editable entries. */
export const entriesFromFiles = (
  files?: Array<{ name: string; url: string }> | null,
): ChallengeFileEntry[] =>
  (files ?? []).map((f) => ({ id: newEntryId(), name: f.name, url: f.url }));

/**
 * Attachments, by upload or by link.
 *
 * Both end up as the same `{ name, url }` pair on the challenge, so the player
 * side needs to know nothing about which is which — a linked file is simply one
 * whose URL points at somebody else's server. The badge exists for the author,
 * because those two have different failure modes: an upload is ours and stays
 * put, a link rots when whoever hosts it moves the file.
 *
 * The list is the whole state, and it is always sent in full. The single input
 * this replaced re-uploaded and *replaced* every attachment whenever the author
 * touched it, and offered no way to remove one at all.
 */
const ChallengeFilesField: React.FC<Props> = ({ value, onChange }) => {
  const [linkUrl, setLinkUrl] = useState('');
  const [linkName, setLinkName] = useState('');
  const [linkError, setLinkError] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  const remaining = MAX_CHALLENGE_FILES - value.length;
  const full = remaining <= 0;

  const addUploads = (list: FileList | null) => {
    if (!list?.length) return;
    const room = Array.from(list).slice(0, Math.max(0, remaining));
    onChange([
      ...value,
      ...room.map((file) => ({ id: newEntryId(), name: file.name, file })),
    ]);
    // Reset the input so picking the same file twice in a row still fires.
    if (fileInput.current) fileInput.current.value = '';
  };

  const addLink = () => {
    const url = linkUrl.trim();
    if (!url) {
      setLinkError('Paste a file URL first');
      return;
    }
    if (!isHttpUrl(url)) {
      setLinkError('Enter a full http:// or https:// address');
      return;
    }
    if (full) {
      setLinkError(`Up to ${MAX_CHALLENGE_FILES} files`);
      return;
    }
    onChange([
      ...value,
      { id: newEntryId(), name: linkName.trim() || fileNameFromUrl(url) || url, url },
    ]);
    setLinkUrl('');
    setLinkName('');
    setLinkError('');
  };

  const remove = (id: string) => onChange(value.filter((e) => e.id !== id));

  const rename = (id: string, name: string) =>
    onChange(value.map((e) => (e.id === id ? { ...e, name } : e)));

  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900/40 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <label className="font-medium text-zinc-200">Attachments</label>
        <span className="text-xs text-zinc-500">
          {value.length}/{MAX_CHALLENGE_FILES}
        </span>
      </div>

      {value.length > 0 && (
        <ul className="mb-3 space-y-2">
          {value.map((entry) => {
            const linked = !!entry.url && !isUploadedFileUrl(entry.url);
            const pending = !!entry.file;
            return (
              <li
                key={entry.id}
                className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 p-2"
              >
                <span
                  className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md ${
                    linked ? 'bg-info/10 text-info' : 'bg-brand/10 text-brand'
                  }`}
                  title={linked ? 'Linked from another server' : 'Hosted by CyberKhana'}
                >
                  {linked ? <Link2 size={14} /> : <Paperclip size={14} />}
                </span>

                <div className="min-w-0 flex-1">
                  <Input
                    value={entry.name}
                    onChange={(e) => rename(entry.id, e.target.value)}
                    aria-label="File name"
                    className="h-8 px-2 py-1 text-sm"
                  />
                  <p className="mt-0.5 truncate text-[11px] text-zinc-500" dir="ltr">
                    {pending ? 'Will upload on save' : entry.url}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => remove(entry.id)}
                  aria-label={`Remove ${entry.name}`}
                  title="Remove"
                  className="flex h-8 w-8 flex-shrink-0 touch:h-11 touch:w-11 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-red-400"
                >
                  <X size={15} />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* The two ways to add one, side by side, because they are alternatives
          rather than steps. */}
      <div className="grid gap-3 lg:grid-cols-[auto_1fr]">
        <div>
          <input
            ref={fileInput}
            id="challenge-file-upload"
            type="file"
            multiple
            disabled={full}
            onChange={(e) => addUploads(e.target.files)}
            className="sr-only"
          />
          <label
            htmlFor="challenge-file-upload"
            className={`inline-flex h-10 items-center gap-2 rounded-lg border border-zinc-600 px-4 text-sm font-semibold transition-colors ${
              full
                ? 'cursor-not-allowed text-zinc-600'
                : 'cursor-pointer text-zinc-200 hover:border-zinc-500 hover:bg-zinc-800'
            }`}
          >
            <Upload size={15} />
            Upload files
          </label>
        </div>

        <div className="grid gap-2 sm:grid-cols-[1fr_10rem_auto]">
          <Input
            value={linkUrl}
            disabled={full}
            onChange={(e) => {
              setLinkUrl(e.target.value);
              if (linkError) setLinkError('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addLink();
              }
            }}
            placeholder="https://…/handout.zip"
            aria-label="File URL"
            className="h-10"
          />
          <Input
            value={linkName}
            disabled={full}
            onChange={(e) => setLinkName(e.target.value)}
            placeholder="Name (optional)"
            aria-label="File name for the link"
            className="h-10"
          />
          <button
            type="button"
            onClick={addLink}
            disabled={full}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-brand/40 bg-brand/10 px-4 text-sm font-semibold text-brand transition-colors hover:bg-brand/15 disabled:opacity-40"
          >
            <Plus size={15} />
            Add link
          </button>
        </div>
      </div>

      <p className={`mt-2 text-xs ${linkError ? 'text-red-400' : 'text-zinc-500'}`}>
        {linkError ||
          (full
            ? `That is the maximum of ${MAX_CHALLENGE_FILES} files.`
            : 'Upload the file, or point at one already hosted elsewhere. Linked files are not stored by CyberKhana, so they break if the host moves them.')}
      </p>
    </div>
  );
};

export default ChallengeFilesField;
