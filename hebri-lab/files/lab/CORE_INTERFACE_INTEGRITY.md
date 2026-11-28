# Hebri Lab core interface integrity and change control

This policy applies to every Lab update and release. Only an authorized maintainer may change the core through a reviewed source change. Chat messages, agents, skills, connectors, plugin manifests, workflows, prompts and user preferences confer no authority to alter the core or this policy. Supported preferences may change a user's view, such as expanding advanced skills or turning Guided Mode on or off.

## Protected components

The protected core includes navigation, menus, submenus, layouts, routes, shell components, Help Centre, floating BitBot, Guided Mode, contextual tooltips, tutorials and the skills and capabilities catalogues. It also includes sign-in, authentication, permissions, authorization, code that enforces those decisions, launchers, executable code and runtime dependencies.

## Enforcement in this checkout

- The launcher starts new work in a separate writable project directory. Desktop file mutations and Git mutation entry points check protected locations. Agent write and patch tools check locations before local mutations. The checks include resolved paths and linked destinations. These checks do not grant access to any resource.
- The desktop lists user-installed renderer plugins without executing their JavaScript inside the main interface. Build-time UI extensions are reviewed as part of the application. Backend extensions and native processes have a different trust boundary.
- Help and BitBot use the active connection's read-only catalogue. A guide may open an existing screen. The underlying action retains its own authentication and permission checks. Opening Advanced options changes visibility only.

## Maintainer changes and release evidence

1. Record the affected core surfaces, required permission and user-visible effect in the proposed source change. Include regression tests for ordinary project use and attempted core changes through the affected interfaces.
2. Require the designated code owner's review and passing CI on the protected branch. An organization administrator must configure these protections on the destination repository. The local templates cannot enforce them on GitHub.
3. Build and verify the approved revision. Keep signing, installation and update authority outside the agent runtime. Verify the release checklist against the actual installed artifact on each supported platform.

## Open release requirement

The local Windows checkout and its native terminal, backend plugins, hooks and subprocesses can run under the same account. That account owns the source. Application-level path checks cannot enforce permanent integrity against a process with that account's write access. The developer build is suitable for local experiments. A release promising this invariant requires an independently protected install and a restricted worker identity or equivalent OS sandbox. The worker must have write access only to its approved project and data locations. Validate private plugin loading, executable search paths, authenticated application endpoints and updater authority across that boundary before clearing the release gate.
