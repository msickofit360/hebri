# Synapsek teams

Team and Team Chat open the same collaboration panel. Select **Synapsek teams**
for account-based collaboration, or **Local / self-hosted** for existing rooms
on your computer or your own relay.

## Invite a teammate

1. Sign in through Settings → Billing using your Synapsek account. During the
   browser approval, explicitly allow shared teams. If you signed in before this
   feature was enabled, sign out and sign in again to grant the new permission.
2. Open Team → Synapsek teams, refresh the account, create a team and choose your
   display name. Select the team and its General room.
3. Open team management and create an invitation. Copy the complete link and
   share it privately with one teammate. It expires after 24 hours and accepts
   one new member. Create a separate link for each additional person.
4. The teammate opens the link in their browser, signs into Synapsek and accepts
   the invitation. If an email sign-in opens another tab, return to the original
   invitation tab and check sign-in again.
5. They sign into Hebri with that same account, approve team access and refresh
   the team list. Messages and tasks are shared across both computers and persist
   after restart. An open room checks for updates every five seconds.

No paid plan is required by the collaboration service. During qualification,
only the explicit server test cohort can use it. “Not available” means the
service has not been enabled for this server/account; it does not mean the
desktop needs a Nous subscription.

## Privacy and control

Team membership shares team messages, display names, presence and tasks. It does
not share local chats/files, control another computer, grant Business workspace
access or spend anyone's credits. Synapsek stores shared content; this is not an
end-to-end encrypted room. Keep sensitive information out unless that storage
model is appropriate for your team.

Owners can appoint administrators. Administrators can invite/remove ordinary
members and moderate messages/tasks. Removing a member also revokes all unused
team invitation links; create new links for future teammates. Removal prevents
new server access but cannot recall content someone already downloaded.

Owners can delete the team through the explicit destructive control. Other
members can leave. Deleting the team permanently removes its shared history.
Account switching clears the displayed team data and drafts. Network or
authorization errors clear private content and require an explicit refresh.

## Release status

This is a staged feature paired with Synapsek PR #240 and stacked on Hebri
PR #24. Local checks do not activate the hosted service. Follow the server
`docs/HEBRI_TEAMS_RELEASE.md` for migration, consent, two-account testing,
rollback and signed-installer qualification before customer release.
