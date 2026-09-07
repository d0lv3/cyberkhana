/* ── The Ambassador Agreement, as rendered data ──
 *
 * The authoritative text lives in `legal/AMBASSADOR-AGREEMENT.md` at the repo
 * root. This file is that document typed out for the app to render; when you
 * change one, change the other, and bump the version here and in the backend's
 * `config/terms.ts` (CURRENT_AMBASSADOR_AGREEMENT_VERSION) together.
 */
import type { LegalSection, LegalKeyPoint } from './legalTypes';

/** Must match CURRENT_AMBASSADOR_AGREEMENT_VERSION in backend/src/config/terms.ts. */
export const AMBASSADOR_VERSION = '2026-09-07';

export const AMBASSADOR_UPDATED = '7 September 2026';

/**
 * What an ambassador must see before unlocking the Management area.
 *
 * Weighted towards the clauses that can put them personally in legal trouble
 * rather than the administrative ones — a challenge target aimed at something
 * they do not own is the single worst thing that can happen on this platform.
 */
export const AMBASSADOR_KEY_POINTS: LegalKeyPoint[] = [
  {
    title: 'Only target infrastructure you own',
    text: 'A challenge target must be a lab machine we provide, or a machine you personally own and are authorised to have attacked. Never your university’s systems, never a real company, never an address you have not verified you control.',
  },
  {
    title: 'Pointing students at someone else’s system is a crime',
    text: 'You would be directing a group of students to commit an offence, and committing one yourself. Organising it is treated more seriously than doing it alone. If you are not certain you own it, ask before you publish.',
  },
  {
    title: 'Student data is confidential',
    text: 'You can see the accounts and activity of students at your university. Look only when you need to, never share it outside the Platform, never export it, and never use it for anything personal.',
  },
  {
    title: 'You cannot compete in your own competition',
    text: 'No submitting flags for challenges you wrote or whose solutions you have seen, no hints outside the hint system, and declare it if a competitor is a close friend or relative.',
  },
  {
    title: 'Do not sign anything in CyberKhana’s name',
    text: 'You represent your campus community, not CyberKhana. Sponsorships, university agreements and press all come to us — introduce them, do not negotiate.',
  },
  {
    title: 'Report serious incidents within 24 hours',
    text: 'An attack on a real system, leaked student data, a safeguarding concern, or contact from your university or the police — bring those to us immediately rather than handling them yourself.',
  },
  {
    title: 'Nobody is insured',
    text: 'CyberKhana is not a registered company and carries no insurance for your activities. Honest mistakes made while following this agreement are ours to sort out together; deliberate breaches are not.',
  },
];

export const AMBASSADOR_SECTIONS: LegalSection[] = [
  {
    n: '1',
    h: 'What this is',
    body: [
      'This Agreement is between you and CyberKhana, and it covers your role as the student ambassador for your university on app.cyberkhana.tech (the "Platform").',
      'CyberKhana is a cybersecurity education project run from Iraq. It is not a registered company yet, so this Agreement is with the people who run the project. You can reach us at support@cyberkhana.tech.',
      'This Agreement is in addition to the Terms of Service. Everything in the Terms applies to you as well. Where this Agreement is stricter, this Agreement wins.',
      'By accepting an ambassador role, or by using ambassador powers on the Platform, you agree to this Agreement.',
    ],
  },
  {
    n: '2',
    h: 'What you are agreeing to do',
    body: ['As ambassador for your university you agree to:'],
    list: [
      'run your university’s space on the Platform — challenges, competitions and announcements;',
      'run the weekly workshop for your community: roughly an hour of teaching, then an hour of live CTF;',
      'keep the challenges you publish working, fair and solvable;',
      'moderate your community, and deal with cheating and bad behaviour;',
      'pass on to us anything you cannot handle yourself.',
    ],
    after: [
      'We know you are a student with exams and a life. If you need to step back for a while, or hand the role over, tell us — that is completely fine, and much better than going quiet.',
    ],
  },
  {
    n: '3',
    h: 'This is not a job',
    body: [
      'You are a volunteer. This Agreement does not make you an employee, worker, partner, agent or contractor of CyberKhana.',
      'You are not paid. There are no wages, benefits, holiday, notice period or severance. You cover your own costs unless we agree otherwise in writing beforehand.',
      'You are free to stop at any time, and so are we (section 12).',
    ],
  },
  {
    n: '4',
    h: 'What you can do on the Platform',
    body: ['Your ambassador account can:'],
    list: [
      'write, publish, edit and delete challenges for your university, including their flags, hints and files;',
      'create and run competitions, and set when they open and close;',
      'post announcements to your university;',
      'award bonus points and apply point penalties;',
      'see the accounts and activity of students registered under your university;',
      'suspend and ban accounts at your university;',
      'issue your university’s registration code.',
    ],
    after: [
      'These powers are for running your community. They are not for anything else. You must not use them to help yourself or a friend compete, to settle a personal disagreement, to look at a particular student out of curiosity, or to punish someone for something that happened off the Platform.',
      'You must not share your ambassador login with anyone, including a co-organiser or a committee member. If someone else needs access, ask us and we will set them up properly.',
      'Use a strong, unique password on your ambassador account. It is an admin account on a security platform, and it will be a target.',
    ],
  },
  {
    n: '5',
    h: 'Challenge targets — the rule that matters most',
    emphasis: true,
    body: [
      'When you write a challenge you can give it a target: a host, an address, a port, or a link. Whatever you type there is where your students will point their tools.',
      'You may only set a challenge target that is a lab machine we provide, or infrastructure you personally own or control and are fully authorised to have attacked — your own VPS, your own container, your own home lab.',
      'You must never point a challenge at:',
    ],
    list: [
      'a system belonging to any other person, company or organisation;',
      'your university’s own systems — its website, its portal, its network, its wifi, its student records, anything of theirs. Not even with a lecturer’s verbal encouragement. Not even to "show them the risk";',
      'any live public service, even one that says it welcomes security testing;',
      'a real company’s site because it fits the story of your challenge;',
      'an address you have not personally verified you control.',
    ],
    after: [
      'Why this is serious. If you point a challenge at something you do not own, you are not just breaking a rule. You are directing a group of students to commit an offence against a third party, and you are committing one yourself. Under Iraqi law and under nearly every other country’s computer-misuse law, organising that is worse than doing it alone. You could be personally prosecuted, and your university could discipline or expel you.',
      'If you are not certain you own it, do not put it in the box. Ask us first at support@cyberkhana.tech. We would far rather answer that question than deal with what happens if you guess wrong.',
      'You must also make sure any target you do own is separate from anything real of yours, fine to have knocked over, and taken down or reset when the challenge closes.',
    ],
  },
  {
    n: '6',
    h: 'What your challenges must and must not contain',
    body: ['Every challenge you publish must:'],
    list: [
      'be solvable, with a working flag that you have tested yourself;',
      'teach something, rather than being a guessing game;',
      'be your own work, or properly licensed and credited to whoever made it;',
      'carry no real personal data about anyone — not yours, not a student’s, not a stranger’s;',
      'contain no real malware, and nothing that can damage a student’s own computer;',
      'follow the Terms of Service, including the rules on harassment, hate and illegal content.',
    ],
    after: [
      'Never reuse a challenge from another platform — HackTheBox, TryHackMe, CTFtime archives, a university course — without permission from whoever owns it. Their terms usually forbid it, and it becomes our problem as well as yours.',
      'Keep flags secret. Do not share a flag with a student, a friend, or a co-organiser. Do not put flags in a document that others can see. Do not reuse a flag across challenges.',
    ],
  },
  {
    n: '7',
    h: 'Other students’ information',
    emphasis: true,
    body: [
      'Your role lets you see the accounts and activity of students at your university. That is personal information about real people, most of whom are young and some of whom are minors.',
      'You agree to:',
    ],
    list: [
      'look at student data only when you actually need it to do the role;',
      'keep it confidential, and never share it outside the Platform — not in a group chat, not with a lecturer, not with a sponsor, not with another student;',
      'never export, copy, scrape or keep a copy of it outside the Platform;',
      'never use it for anything personal — recruiting, marketing, dating, settling scores, or building your own list of contacts;',
      'delete anything you did end up holding when your role ends.',
    ],
    after: [
      'If you become aware that student data has leaked, been exposed or been accessed by someone who should not have it, tell us within 24 hours at support@cyberkhana.tech. Do not try to quietly fix it first.',
    ],
  },
  {
    n: '8',
    h: 'Being fair',
    body: ['You are the referee at your university. That only works if you are visibly straight about it.'],
    list: [
      'Do not compete in a competition you run. If you want to compete, hand the competition to another ambassador or to us.',
      'Do not submit flags for challenges you wrote, or for any challenge where you have seen the flag or the solution.',
      'Do not give anyone an advantage — no early access to challenges, no hints outside the Platform’s hint system, no confirming a guess in a DM.',
      'Declare a conflict. If a competitor is your close friend, your flatmate, your partner or your relative, tell us before the competition, and let someone else handle any decision that affects them.',
      'Apply penalties for stated reasons. Every penalty and bonus you record should have a reason written in it that would make sense to the student and to us.',
    ],
    after: ['Points, ranks and prizes are not yours to give as favours.'],
  },
  {
    n: '9',
    h: 'Moderation, and when to escalate',
    body: [
      'Handle the ordinary things yourself: cheating, flag sharing, arguments, a broken challenge, a student who needs a warning.',
      'Come to us straight away, and do not handle it alone, if:',
    ],
    list: [
      'someone appears to have attacked a real system, from the Platform or using something they learned on it;',
      'someone has taken, published or is trading real data or credentials;',
      'there is a threat of violence, or a credible risk to someone’s safety;',
      'there is harassment, abuse or a safeguarding concern involving a student under 18;',
      'a student’s account or personal data may have been exposed;',
      'someone reports a security flaw in the Platform itself;',
      'you are contacted by your university’s administration, by a sponsor, by a journalist, or by the police about anything on the Platform.',
    ],
    after: [
      'For the last one: do not answer on our behalf. Be polite, say you will pass it on, and email us.',
    ],
  },
  {
    n: '10',
    h: 'Content you create',
    body: [
      'You keep ownership of the challenges and materials you write.',
      'You give CyberKhana a worldwide, non-exclusive, royalty-free licence to host, store, display, copy, translate, adapt and distribute your content across CyberKhana products — including CyberKhana Academy and any future paid version of either — and we will credit you as the author wherever we reasonably can.',
      'Plainly: a good challenge you write for your campus may end up in an Academy lesson, in a national competition, or in a paid course later, with your name on it. You can also use your own work anywhere else you like — this licence does not take that away.',
      'If you delete your content, the licence ends, except for our backups and for archived competitions and solve records that already depend on it.',
      'You confirm that everything you post is yours to give us on those terms.',
    ],
  },
  {
    n: '11',
    h: 'Speaking for CyberKhana',
    body: [
      'You represent your campus community. You do not represent CyberKhana.',
      'Without our written approval, you must not:',
    ],
    list: [
      'sign anything, or agree to anything, in CyberKhana’s name;',
      'accept sponsorship, money, equipment or venue deals on CyberKhana’s behalf;',
      'make commitments to your university, a company or a student on our behalf;',
      'speak to press or media as CyberKhana;',
      'create social media accounts, websites or merchandise using the CyberKhana name or logo.',
    ],
    after: [
      'You may say you are the CyberKhana ambassador at your university — that is the whole point. You may use our name and logo for your own campus events, in the way we have shown you, and you must stop if we ask.',
      'If a sponsor or your university wants to work with CyberKhana, introduce them to us. Do not negotiate.',
    ],
  },
  {
    n: '12',
    h: 'Ending the role',
    body: [
      'You can stop at any time. Just tell us. We would appreciate reasonable notice and help finding a replacement, but you are a volunteer and you are never trapped.',
      'We can end the role at any time, with or without a reason. We will normally talk to you first. We may remove your access immediately, without warning, if you break section 5 (challenge targets), section 7 (student data) or section 8 (fairness); if we believe students, the Platform, or someone outside it are at risk; if you go inactive and do not respond to us; or if you stop being a student at that university.',
      'When the role ends: your admin access is removed and your university may be reassigned; challenges and competitions you published stay on the Platform under the licence in section 10; you must delete any student information you hold outside the Platform; and you must stop describing yourself as a CyberKhana ambassador.',
      'Your ordinary student account can stay, if you want it.',
      'Sections 5, 7, 10, 11, 13, 14 and 15 continue to apply after the role ends.',
    ],
  },
  {
    n: '13',
    h: 'Where you stand legally',
    body: [
      'You are a volunteer, and we are not going to pursue a volunteer for honest mistakes made while doing this properly. If you follow this Agreement and something goes wrong anyway, come to us and we will deal with it together.',
      'That protection does not extend to pointing a challenge at something you do not own (section 5), misusing student data (section 7), using your powers to cheat or to favour someone (section 8), or anything you do deliberately, dishonestly, or after we told you to stop.',
      'If you do one of those and it results in a claim, complaint, investigation or loss involving us, you are responsible for it and for the reasonable costs it causes us.',
      'CyberKhana is not a registered company and carries no insurance for your activities. You are not covered by anything. Neither are we. This is exactly why section 5 is written the way it is.',
    ],
  },
  {
    n: '14',
    h: 'Things we do not promise',
    body: [
      'The Platform is provided as is. We do not promise it will be available, working or error-free, and we can change or shut down any part of it, including your university’s space.',
      'We do not promise the role will continue, that it leads to anything, or that it will be recognised by your university or a future employer.',
    ],
  },
  {
    n: '15',
    h: 'General',
    body: [
      'Law. This Agreement is governed by the laws of the Republic of Iraq, and disputes go to the competent Iraqi courts.',
      'Changes. We may update this Agreement. We will tell ambassadors when we do. If you keep using ambassador powers afterwards, you accept the new version.',
      'Language. Written in English. Any Arabic translation is for convenience; if they disagree, the English version counts.',
      'The rest. If part of this Agreement cannot be enforced, the rest still stands. If we do not enforce something once, we can still enforce it later. You cannot transfer this Agreement or your role to anyone else.',
    ],
  },
  {
    n: '16',
    h: 'Contact',
    body: ['Questions before you accept: support@cyberkhana.tech'],
  },
];
