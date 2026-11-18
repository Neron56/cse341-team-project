# Week 04 Reflection — Draft

This draft follows the headings in the [official Week 04 reflection template](https://byui-cse.github.io/cse341-ww-course-v2/week04/week04-reflection-template.txt). Replace or update pending evidence before Canvas submission.

## Selected Feature Set

**1. Which feature set were you assigned to complete?**

The official Week 04 assignment lists Feature Set 1, Core Authentication, and makes it the first dependency. I implemented it as a proposed contribution in my personal fork. I do not have evidence that the team formally assigned Feature Set 1 to me, so I am not claiming a confirmed team assignment.

## Links

**2. Walk-through video link:** Pending. No Loom recording exists yet.

**3. GitHub Issue links:** [Proposed Core Authentication Issue #1](https://github.com/kennethduron/cse341-kizuna-rail-w04/issues/1).

**4. Pull Request links:** [Draft PR #6](https://github.com/Neron56/cse341-team-project/pull/6). It targets upstream `main`, is not merged or team-approved; GitHub currently reports `mergeable: true` and `mergeable_state: blocked` while it remains a draft.

## Implementation Reflection

**5. Why did you decide to split your Feature Set into multiple GitHub issues or use a single issue?**

I used one Issue because registration, login/logout, role checks, sessions, and the minimal admin dashboard form one authentication vertical slice. Splitting them would separate components that need to agree on the same user schema and session contract.

**6. What is one thing you know after completing the assignment that you did not know beforehand?**

I learned to regenerate the session identifier after successful login so a pre-login session ID cannot simply be carried forward. The same session cookie can identify a user to both EJS routes and same-origin API calls, while the server still needs separate response behavior for page and API guards.

**7. What did you do to make your pull requests clear and ready for teammate review?**

The branch is isolated from `main`, and the spec lists routes, statuses, data, and acceptance tests. Draft PR #6 links Issue #1, documents decisions and verified checks, and lists the W03 integration limitation. Lint and the full test suite passed; I also checked registration, login, customer denial, admin access, and logout over local HTTP in a browser using MongoDB Memory Server. The PR is still a draft, has not been reviewed, and has no video link yet.

## Team Process

**8. What is one thing you can do personally to help your team be more effective next week?**

I can identify the integration baseline and route/file ownership before starting a cross-cutting feature, then keep the Issue and PR description aligned with that baseline. This contribution does not replace the pending team ownership and merge decisions.

## Evidence status

- Confirmed: current official W04 assignment and learning activity were retrieved; fork Issue #1, Draft PR #6, feature branch, implementation, lint result, 7 passing tests, isolated role import, and local browser/HTTP flow exist. GitHub currently reports the PR mergeable against current `main`.
- Pending: Loom recording/link, team feature-owner confirmation, W03 integration review, and teammate review. GitHub's mergeable status against `main` does not prove a conflict-free integration with the unmerged W03 PRs.
- Not claimed: formal team assignment, team review, deployment, Loom URL, or any result that has not been observed.
