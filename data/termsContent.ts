/* ── The Terms of Service, as rendered data ──
 *
 * The authoritative text lives in `legal/TERMS.md` at the repo root. This file
 * is that document typed out for the app to render; when you change one, change
 * the other, and bump the version in both this file and the backend's
 * `config/terms.ts`.
 *
 * Structured rather than a wall of markdown so the acceptance dialog can show
 * the same sections the full page does, and so `KEY_POINTS` can pull out the
 * handful of clauses a student genuinely must see before clicking accept.
 */

/** Must match CURRENT_TERMS_VERSION in backend/src/config/terms.ts exactly. */
export const TERMS_VERSION = '2026-09-07';

export const TERMS_UPDATED = '7 September 2026';

export interface TermsSection {
  /** Section number as shown to the reader, e.g. "6". */
  n: string;
  h: string;
  /** Paragraphs. */
  body?: string[];
  /** Bulleted items rendered after the paragraphs. */
  list?: string[];
  /** Paragraphs rendered after the list. */
  after?: string[];
  /** Renders the section in the warning treatment — used for section 6. */
  emphasis?: boolean;
}

/**
 * The clauses the acceptance dialog puts in front of someone before they can
 * click accept. Deliberately short: a summary nobody scrolls past is worth more
 * than a full text nobody reads, and the full text is one click away.
 */
export const KEY_POINTS: { title: string; text: string }[] = [
  {
    title: 'Only attack what we point you at',
    text: 'You may use these techniques against the target named in a challenge, and the practice lab machines — nothing else. Not your university’s systems, not anything next to a target, not anything you find along the way.',
  },
  {
    title: 'Never pivot out of the lab',
    text: 'The lab machines are deliberately broken. Using one to reach anything outside the lab is prohibited, whether or not it is technically possible.',
  },
  {
    title: 'Do not attack the Platform itself',
    text: 'No scanning or probing CyberKhana, its servers, or other users’ accounts. Found a real flaw? Email support@cyberkhana.tech — reporting it earns credit, using it earns a ban.',
  },
  {
    title: 'Do not share flags',
    text: 'Flags are not to be shared with anyone who has not solved the challenge, and writeups stay unpublished while a challenge is live.',
  },
  {
    title: 'Your full name is public',
    text: 'Your name, university, points and solves appear on the leaderboards where everyone can see them.',
  },
  {
    title: 'We cannot reset your password',
    text: 'We do not collect an email address, so there is no automatic password reset. If you lose your password you must ask your ambassador.',
  },
  {
    title: 'Serious misuse can be reported',
    text: 'If we believe someone has used the Platform to commit a crime, we may report it to law enforcement and hand over the relevant logs.',
  },
];

export const TERMS_SECTIONS: TermsSection[] = [
  {
    n: '1',
    h: 'Who you are agreeing with',
    body: [
      'CyberKhana is a cybersecurity education project run from Iraq. It operates a capture-the-flag ("CTF") competition platform for university student communities.',
      'CyberKhana is not a registered company yet. In these Terms, "CyberKhana", "we", "us" and "our" mean the people who run the project. If CyberKhana becomes a registered company later, that company will take over these Terms, and we will update this section and tell you.',
      'You can reach us at support@cyberkhana.tech.',
      'These Terms cover app.cyberkhana.tech only. CyberKhana Academy (academy.cyberkhana.tech) has its own separate Terms.',
    ],
  },
  {
    n: '2',
    h: 'The three documents',
    body: ['There are three sets of rules on this Platform. This one applies to everyone.'],
    list: [
      'These Terms of Service — everyone who uses the Platform.',
      'The Ambassador Agreement — student ambassadors who administer a university.',
      'Competition Rules — anyone entering a specific competition.',
    ],
    after: [
      'Ambassadors are bound by both these Terms and the Ambassador Agreement. If you enter a competition, its Rules apply on top of these Terms.',
      'If two documents disagree, the stricter rule wins. A competition can tighten a rule; it can never loosen section 6.',
    ],
  },
  {
    n: '3',
    h: 'Agreeing to these Terms',
    body: [
      'By creating an account or using the Platform, you agree to these Terms. If you do not agree, do not use the Platform.',
      'If you are signing up on behalf of a university, club or society, you confirm you are allowed to agree to these Terms for them.',
    ],
  },
  {
    n: '4',
    h: 'Who can use the Platform',
    body: [
      'You must be at least 13 years old.',
      'If you are under 18, you need permission from a parent or guardian, and they must have read these Terms — especially section 6, which explains what this Platform teaches and the strict limits on where you may use it. By signing up while under 18, you are confirming you have that permission.',
      'If you are a parent or guardian and your child uses the Platform, you are agreeing to these Terms for them and you are responsible for what they do here.',
      'University affiliation. To register you need a university code from that university’s ambassador. Tell the truth about which university you belong to. Do not use a code you were not given.',
      'Your local law is your responsibility. Computer crime laws differ from country to country, and some are strict about security tools no matter why you have them. Make sure using this Platform is legal where you are.',
    ],
  },
  {
    n: '5',
    h: 'Your account',
    body: [
      'To register you give us a username, your full name, a password and a university code. We do not collect your email address.',
      'That has one consequence you need to understand: we cannot reset your password automatically. There is no "forgot password" email, because we have no email for you. If you lose your password, your only option is to ask your ambassador or us to reset it by hand — and we may not be able to prove the account is yours. Pick a password you will remember, and do not reuse one from anywhere else.',
      'You are responsible for everything done through your account. Keep your password private. Email support@cyberkhana.tech immediately if you think someone else has got into it.',
      'One account each. Do not make extra accounts, share yours, or use someone else’s. Accounts cannot be transferred.',
      'Your full name is shown publicly on leaderboards. See section 13.',
    ],
  },
  {
    n: '6',
    h: 'What you may attack — and what you may not',
    emphasis: true,
    body: [
      'This is the most important section of these Terms.',
      'This Platform teaches offensive security. Those techniques are illegal to use against a system you do not have permission to test. Learning them here gives you permission to use them here, on the targets we name, and nowhere else.',
      'You may use security testing techniques only against a target explicitly named in a published challenge, at the exact address given in that challenge, and the practice lab machines we provide — and only while that challenge or competition is open, from your own account, and as far as you need to go to find the flag.',
      'That is the whole of your permission. Anything outside those lines is unauthorised — under these Terms, and almost certainly under the law.',
      'You must never do any of the following, on the Platform, from the Platform, or using anything you learn on it:',
    ],
    list: [
      'Attack the Platform itself. No scanning, fuzzing, or trying to get into our servers, database, API, admin functions, or another user’s account.',
      'Reach anything that is not a named target. Not other machines on the same network as a lab box. Not your university’s systems. Not anything belonging to anyone else.',
      'Pivot out of the lab. Do not use a lab machine as a jumping-off point, relay, proxy or tunnel to reach anything outside it.',
      'Run denial-of-service attacks. Not against us, not against named targets, not against anything.',
      'Upload or share real malware. No ransomware, stealers, botnet code, or tools built to damage systems you are not authorised to test.',
      'Use the Platform to plan or coordinate a real attack.',
      'Take, publish or trade real data. No real personal data, credentials, or stolen material of any kind.',
    ],
    after: [
      'If you are not sure whether something is in scope, assume it is not, and ask your ambassador before you touch it.',
      'A named target is a boundary, not a hint. If a challenge gives you a host and a port, that host and that port are what you may test. Not the machine next to it. Not something you found by looking around. Not the real company whose name appears in the challenge story.',
    ],
  },
  {
    n: '7',
    h: 'Other things you must not do',
    body: ['You also agree not to:'],
    list: [
      'harass, threaten, bully or abuse anyone, or post hateful, discriminatory, sexual or violent content;',
      'pretend to be someone else, an ambassador, or CyberKhana;',
      'scrape the Platform, or point automated tools at it — except where a challenge specifically asks you to, against its own target;',
      'interfere with anyone else’s participation, including their solves, scores or session;',
      'get around a ban, a rate limit, or any access control;',
      'resell, sublicense or make money from any part of the Platform;',
      'break the law while using the Platform.',
    ],
  },
  {
    n: '8',
    h: 'Playing fair',
    body: ['CTF only works if people solve challenges themselves. You agree not to:'],
    list: [
      'share flags with anyone who has not solved that challenge — not in group chats, not in DMs, not "just this once";',
      'take a flag from someone else, or submit one you did not find;',
      'publish a solution or writeup while the challenge is still active, unless your ambassador says you may;',
      'work with other people in a competition where working together is not allowed;',
      'brute-force the flag submission form, or automate submissions;',
      'use extra accounts to farm points, unlock hints cheaply, or grab first blood;',
      'exploit a bug in our scoring, hints or submission system instead of solving the challenge. If you find one, report it under section 14. Reporting it in good faith earns you credit; using it gets you banned.',
    ],
    after: [
      'We and ambassadors can remove points, cancel solves, disqualify you from a competition, or ban your account for breaking this section.',
    ],
  },
  {
    n: '9',
    h: 'The practice lab',
    body: [
      'Some challenges run against deliberately vulnerable machines that we host. These machines are broken on purpose. They have known, unpatched holes and weak passwords. That is what they are for.',
      'You need to understand five things about them:',
    ],
    list: [
      'They are shared. Other people are on the same machine at the same time. Nothing you do there is private.',
      'Never put real information on them. No real password, no real email, no personal details, nothing you care about. Treat everything on a lab machine as public.',
      'They get wiped without warning. Anything you leave there can vanish. Keep your notes on your own computer.',
      'They are not storage. Do not use them to keep or run your own code beyond what the challenge needs.',
      'The lab is a wall, not a doorway. Getting from inside the lab to anything outside it is banned under section 6 — whether or not you can technically do it.',
    ],
    after: ['We do not promise the lab will be up, working, or correct at any given moment.'],
  },
  {
    n: '10',
    h: 'Content you post',
    body: [
      'This section covers anything you put on the Platform — challenges, files, hints, announcements, profile text. Ambassadors have extra obligations in the Ambassador Agreement.',
      'You keep ownership of what you make.',
      'You give us a licence to use it. By posting content, you give CyberKhana a worldwide, non-exclusive, royalty-free licence to host, store, display, copy, translate, adapt and distribute it — across CyberKhana products, including the Academy and any future paid version of either. We will credit you as the author wherever we reasonably can.',
      'This licence lets us keep running and building CyberKhana without having to track down every past contributor for permission. It does not stop you using your own work however you like, anywhere else.',
      'If you delete your content, the licence ends — except for copies in our backups, and for archived competitions and solve records that already depend on it.',
      'When you post something, you are promising us that it is yours to post or properly licensed and credited; that it infringes nobody’s rights; that it contains no real personal data and no real malware; and that it does not break section 7.',
      'We can moderate. We may review, edit, unpublish or delete anything that breaks these Terms — without warning where there is a risk of harm. We do not check everything, and content posted by ambassadors or users is theirs, not ours.',
    ],
  },
  {
    n: '11',
    h: 'Points and scoring',
    body: [
      'Challenges are scored either statically (a fixed number of points) or dynamically (worth less as more people solve them).',
      'Under dynamic scoring, the points you already earned can go down. When more people solve a challenge, its value drops for everyone who solved it, including you. This is deliberate, it is how CTF scoring normally works, and it is not a bug.',
      'Hints cost points to unlock. First blood may earn a bonus.',
      'Points are not money. Points, ranks and leaderboard positions have no cash value, are not your property, and cannot be sold, traded or transferred.',
      'We and ambassadors can adjust, deduct, reset or recalculate points — including after the fact — to fix mistakes, deal with broken challenges, apply penalties, or respond to cheating. We will try to explain any significant change, but scoring decisions are final.',
    ],
  },
  {
    n: '12',
    h: 'Competitions and prizes',
    body: [
      'Ambassadors run competitions with their own start times, end times, challenges and Competition Rules. Those Rules apply alongside these Terms.',
      'A competition can be paused, extended, rescored or cancelled — for example if a challenge breaks, a flag leaks, or the Platform goes down.',
      'We do not award prizes at the moment. If we do in future, then unless that competition’s Rules say otherwise: what the prize is and who can win it will be published beforehand; prizes are personal to the winner and cannot be swapped for cash or transferred; we may ask a winner to prove their identity and enrolment; anyone disqualified under section 6 or section 8 loses the prize; any tax is the winner’s responsibility; where a sponsor provides the prize, the sponsor delivers it and their terms may also apply; and our decision on results and prizes is final.',
    ],
  },
  {
    n: '13',
    h: 'What other people can see',
    body: ['This Platform is competitive, so it is public by design. Everyone can see:'],
    list: [
      'your username and your full name;',
      'your university;',
      'your points, rank and profile icon;',
      'which challenges you solved, when, and whether you got first blood;',
      'where you sit on your university leaderboard and the national leaderboard.',
    ],
    after: [
      'By using the Platform you agree to all of that being shown.',
      'If you do not want your real name public, do not put your real name in the full name field. But be aware: your ambassador may need a name they can recognise to confirm you study there, and prize verification may need it later.',
    ],
  },
  {
    n: '14',
    h: 'Found a bug in the Platform?',
    body: [
      'If you find a security flaw in the Platform itself — not in a challenge — email support@cyberkhana.tech before you do anything else.',
      'We will treat your report as good-faith research, and will not come after you, as long as you:',
    ],
    list: [
      'tell us promptly, and give us reasonable time to fix it before telling anyone else;',
      'go only as far as you need to prove it is real, and stop there;',
      'do not read, change, download or delete anyone else’s data;',
      'do not degrade the service for other people, and do not run DoS tests;',
      'do not use the flaw to gain points, flags or rank.',
    ],
    after: [
      'Stay inside those lines and we will thank you, credit you if you want, and fix it. Step outside them — dig deeper, take other people’s data, use it to score — and it stops being research and becomes a breach of section 6.',
    ],
  },
  {
    n: '15',
    h: 'Our content and our name',
    body: [
      'The Platform’s software, design, text and the challenges we write ourselves belong to CyberKhana or the people who licensed them to us. The CyberKhana name and logo are ours.',
      'You can use the Platform to learn and compete. You cannot copy it, republish it, mirror it, sell it, or build a competing platform out of it. You cannot use our name or logo in a way that suggests we endorse you, without our written permission.',
      'Some challenges use third-party open-source software, which stays under its own licence.',
    ],
  },
  {
    n: '16',
    h: 'Availability',
    body: [
      'The Platform is free, and it is run by a small volunteer team.',
      'We do not promise it will be available. We can change, pause, limit or shut down any part of it — challenges, competitions, leaderboards, a university, or the whole thing — at any time, with or without notice. We can reset scores or start a new season.',
      'We will try to give reasonable warning before anything major, but we are not obliged to.',
    ],
  },
  {
    n: '17',
    h: 'Suspension, bans and closing your account',
    body: [
      'We or your ambassador can suspend or ban your account, remove your points, cancel your solves, or restrict what you can do, if you break these Terms — especially section 6 or section 8; if you are no longer a student at the university you registered under; if we think your behaviour puts other users, the Platform, or someone else at risk; or if the law requires it.',
      'For minor problems we will normally warn you first. For anything involving an unauthorised attack, real harm, or someone else’s data, we may act immediately and without warning.',
      'Serious misuse may be reported to the authorities. If we believe someone has used the Platform to commit a crime — attacking a real system, taking real data, distributing malware — we may report it to law enforcement, and we may preserve and hand over the relevant logs, account details and activity records.',
      'You can stop using the Platform whenever you like, and you can ask us to delete your account at support@cyberkhana.tech. Some records stay: solve history that affects other people’s rankings, and records of moderation decisions.',
      'Sections 6, 10, 15, 18, 19, 20 and 23 continue to apply after your account ends.',
    ],
  },
  {
    n: '18',
    h: 'What we do not promise',
    body: [
      'The Platform is provided "as is" and "as available", with no warranties of any kind, as far as the law allows. We do not promise it will be uninterrupted, secure or error-free, or that challenges, flags, scoring or lab machines will be correct or working.',
      'This is education, not qualification. Nothing here is professional security advice, and none of it qualifies you to test a real system. We do not guarantee any certificate, skill level, exam result, internship or job.',
      'We are not responsible for what you do with what you learn. These techniques work on real systems. Using them outside section 6 is your choice and your responsibility alone.',
      'We are not responsible for content written by ambassadors or other users, for how other users behave, or for third-party sites we link to.',
    ],
  },
  {
    n: '19',
    h: 'Limits on our liability',
    body: ['As far as the law allows, CyberKhana and the people who run it are not liable for:'],
    list: [
      'indirect or knock-on losses of any kind;',
      'lost data, points, rank, solves, progress or opportunity;',
      'damage to your computer or systems from challenges, tools or lab machines;',
      'anything another user does, or content we did not write;',
      'any consequence — legal, academic or otherwise — of you using these techniques outside the scope in section 6.',
    ],
    after: [
      'Where liability cannot legally be excluded, it is limited to what you have paid us to use the Platform. That is zero.',
      'Nothing here limits liability for death or personal injury caused by negligence, for fraud, or for anything else that cannot be limited under Iraqi law.',
    ],
  },
  {
    n: '20',
    h: 'If you cause us a problem',
    body: [
      'If you break these Terms — particularly by attacking something you were not authorised to attack — and that results in a claim, complaint, investigation or loss involving us, you agree to take responsibility for it and to cover the reasonable costs it causes us.',
    ],
  },
  {
    n: '21',
    h: 'Your data',
    body: [
      'We collect the username, full name, university code and password you give us, plus what you do on the Platform (solves, points, penalties, hints unlocked) and basic technical logs such as IP address.',
      'We use it to run the Platform, build leaderboards, and keep the service secure. We do not sell your data.',
      'A full Privacy Policy for the Platform is being written. Until it is published, this section describes what we do, and you can ask us anything about your data at support@cyberkhana.tech.',
    ],
  },
  {
    n: '22',
    h: 'Changes to these Terms',
    body: [
      'We may update these Terms. When we do, we will change the "Last updated" date at the top, and for anything significant we will announce it on the Platform.',
      'If you keep using the Platform after a change, you accept the new Terms. If you do not accept them, stop using the Platform and ask us to close your account.',
    ],
  },
  {
    n: '23',
    h: 'Law and disputes',
    body: [
      'These Terms are governed by the laws of the Republic of Iraq, and disputes go to the competent Iraqi courts.',
      'Please talk to us first at support@cyberkhana.tech. Almost everything is faster to sort out that way.',
      'If a court decides part of these Terms cannot be enforced, the rest still stands. If we do not enforce a rule on one occasion, that does not mean we have given up the right to enforce it later.',
    ],
  },
  {
    n: '24',
    h: 'Language',
    body: [
      'These Terms are written in English. If we publish an Arabic translation, it is for convenience only. If the two versions disagree, the English version is the one that counts.',
    ],
  },
  {
    n: '25',
    h: 'Contact',
    body: ['support@cyberkhana.tech'],
  },
];
