import { Documentation, Product, ReleaseNote } from "./types";

// Mock Products
export const products: Product[] = [
  {
    color: "bg-sky-600",
    description:
      "Mifos X is the web reference client for the OpenMF ecosystem, providing financial institutions with onboarding, loan servicing, savings, and accounting workflows.",
    icon: "Package",
    id: "mifos-x",
    name: "Mifos X",
    docsCount: 3,
  },
  {
    category: "Core",
    color: "bg-cyan-600",
    description:
      "Apache Fineract is the open source core banking engine that powers multi-tenant ledger, portfolio management, and REST API-based financial services.",
    icon: "Server",
    id: "apache-fineract",
    name: "Apache Fineract",
    docsCount: 3,
  },
  {
    category: "Enterprise",
    color: "bg-orange-600",
    description:
      "Payment Hub EE is the payment orchestration layer for real-time switch connectivity, bulk G2P disbursements, and modular payment workflows.",
    icon: "CreditCard",
    id: "payment-hub-ee",
    name: "Payment Hub EE",
    docsCount: 3,
  },
  {
    category: "Enterprise",
    color: "bg-violet-600",
    description:
      "Mifos Gazelle automates deployment and testing of the Mifos stack with containerized sandbox environments and Kubernetes-ready deployment workflows.",
    icon: "Cloud",
    id: "mifos-gazelle",
    name: "Mifos Gazelle",
    docsCount: 3,
  },
  {
    category: "Mobile",
    color: "bg-purple-600",
    description:
      "Mifos Mobile is a white-label self-service mobile app for customers to view balances, transfer funds, submit loan requests, and review transactions.",
    icon: "Smartphone",
    id: "mifos-mobile",
    name: "Mifos Mobile",
    docsCount: 3,
  },
  {
    category: "Mobile",
    color: "bg-emerald-600",
    description:
      "Mifos Web App is the Angular-based staff-facing client for Apache Fineract, covering client management, loan origination, and back-office operations.",
    icon: "Globe",
    id: "mifos-web-app",
    name: "Mifos Web App",
    docsCount: 2,
  },
  {
    category: "Core",
    color: "bg-rose-600",
    description:
      "Fineract CN is the cloud-native, microservices-based evolution of the core banking platform, built for horizontal scaling and independent service deployment.",
    icon: "Boxes",
    id: "fineract-cn",
    name: "Fineract CN",
    docsCount: 2,
  },
];

// Mock Documentation
export const documentations: Documentation[] = [
  // ------------------------------------------------------------------ Mifos X
  {
    audience: "Users",
    content:
      "Get started with Mifos X and learn the everyday tasks available in the web client.",
    description:
      "Learn how to navigate Mifos X for onboarding, loan servicing, and account tasks.",
    id: "doc-001",
    lastUpdated: new Date("2024-01-15"),
    productId: "mifos-x",
    readTimeMinutes: 6,
    difficulty: "Beginner",
    contributors: ["afjal-mifos", "nishant-tayal"],
    order: 1,
    sections: [
      {
        content:
          "Mifos X organizes work around clients, groups, and centers. The top navigation switches between Clients, Loans, Savings, and Accounting, while the office selector in the header scopes everything you see to a branch.",
        id: "sec-1",
        title: "Getting Started",
        callouts: [
          {
            type: "tip",
            content:
              "Switch offices from the header dropdown before creating a client — office assignment can't be changed later without an admin transfer.",
          },
        ],
      },
      {
        content:
          "Loan officers typically start each day from the Clients list, review pending approvals in the task queue, and post repayments from a client's loan account page.",
        id: "sec-2",
        title: "Day-to-Day Tasks",
        subsections: [
          {
            id: "sec-2-1",
            title: "Approving a loan application",
            content:
              "Open the client's loan account, review the proposed schedule, and use Approve to move it to the disbursement queue. Approval and disbursement are separate steps by design, so a second reviewer can check terms before funds move.",
          },
          {
            id: "sec-2-2",
            title: "Posting a repayment",
            content:
              "From the loan account, choose Make Repayment, confirm the amount and date, and submit. Mifos X recalculates the outstanding schedule immediately.",
          },
        ],
      },
    ],
    slug: "mifos-x-getting-started",
    source: "Official",
    tags: ["mifos-x", "guide", "users"],
    title: "Getting Started with Mifos X",
    version: "1.0.0",
  },
  {
    audience: "Implementers",
    content:
      "Configure products, roles, and offices before onboarding your first branch onto Mifos X.",
    description:
      "Set up chart of accounts, loan products, and staff roles ahead of a Mifos X rollout.",
    id: "doc-007",
    lastUpdated: new Date("2024-02-02"),
    productId: "mifos-x",
    readTimeMinutes: 9,
    difficulty: "Intermediate",
    contributors: ["ptuomola"],
    order: 2,
    sections: [
      {
        content:
          "Institution setup starts with the org hierarchy: offices, then staff, then roles and permissions. Get this order right, since loan and savings products reference offices at creation time.",
        id: "sec-1",
        title: "Organization Setup",
      },
      {
        content:
          "Loan products define interest method, repayment frequency, and charges. Create a template product per portfolio (e.g. Group Loans, Individual Loans) rather than one-off products per branch.",
        id: "sec-2",
        title: "Configuring Loan Products",
        codeExamples: [
          {
            language: "json",
            code: `{
  "name": "Individual Micro-Loan",
  "shortName": "IML",
  "currencyCode": "INR",
  "principal": 25000,
  "interestRatePerPeriod": 12,
  "interestRateFrequencyType": 2,
  "numberOfRepayments": 12,
  "repaymentEvery": 1,
  "repaymentFrequencyType": 2,
  "amortizationType": 1,
  "interestType": 0,
  "transactionProcessingStrategyCode": "mifos-standard-strategy"
}`,
          },
        ],
      },
    ],
    slug: "mifos-x-implementation-setup",
    source: "Official",
    tags: ["mifos-x", "setup", "implementers"],
    title: "Implementation & Product Setup Guide",
    version: "1.0.0",
  },
  {
    audience: "Contributors",
    content:
      "Understand the Mifos X module structure before submitting your first pull request.",
    description:
      "A contributor's tour of the Mifos X community-app codebase and build process.",
    id: "doc-008",
    lastUpdated: new Date("2024-02-10"),
    productId: "mifos-x",
    readTimeMinutes: 7,
    difficulty: "Advanced",
    contributors: ["Mohit-Davar"],
    order: 3,
    sections: [
      {
        content:
          "The community-app repository is an AngularJS single-page app that talks to Fineract's REST API. Feature modules live under app/, with shared services in the core/ directory.",
        id: "sec-1",
        title: "Codebase Tour",
      },
      {
        content:
          "Run the local dev server against a Fineract sandbox, then use the Grunt build pipeline to lint and bundle before opening a PR.",
        id: "sec-2",
        title: "Local Development",
        codeExamples: [
          {
            language: "bash",
            code: `git clone https://github.com/openMF/community-app.git
cd community-app
npm install
grunt serve` ,
          },
        ],
      },
    ],
    slug: "mifos-x-contributor-guide",
    source: "Community",
    tags: ["mifos-x", "contributors", "setup"],
    title: "Mifos X Contributor Guide",
    version: "1.0.0",
  },

  // ------------------------------------------------------------ Apache Fineract
  {
    audience: "Implementers",
    content:
      "Plan an Apache Fineract deployment, connect your services, and prepare the environment for production use.",
    description:
      "Install and configure Apache Fineract for a reliable core banking deployment.",
    id: "doc-002",
    lastUpdated: new Date("2024-01-20"),
    productId: "apache-fineract",
    readTimeMinutes: 11,
    difficulty: "Intermediate",
    contributors: ["ptuomola", "vorburger"],
    order: 1,
    sections: [
      {
        content:
          "Fineract requires a PostgreSQL or MySQL data store, Java 17, and a tenant database per institution. Review CPU and memory sizing against expected transaction volume before provisioning.",
        id: "sec-1",
        title: "Deployment Checklist",
        callouts: [
          {
            type: "warning",
            content:
              "Undersizing the database tier is the most common cause of slow month-end batch jobs — provision for peak batch load, not average daily load.",
          },
        ],
      },
      {
        content:
          "Tenant configuration maps each institution to its own schema. Data source pooling, scheduler jobs, and API rate limits are all configured per deployment.",
        id: "sec-2",
        title: "Configuration Guide",
        codeExamples: [
          {
            language: "yaml",
            code: `fineract:
  tenant:
    host: localhost
    port: 5432
    username: fineract
    schema-name: fineract_tenants
  events:
    external:
      enabled: true`,
          },
        ],
      },
    ],
    slug: "apache-fineract-deployment",
    source: "Official",
    tags: ["fineract", "deployment", "implementers"],
    title: "Apache Fineract Deployment Guide",
    version: "1.0.0",
  },
  {
    audience: "Users",
    content:
      "Call the Fineract REST API directly to automate account creation, repayments, and reporting.",
    description:
      "A practical walkthrough of authenticating against and calling the Fineract REST API.",
    id: "doc-009",
    lastUpdated: new Date("2024-02-05"),
    productId: "apache-fineract",
    readTimeMinutes: 8,
    difficulty: "Beginner",
    contributors: ["nathanjoshua26"],
    order: 2,
    sections: [
      {
        content:
          "Every API call requires basic auth against a tenant, passed via the Fineract-Platform-TenantId header.",
        id: "sec-1",
        title: "Authentication",
        codeExamples: [
          {
            language: "bash",
            code: `curl -k -X GET \\
  "https://localhost/fineract-provider/api/v1/clients" \\
  -H "Fineract-Platform-TenantId: default" \\
  -u mifos:password`,
          },
        ],
      },
      {
        content:
          "Most write operations follow a consistent create-then-command pattern: create the resource, then post an action command (approve, disburse, activate) to it.",
        id: "sec-2",
        title: "Creating a Loan",
      },
    ],
    slug: "apache-fineract-api-guide",
    source: "Official",
    tags: ["fineract", "api", "users"],
    title: "Calling the Fineract REST API",
    version: "1.0.0",
  },
  {
    audience: "Contributors",
    content:
      "Set up a Fineract development environment and understand the Gradle module layout before contributing.",
    description:
      "Build Fineract from source and understand its module boundaries.",
    id: "doc-010",
    lastUpdated: new Date("2024-02-12"),
    productId: "apache-fineract",
    readTimeMinutes: 10,
    difficulty: "Advanced",
    contributors: ["awasum", "vorburger"],
    order: 3,
    sections: [
      {
        content:
          "Fineract is a multi-module Gradle project. `fineract-provider` hosts the core API, while domain logic is split across modules like `fineract-loan` and `fineract-savings`.",
        id: "sec-1",
        title: "Module Layout",
      },
      {
        content:
          "Run the bundled Docker Compose stack for a local Postgres instance, then boot Fineract with the Gradle bootRun task.",
        id: "sec-2",
        title: "Local Build",
        codeExamples: [
          {
            language: "bash",
            code: `git clone https://github.com/apache/fineract.git
cd fineract
docker compose -f fineract-provider/docker-compose.yml up -d
./gradlew bootRun`,
          },
        ],
      },
    ],
    slug: "apache-fineract-contributor-guide",
    source: "Community",
    tags: ["fineract", "contributors", "gradle"],
    title: "Building Fineract from Source",
    version: "1.0.0",
  },

  // ------------------------------------------------------------- Payment Hub EE
  {
    audience: "Implementers",
    content:
      "Use Payment Hub EE to connect your payment channels, route transactions, and monitor orchestration flows.",
    description:
      "Understand the orchestration model and integration points for Payment Hub EE.",
    id: "doc-003",
    lastUpdated: new Date("2024-01-22"),
    productId: "payment-hub-ee",
    readTimeMinutes: 9,
    difficulty: "Intermediate",
    contributors: ["ngenongsi"],
    order: 1,
    sections: [
      {
        content:
          "Payment Hub EE routes transactions through configurable channels and connectors, each representing an external payment scheme such as a national switch or mobile money provider.",
        id: "sec-1",
        title: "Architecture Overview",
      },
      {
        content:
          "New integrations are defined as connector configs referencing an ISO 20022 or ISO 8583 message template, plus a routing rule that maps incoming channel traffic to the right workflow.",
        id: "sec-2",
        title: "Integration Setup",
      },
    ],
    slug: "payment-hub-ee-setup",
    source: "Official",
    tags: ["payments", "integration", "implementers"],
    title: "Payment Hub EE Integration Guide",
    version: "1.0.0",
  },
  {
    audience: "Users",
    content:
      "Monitor live payment orchestration flows and investigate failed transactions from the Payment Hub EE dashboard.",
    description:
      "Day-to-day operations for monitoring and troubleshooting payment flows.",
    id: "doc-011",
    lastUpdated: new Date("2024-02-08"),
    productId: "payment-hub-ee",
    readTimeMinutes: 5,
    difficulty: "Beginner",
    contributors: ["ngenongsi"],
    order: 2,
    sections: [
      {
        content:
          "The Zeebe-backed workflow dashboard shows every in-flight transaction instance, its current step, and any incidents raised by a failed task.",
        id: "sec-1",
        title: "Monitoring Transactions",
        callouts: [
          {
            type: "info",
            content:
              "An incident doesn't mean funds moved incorrectly — it means a step needs manual review before the workflow continues.",
          },
        ],
      },
    ],
    slug: "payment-hub-ee-operations",
    source: "Official",
    tags: ["payments", "operations", "users"],
    title: "Monitoring & Troubleshooting Payments",
    version: "1.0.0",
  },
  {
    audience: "Contributors",
    content:
      "Extend Payment Hub EE with a new connector for an additional payment scheme.",
    description:
      "Add support for a new payment channel by writing a custom connector.",
    id: "doc-012",
    lastUpdated: new Date("2024-02-14"),
    productId: "payment-hub-ee",
    readTimeMinutes: 12,
    difficulty: "Advanced",
    contributors: ["ngenongsi"],
    order: 3,
    sections: [
      {
        content:
          "A connector is a Spring Boot module implementing the transformer interface for a given message format, deployed alongside the core Zeebe workflow engine.",
        id: "sec-1",
        title: "Connector Architecture",
      },
    ],
    slug: "payment-hub-ee-connector-dev",
    source: "Community",
    tags: ["payments", "contributors", "connectors"],
    title: "Writing a Custom Connector",
    version: "1.0.0",
  },

  // -------------------------------------------------------------- Mifos Gazelle
  {
    audience: "Contributors",
    content:
      "Run a Mifos Gazelle environment locally and contribute improvements through the deployment workflows.",
    description:
      "Set up a sandbox environment with Mifos Gazelle and start contributing.",
    id: "doc-004",
    lastUpdated: new Date("2024-01-24"),
    productId: "mifos-gazelle",
    readTimeMinutes: 8,
    difficulty: "Intermediate",
    contributors: ["vidakovic", "tenzin-ngodup"],
    order: 1,
    sections: [
      {
        content:
          "Gazelle uses k3d to spin up a lightweight Kubernetes cluster, then Helm charts to deploy Fineract, the web-app, and supporting services in one command.",
        id: "sec-1",
        title: "Sandbox Setup",
        codeExamples: [
          {
            language: "bash",
            code: `git clone https://github.com/openMF/mifos-gazelle.git
cd mifos-gazelle
./gazelle.sh --install`,
          },
        ],
      },
      {
        content:
          "Once the stack is up, use the included Tiltfile to iterate on any service with automatic rebuild-and-redeploy on file change.",
        id: "sec-2",
        title: "Validation Workflow",
      },
    ],
    slug: "mifos-gazelle-contributor-guide",
    source: "Community",
    tags: ["gazelle", "sandbox", "contributors"],
    title: "Contributing with Mifos Gazelle",
    version: "1.0.0",
  },
  {
    audience: "Implementers",
    content:
      "Deploy the full Mifos stack to a staging Kubernetes cluster using Gazelle's production-oriented Helm values.",
    description:
      "Move from a local Gazelle sandbox to a shared staging deployment.",
    id: "doc-013",
    lastUpdated: new Date("2024-02-16"),
    productId: "mifos-gazelle",
    readTimeMinutes: 10,
    difficulty: "Advanced",
    contributors: ["vidakovic"],
    order: 2,
    sections: [
      {
        content:
          "Staging deployments override the default Helm values to add persistent volumes, ingress TLS, and resource limits appropriate for shared infrastructure.",
        id: "sec-1",
        title: "Staging Overrides",
      },
    ],
    slug: "mifos-gazelle-staging-deployment",
    source: "Community",
    tags: ["gazelle", "kubernetes", "implementers"],
    title: "Deploying Gazelle to Staging",
    version: "1.0.0",
  },
  {
    audience: "Users",
    content:
      "A quick tour of what ships in a default Gazelle install and how to reach each service.",
    description:
      "Find your way around the services Gazelle deploys out of the box.",
    id: "doc-014",
    lastUpdated: new Date("2024-02-18"),
    productId: "mifos-gazelle",
    readTimeMinutes: 4,
    difficulty: "Beginner",
    contributors: ["tenzin-ngodup"],
    order: 3,
    sections: [
      {
        content:
          "A default install exposes the Fineract API, the web-app, and a Postgres admin console, each behind its own ingress path printed at the end of setup.",
        id: "sec-1",
        title: "What Gets Installed",
      },
    ],
    slug: "mifos-gazelle-service-tour",
    source: "Community",
    tags: ["gazelle", "users", "overview"],
    title: "Tour of a Default Gazelle Install",
    version: "1.0.0",
  },

  // --------------------------------------------------------------- Mifos Mobile
  {
    audience: "Users",
    content:
      "Use Mifos Mobile to review balances, transfer funds, request loans, and track activity from your phone.",
    description:
      "A simple guide to the everyday workflows available in Mifos Mobile.",
    id: "doc-005",
    lastUpdated: new Date("2024-01-18"),
    productId: "mifos-mobile",
    readTimeMinutes: 5,
    difficulty: "Beginner",
    contributors: ["ishankhanna", "avikbasak93"],
    order: 1,
    sections: [
      {
        content:
          "Sign in with the credentials issued by your institution, then use the bottom navigation to move between Accounts, Loans, and More.",
        id: "sec-1",
        title: "Getting Around the App",
      },
      {
        content:
          "Transfers, loan requests, and support tickets are all initiated from the account detail screen for the relevant savings or loan account.",
        id: "sec-2",
        title: "Common Actions",
      },
    ],
    slug: "mifos-mobile-user-guide",
    source: "Official",
    tags: ["mobile", "users", "self-service"],
    title: "Mifos Mobile User Guide",
    version: "3.0.0",
  },
  {
    audience: "Contributors",
    content:
      "Contribute to Mifos Mobile by reviewing UI patterns, testing flows, and improving the self-service experience.",
    description:
      "A contributor-focused overview of the mobile app architecture and workflow areas.",
    id: "doc-006",
    lastUpdated: new Date("2024-01-25"),
    productId: "mifos-mobile",
    readTimeMinutes: 9,
    difficulty: "Intermediate",
    contributors: ["avikbasak93"],
    order: 2,
    sections: [
      {
        content:
          "The app is built with Kotlin and Jetpack Compose, organized by feature module under `feature/`, with shared UI components in `core/ui`.",
        id: "sec-1",
        title: "Codebase Overview",
      },
      {
        content:
          "New screens should ship with a Compose preview and at least one instrumented test covering the primary user action.",
        id: "sec-2",
        title: "Testing Checklist",
      },
    ],
    slug: "mifos-mobile-contributor-guide",
    source: "Community",
    tags: ["mobile", "contributors", "testing"],
    title: "Mifos Mobile Contributor Guide",
    version: "1.0.0",
  },
  {
    audience: "Implementers",
    content:
      "White-label Mifos Mobile with your institution's branding, endpoints, and feature flags before release.",
    description:
      "Configure Mifos Mobile's branding and backend connection for your institution.",
    id: "doc-015",
    lastUpdated: new Date("2024-02-20"),
    productId: "mifos-mobile",
    readTimeMinutes: 7,
    difficulty: "Intermediate",
    contributors: ["ishankhanna"],
    order: 3,
    sections: [
      {
        content:
          "Branding lives in a single `config.xml` resource file covering colors, logo, and app name, so a rebrand doesn't require touching application code.",
        id: "sec-1",
        title: "Branding Configuration",
      },
    ],
    slug: "mifos-mobile-white-label-guide",
    source: "Official",
    tags: ["mobile", "implementers", "branding"],
    title: "White-labeling Mifos Mobile",
    version: "1.0.0",
  },

  // ------------------------------------------------------------- Mifos Web App
  {
    audience: "Users",
    content:
      "Navigate the Mifos Web App for daily branch operations, from client search to loan disbursement.",
    description:
      "An operator's guide to the Angular-based Mifos Web App.",
    id: "doc-016",
    lastUpdated: new Date("2024-02-22"),
    productId: "mifos-web-app",
    readTimeMinutes: 6,
    difficulty: "Beginner",
    contributors: ["vorburger"],
    order: 1,
    sections: [
      {
        content:
          "The left-hand menu mirrors Fineract's domain model: Institution, Clients, Products, and Accounting each get a dedicated section.",
        id: "sec-1",
        title: "Navigating the App",
      },
    ],
    slug: "mifos-web-app-user-guide",
    source: "Official",
    tags: ["web-app", "users", "guide"],
    title: "Mifos Web App User Guide",
    version: "1.0.0",
  },
  {
    audience: "Contributors",
    content:
      "Set up the Angular development environment for Mifos Web App and understand its module structure.",
    description:
      "Build and extend the Mifos Web App frontend.",
    id: "doc-017",
    lastUpdated: new Date("2024-02-24"),
    productId: "mifos-web-app",
    readTimeMinutes: 8,
    difficulty: "Intermediate",
    contributors: ["vorburger"],
    order: 2,
    sections: [
      {
        content:
          "Feature modules are lazy-loaded by route, each pairing an Angular Material UI with a typed service layer that wraps the Fineract API.",
        id: "sec-1",
        title: "Module Structure",
        codeExamples: [
          {
            language: "bash",
            code: `git clone https://github.com/openMF/web-app.git
cd web-app
npm install
npm start`,
          },
        ],
      },
    ],
    slug: "mifos-web-app-contributor-guide",
    source: "Community",
    tags: ["web-app", "contributors", "angular"],
    title: "Mifos Web App Contributor Guide",
    version: "1.0.0",
  },

  // --------------------------------------------------------------- Fineract CN
  {
    audience: "Implementers",
    content:
      "Understand the microservice topology of Fineract CN before planning a deployment.",
    description:
      "A deployment-oriented overview of Fineract CN's service architecture.",
    id: "doc-018",
    lastUpdated: new Date("2024-02-26"),
    productId: "fineract-cn",
    readTimeMinutes: 9,
    difficulty: "Advanced",
    contributors: ["myrle-krantz"],
    order: 1,
    sections: [
      {
        content:
          "Each domain — customer, deposit, teller, accounting — runs as an independent Spring Boot service behind a shared Eureka registry and gateway.",
        id: "sec-1",
        title: "Service Topology",
      },
    ],
    slug: "fineract-cn-architecture",
    source: "Official",
    tags: ["fineract-cn", "architecture", "implementers"],
    title: "Fineract CN Architecture Overview",
    version: "1.0.0",
  },
  {
    audience: "Contributors",
    content:
      "Bring up the full Fineract CN service mesh locally for development.",
    description:
      "Local environment setup for contributing to Fineract CN services.",
    id: "doc-019",
    lastUpdated: new Date("2024-02-28"),
    productId: "fineract-cn",
    readTimeMinutes: 10,
    difficulty: "Advanced",
    contributors: ["myrle-krantz"],
    order: 2,
    sections: [
      {
        content:
          "Services must start in dependency order — identity and Eureka first, then customer and accounting, then anything depending on them.",
        id: "sec-1",
        title: "Bring-up Order",
      },
    ],
    slug: "fineract-cn-local-dev",
    source: "Community",
    tags: ["fineract-cn", "contributors", "setup"],
    title: "Local Development for Fineract CN",
    version: "1.0.0",
  },
];

// Mock Release Notes (used across the hub's changelog surfaces)
export const releaseNotes: ReleaseNote[] = [
  {
    id: "rn-001",
    productId: "apache-fineract",
    version: "1.9.0",
    date: new Date("2024-01-10"),
    summary:
      "Adds external events for loan lifecycle actions and improves batch job performance for month-end interest posting.",
  },
  {
    id: "rn-002",
    productId: "mifos-mobile",
    version: "3.0.0",
    date: new Date("2024-01-05"),
    summary:
      "Migrates the app to Jetpack Compose and introduces biometric login.",
  },
  {
    id: "rn-003",
    productId: "mifos-gazelle",
    version: "0.9.0",
    date: new Date("2024-01-02"),
    summary:
      "Switches the default cluster provisioner to k3d and adds a one-command teardown script.",
  },
];
