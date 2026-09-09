/**
 * Migration: point stored attachment URLs back at a host that serves them.
 *
 * Uploads were once stamped with an absolute `https://cyberkhana.tech/api/...`
 * URL. That was right when the apex ran the platform; it stopped being right
 * when the marketing site took the domain and only app.cyberkhana.tech kept the
 * API. Every row written before that split names a host whose nginx has no
 * `/api`, so every one of those attachments 404s.
 *
 * The app already repairs these when rendering, so nothing is broken while this
 * goes unrun — this is here to get the dead hostname out of the database rather
 * than carrying it forever.
 *
 * Dry run (default, writes nothing):
 *   npm run fix-upload-urls
 * Apply:
 *   npm run fix-upload-urls -- --apply
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

/** Only hosts that have actually served this platform's uploads. A challenge
 *  linking to someone else's `/api/uploads/` path must be left alone. */
const OUR_HOSTS = new Set(['cyberkhana.tech', 'www.cyberkhana.tech', 'app.cyberkhana.tech']);

const toRelative = (value: unknown): string | null => {
  if (typeof value !== 'string' || !value.trim()) return null;
  const trimmed = value.trim();
  if (trimmed.startsWith('/')) return null; // already relative
  try {
    const url = new URL(trimmed);
    if (!OUR_HOSTS.has(url.hostname)) return null;
    if (!url.pathname.startsWith('/api/uploads/')) return null;
    return `${url.pathname}${url.search}`;
  } catch {
    return null;
  }
};

const run = async () => {
  const apply = process.argv.includes('--apply');
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set.');
    process.exit(1);
  }

  await mongoose.connect(uri);
  const db = mongoose.connection.db!;
  console.log(`\nConnected to ${mongoose.connection.name}`);
  console.log(apply ? 'Mode: APPLY (writing changes)\n' : 'Mode: DRY RUN (no writes — pass --apply to commit)\n');

  let scanned = 0;
  let rewritten = 0;

  /** Walks a document, rewriting every `url` it can, and reports what changed. */
  const rewriteDoc = (doc: any): { changed: boolean; notes: string[] } => {
    const notes: string[] = [];
    let changed = false;

    const visitFileList = (list: any[] | undefined, label: string) => {
      if (!Array.isArray(list)) return;
      for (const file of list) {
        const next = toRelative(file?.url);
        if (next) {
          notes.push(`    ${label}: ${file.url}  ->  ${next}`);
          file.url = next;
          changed = true;
        }
      }
    };

    visitFileList(doc.files, 'files');
    visitFileList(doc?.writeup?.images, 'writeup.images');

    const pdf = toRelative(doc?.writeup?.pdfFile?.url);
    if (pdf) {
      notes.push(`    writeup.pdfFile: ${doc.writeup.pdfFile.url}  ->  ${pdf}`);
      doc.writeup.pdfFile.url = pdf;
      changed = true;
    }

    return { changed, notes };
  };

  // ── Challenges
  for (const challenge of await db.collection('challenges').find({}).toArray()) {
    scanned++;
    const { changed, notes } = rewriteDoc(challenge);
    if (!changed) continue;
    rewritten++;
    console.log(`  challenge "${challenge.title}"`);
    notes.forEach(n => console.log(n));
    if (apply) {
      await db.collection('challenges').updateOne(
        { _id: challenge._id },
        { $set: { files: challenge.files, writeup: challenge.writeup } }
      );
    }
  }

  // ── Competition challenges (embedded copies, with their own file lists)
  for (const competition of await db.collection('competitions').find({}).toArray()) {
    scanned++;
    let changed = false;
    for (const challenge of competition.challenges || []) {
      const r = rewriteDoc(challenge);
      if (r.changed) {
        changed = true;
        console.log(`  competition "${competition.name}" / "${challenge.title}"`);
        r.notes.forEach(n => console.log(n));
      }
    }
    if (changed) {
      rewritten++;
      if (apply) {
        await db.collection('competitions').updateOne(
          { _id: competition._id },
          { $set: { challenges: competition.challenges } }
        );
      }
    }
  }

  console.log(`\nScanned ${scanned} documents, ${rewritten} needed rewriting.`);
  if (!apply && rewritten > 0) console.log('Nothing was written. Re-run with --apply to commit.');
  await mongoose.disconnect();
};

run().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
