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

## Rules and scope

The host university's admins and super-admins manage the event. Invited admins respond for their own university; accepting an invitation does not grant host permissions. Teams may span accepted universities, and one-person teams are valid.

Students can register or withdraw before the deadline, subject to capacity. Hosts may add participants after the deadline while the event is open, but cannot exceed capacity or add students from unaccepted universities. Withdrawing also removes team membership.

Ordinary roster transfers lock after the team's first solve, hint purchase or score adjustment. Withdrawal is still allowed before the registration deadline. Host removals retain history, and removed members cannot move their earned contributions to another team. Hosts can restore their original membership. Empty teams without history disband; empty teams with scoring history remain archived so standings cannot be erased by leaving.

Event scores are separate from personal platform/workshop points. A unique solve belongs to the team that earned it. Individual rankings attribute solves and hint charges to the player who performed them; team-wide adjustments appear in team rankings only. Dynamic decay is based on unique solving teams and recalculates totals consistently.

Challenges are copied from the host's challenge bank before starting. Event snapshots use fresh IDs and cannot be integrated back into the ordinary challenge bank. Registered students see challenge content only while the event is active; rankings remain available afterward. Ended events cannot reopen or be deleted through the workshop endpoints. Source challenges retain their existing visibility in the challenge bank, so keep source challenges unpublished when their content should be event-exclusive.

## Atomic storage and access

An embedded `eventState` owns invitations, registrations, teams, solves, purchased hints and score adjustments. Conditional `findOneAndUpdate` writes compare both `eventRevision` and status, retrying the complete operation on contention. This enforces capacity, membership, team-size, solve and hint invariants without requiring a MongoDB replica set. The scheduler's status changes also invalidate a racing mutation.

Capacity is limited to 10,000 participants and writes have a conservative 12 MB serialized-document guard below MongoDB's 16 MB BSON ceiling. The effective event size depends on challenge descriptions, files, hints and solve history; the capacity limit alone does not guarantee all possible event workloads fit. Very large events should move to dedicated collections/transactions before raising these bounds. Scores are computed on demand; no large-event load benchmark was performed.

Nonparticipant responses use an explicit metadata allowlist. Student challenge responses strip flags and replace locked hints with `LOCKED`. University-wide notifications contain counts or event metadata only; challenge activity stays in authorized event rooms. Event routes refresh the actor's role, university and ban status from the database, and socket admission rechecks membership after joining to cover concurrent removal.

## Validation

`npm --prefix backend run test:events` builds the backend and runs 15 passing Node integration tests against disposable MongoDB data. Coverage includes concurrent capacity claims, concurrent team joins, four-member limits, duplicate teammate submissions, shared hint purchases, invitation acceptance/decline, HTTP/socket access gates, removal/eviction, captain succession, withdrawal after solving, team-history preservation, static/dynamic scores, first blood, tiebreaks, event closure and both explicit-workshop and missing-type legacy flows.

The test runner uses `mongodb-memory-server`. To use a locally installed MongoDB binary instead of downloading one on Windows:

```powershell
$env:MONGOMS_SYSTEM_BINARY = 'C:/Program Files/MongoDB/Server/8.2/bin/mongod.exe'
npm --prefix backend run test:events
```

Frontend production build and backend TypeScript compilation pass. The repository-wide frontend `tsc --noEmit` still reports 20 pre-existing errors unrelated to this feature. Browser verification uses synthetic users and a disposable database; no production data is changed. Deployment has not been performed.
