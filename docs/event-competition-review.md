# Event competition implementation

Implemented on 2026-09-23 alongside the existing workshop system. Competitions without a `type` still use the workshop handlers; no data migration is required.

## Delivered

- OSINT, Network and Full Pwn categories, with matching isometric SVG art. Misc keeps its existing `Miscellaneous` storage value and has refreshed artwork.
- Event creation with registration deadline, participant capacity and any number of invited universities. The host is accepted automatically; invited university admins accept or decline from the competition area.
- Distinct event cards with registration counts, deadline countdown and registration controls. Unregistered students receive metadata only and cannot enter the event dashboard, request challenge details, submit flags, buy hints or join its socket room.
- Teams of up to four registered participants, invite codes, captain succession, shared solves and hints, and one team per participant per event.
- Team-first rankings, an individual attribution view, static/dynamic scoring, first blood, hint costs, audited positive/negative team adjustments and earliest-last-solve tiebreaking.
- Host controls for invitations, challenge snapshots, starting/ending, participant registration, team membership, publishing hints and score adjustments.
- Socket updates for registration counts, invitations, rosters, activity and scoring. Removing registration evicts the participant from the event room and clears the event UI.

## Competition console (redesigned 2026-09-25)

`/admin/competitions` is a filterable list (status, format, search) whose rows open the competition console at `/admin/competitions/:id/monitor`. Creating a competition starts with a format choice (CTF event or workshop) and lands on the new console's Challenges tab.

The console has a header with lifecycle actions (Start / End, confirmed), a schedule strip, four live stat tiles and tabs:

- **Events:** Overview (launch checklist while pending, score progression graph, live activity, top teams, category progress, first bloods), Scoreboard (team/player standings, CSV export), Teams (rosters, invite codes, score adjustments, disqualification), Participants (registrations, host additions, university invitations), Challenges (board, bank picker, hint publishing), Announcements and Settings.
- **Workshops:** Overview, Leaderboard, Students, Challenges and Announcements.

The console renders inside the app layout on the page canvas; the old monitoring page painted its own `canvas-alt` background, which left a visible seam beside the sidebar. It live-updates from socket events (debounced, pausable). The event dashboard shows hosts a link to the console instead of management forms, and players a team card with the event brief. Legacy `/events/:id` links redirect to `/competition/:id`. Team entries do not open individual profiles.

Admins can maximize either competition type's leaderboard from the console or the leaderboard itself. Presentation mode fills the viewport, hides the app navigation and supports Escape or Exit fullscreen. The leaderboard button also requests native browser fullscreen where supported. Live refresh and the team/individual toggle continue to work while maximized.

## Rules and scope

The host university's admins and super-admins manage the event. Invited admins respond for their own university; accepting an invitation does not grant host permissions. Teams may span accepted universities, and one-person teams are valid.

Students register before the deadline, subject to capacity, and must create or join a team in the registration dialog. Registration and team membership commit atomically; an invalid invite, full team, duplicate team name or capacity failure leaves neither a registration nor an orphan team. Students may unregister only during the first hour after their registration timestamp, even if the registration deadline has since passed. At exactly one hour, self-service withdrawal is locked. Ended events do not allow withdrawal. Hosts may add participants after the deadline while the event is open, but cannot exceed capacity or add students from unaccepted universities. Withdrawing also removes team membership.

Ordinary roster transfers lock after the team's first solve, hint purchase or score adjustment. Withdrawal is still allowed during the first hour after registration. Host removals retain history, and removed members cannot move their earned contributions to another team. Hosts can restore their original membership. Empty teams without history disband; empty teams with scoring history remain archived so standings cannot be erased by leaving.

Event scores are separate from personal platform/workshop points. A unique solve belongs to the team that earned it. Individual rankings attribute solves and hint charges to the player who performed them; team-wide adjustments appear in team rankings only. Dynamic decay is based on unique solving teams and recalculates totals consistently.

Challenges are copied from the host's challenge bank before starting. Event snapshots use fresh IDs and cannot be integrated back into the ordinary challenge bank. Registered students see challenge content only while the event is active; rankings remain available afterward. Ended events cannot reopen or be deleted through the workshop endpoints. Source challenges retain their existing visibility in the challenge bank, so keep source challenges unpublished when their content should be event-exclusive.

An event can open automatically (`autoStart`) at its start time; the scheduler sweep starts it only once it has at least one challenge, and a duration-based event then runs from the published start. Ending an event manually records the end time. Hosts edit an unfinished event through `PATCH /competitions/:id/settings`: name, description (the brief shown to invited universities, up to 5,000 characters), registration deadline, capacity (never below current registrations), and — before the start — start mode, start time, time limit and duration; a running event's end time can be extended or shortened. The same endpoint invites further universities and withdraws invitations that were not accepted.

A host can disqualify a team with a reason (`POST /teams/:teamId/disqualification`) and reinstate it (`DELETE`), including after the event ends. A disqualified team and its players leave the rankings, the activity feed and the score graph; its solves stop counting toward dynamic decay, and first blood passes to the earliest remaining solve. Its players see the reason, keep their own solve history, and cannot submit flags, buy hints or be joined. Reinstating restores everything, since scores are computed from stored solves.

## Scoreboard freeze

A host sets `scoreboardFreezeAt` in Settings (quick picks: one hour or 30 minutes before the end). From that moment everyone but the hosts gets the event as it stood then: standings, the score graph, the activity feed, challenge solve counts, solvers and dynamic values all come from `frozenView`, which drops later solves, hint purchases and adjustments. A team still sees its own live score and solved markers, so it can keep playing and buying hints, and a correct flag during the freeze returns no points or first-blood flag, since those would reveal how many others solved it. Disqualifications stay current. Hosts see live data in the console; the scoreboard page shows hosts the players' view by default (so a projector never leaks the freeze) with a hosts-only live toggle. `POST /scoreboard/reveal` lifts the freeze and every open scoreboard updates over the socket. Setting a new freeze time freezes again.

## Submission log

Every flag attempt by a registered player is stored in the `EventSubmission` collection with its result: correct, wrong, duplicate, or refused (with the reason, such as a disqualified team). It is a separate collection on purpose: the event document is rewritten on every change under a 12 MB guard, so storing guesses there would let a player spam the form until the event could no longer be written. Wrong answers are kept as typed, truncated to 256 characters; correct ones are not stored, since they are the flag. A wrong answer that matches another challenge's flag is flagged. Only hosts can read the log (`GET /submissions`, filters are whitelisted, cursor-paginated); it is never part of a player response and is always rendered as text. Entries expire after 180 days (TTL index). Logging failures never affect whether a submission counts.

Alongside it: flags are compared as SHA-256 digests with `timingSafeEqual`, and event rate limits are counted per player (50 flags and 120 writes per 10 minutes) with a 3,000-requests-per-address backstop. They used to be per IP, which let one campus network behind a single address exhaust everyone's allowance.

## Release waves

Each event challenge can carry a `releaseAt`. Until then it is invisible to players: absent from the board, the challenge count and the solvers list, and a submission, hint request or solvers request for it answers 404 like a challenge that does not exist. Players see only when the next wave opens and how many challenges it holds (`nextRelease`); the event page refreshes itself at that moment. Release times are whole minutes, so challenges scheduled together open together. Hosts can add challenges during the event (released at once, or scheduled), reschedule or release a wave early, and remove a challenge only while it is unreleased; a released challenge that teams have solved cannot be hidden again. An event must have at least one challenge on the opening board to start, manually or automatically.

## Results page and certificates

After the event ends a host can publish a results page at `/#/results/:id` (`POST /results/publish`, which also lifts a remaining freeze). It needs no account and answers from an allowlist: event name, brief, host and universities, dates, podium, standings with team names, universities, points and solves, the top-eight score graph, and per-challenge statistics with first-blood teams. It never includes player names, flags, invite codes or unreleased challenges. Unpublishing makes it 404 again.

`POST /certificates/issue` creates one `Certificate` per registered player who is not on a disqualified team, with the printed details copied in (name, university, team, placing, points, event, host, dates). It requires an ended, revealed event. Running it again refreshes the details, keeps every code (so shared links keep working), and revokes certificates of players who are no longer eligible. Each has a 128-bit random code; `/#/certificates/:code` is a public verification page that shows the certificate or states that it was revoked, with print-to-PDF. Players find theirs on the event page. The certificate is the "Dossier" design (dark theme only), rendered by `components/certificates/CertificateTemplate.tsx`: an A4-landscape sheet sized in millimetres, gold/silver/bronze styling and foil seal for the podium, green for other placings, and a participant layout with the seal in place of the rank for players without a team. Text is shrunk to fit its box once the fonts load, Arabic names are set right to left, and the QR code (the `qrcode-generator` package) links to the verification page. Printing, or saving as PDF, produces exactly one landscape A4 page holding only the certificate; those print rules are mounted only while a certificate is on screen.

## Compared with HTB CTF

Now at parity: registration with capacity and deadline, teams of up to four with invite codes and captains, team and player scoreboards, dynamic scoring, first bloods, a top-team score progression graph, event brief and rules, scheduled automatic start, release waves, scoreboard freeze and reveal, announcements, score adjustments, disqualification, a host-only submission log, CSV exports, a presentation scoreboard, a public results page and verifiable certificates.

Not implemented yet:

- Per-team challenge instances (spawnable Docker targets). Full Pwn and web targets are shared hosts today.
- Captain tools: removing a teammate or handing over the captaincy without the host.

## Atomic storage and access

An embedded `eventState` owns invitations, registrations, teams, solves, purchased hints and score adjustments. Conditional `findOneAndUpdate` writes compare both `eventRevision` and status, retrying the complete operation on contention. This enforces capacity, membership, team-size, solve and hint invariants without requiring a MongoDB replica set. The scheduler's status changes also invalidate a racing mutation.

Capacity is limited to 10,000 participants and writes have a conservative 12 MB serialized-document guard below MongoDB's 16 MB BSON ceiling. The effective event size depends on challenge descriptions, files, hints and solve history; the capacity limit alone does not guarantee all possible event workloads fit. Very large events should move to dedicated collections/transactions before raising these bounds. Scores are computed on demand; no large-event load benchmark was performed.

Nonparticipant responses use an explicit metadata allowlist. Student challenge responses strip flags and replace locked hints with `LOCKED`. University-wide notifications contain counts or event metadata only; challenge activity stays in authorized event rooms. Event routes refresh the actor's role, university and ban status from the database, and socket admission rechecks membership after joining to cover concurrent removal.

## Validation

`npm --prefix backend run test:events` builds the backend and runs 24 passing Node integration tests against disposable MongoDB data. Coverage includes concurrent capacity claims, concurrent team joins, four-member limits, duplicate teammate submissions, shared hint purchases, invitation acceptance/decline, HTTP/socket access gates, removal/eviction, captain succession, withdrawal after solving, mandatory atomic team selection at registration, exact one-hour withdrawal boundaries, team-history preservation, static/dynamic scores, first blood, tiebreaks, event closure, both explicit-workshop and missing-type legacy flows, disqualification and reinstatement (rankings, decay, first blood, timeline, blocked play), settings edits and invitations, scheduled automatic starts, the scoreboard freeze and reveal (player, host and projector views, hidden post-freeze solves), the submission log (results, truncation, cross-challenge flags, host-only access, pagination), release waves (hidden until released, 404 for unreleased challenges, mid-event additions, no re-hiding solved challenges, no empty opening board), and published results and certificates (public allowlists, ended-and-revealed requirements, stable codes, revocation).

The test runner uses `mongodb-memory-server`. To use a locally installed MongoDB binary instead of downloading one on Windows:

```powershell
$env:MONGOMS_SYSTEM_BINARY = 'C:/Program Files/MongoDB/Server/8.2/bin/mongod.exe'
npm --prefix backend run test:events
```

Frontend production build and backend TypeScript compilation pass. The repository-wide frontend `tsc --noEmit` still reports 20 pre-existing errors unrelated to this feature. Browser verification uses synthetic users and a disposable database; no production data is changed. Deployment has not been performed.
