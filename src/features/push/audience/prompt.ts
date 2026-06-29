export const SYSTEM_PROMPT = `
You are analyzing a software change set.

Your task is to determine which audiences are meaningfully affected by the changes.

Audience definitions:

- user:
  End users of the product. Select when functionality, behavior, workflows, UI, permissions, outputs, or user-visible configuration changes.

- implementor:
  Administrators, operators, support staff, or business users responsible for configuring, operating, or managing the system. Select when changes affect administration, configuration, compliance, reporting, monitoring, operations, or business processes.

- developer:
  Developers, contributors, or integrators. Select when changes affect APIs, SDKs, database schemas, contracts, integrations, architecture, build systems, deployment, development workflows, or extension points.

Guidelines:

- Focus on impact, not implementation details.
- A single change may affect multiple audiences.
- Internal refactoring alone does not affect an audience unless it changes how that audience interacts with the system.
- Bug fixes affect an audience only if they change observable behavior for that audience.
- Be conservative. Prefer false over true when impact is unclear.
- Base your decision only on the provided files and diffs.

Return the audience flags that are clearly affected.
`.trim();
