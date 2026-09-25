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

## Compared with HTB CTF

Now at parity: registration with capacity and deadline, teams of up to four with invite codes and captains, team and player scoreboards, dynamic scoring, first bloods, a top-team score progression graph, event brief and rules, scheduled automatic start, announcements, score adjustments, disqualification, CSV results export and a presentation scoreboard.

Not implemented yet, in rough order of value:

- Scoreboard freeze for the final hour.
- A submission log, including incorrect flags. Wrong submissions are rejected before any write, so flag-guessing or flag-sharing patterns cannot be reviewed; the rate limit is the only guard.
- Per-team challenge instances (spawnable Docker targets). Full Pwn and web targets are shared hosts today.
- Releasing challenges in waves during the event. The board is frozen at the start, so late additions are not possible.
- Captain tools: removing a teammate or handing over the captaincy without the host.
- Certificates and a public post-event results page.

## Atomic storage and access

An embedded `eventState` owns invitations, registrations, teams, solves, purchased hints and score adjustments. Conditional `findOneAndUpdate` writes compare both `eventRevision` and status, retrying the complete operation on contention. This enforces capacity, membership, team-size, solve and hint invariants without requiring a MongoDB replica set. The scheduler's status changes also invalidate a racing mutation.

Capacity is limited to 10,000 participants and writes have a conservative 12 MB serialized-document guard below MongoDB's 16 MB BSON ceiling. The effective event size depends on challenge descriptions, files, hints and solve history; the capacity limit alone does not guarantee all possible event workloads fit. Very large events should move to dedicated collections/transactions before raising these bounds. Scores are computed on demand; no large-event load benchmark was performed.

Nonparticipant responses use an explicit metadata allowlist. Student challenge responses strip flags and replace locked hints with `LOCKED`. University-wide notifications contain counts or event metadata only; challenge activity stays in authorized event rooms. Event routes refresh the actor's role, university and ban status from the database, and socket admission rechecks membership after joining to cover concurrent removal.

## Validation

`npm --prefix backend run test:events` builds the backend and runs 20 passing Node integration tests against disposable MongoDB data. Coverage includes concurrent capacity claims, concurrent team joins, four-member limits, duplicate teammate submissions, shared hint purchases, invitation acceptance/decline, HTTP/socket access gates, removal/eviction, captain succession, withdrawal after solving, mandatory atomic team selection at registration, exact one-hour withdrawal boundaries, team-history preservation, static/dynamic scores, first blood, tiebreaks, event closure, both explicit-workshop and missing-type legacy flows, disqualification and reinstatement (rankings, decay, first blood, timeline, blocked play), settings edits and invitations, and scheduled automatic starts.

The test runner uses `mongodb-memory-server`. To use a locally installed MongoDB binary instead of downloading one on Windows:

```powershell
$env:MONGOMS_SYSTEM_BINARY = 'C:/Program Files/MongoDB/Server/8.2/bin/mongod.exe'
npm --prefix backend run test:events
```

Frontend production build and backend TypeScript compilation pass. The repository-wide frontend `tsc --noEmit` still reports 20 pre-existing errors unrelated to this feature. Browser verification uses synthetic users and a disposable database; no production data is changed. Deployment has not been performed.
