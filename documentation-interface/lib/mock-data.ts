import { Documentation, Product, ReleaseNote } from "./types";

// Mock Products
export const products: Product[] = [
  {
    category: "Core",
    color: "bg-sky-600",
    description:
      "Mifos X is the web reference client for the OpenMF ecosystem, providing financial institutions with onboarding, loan servicing, savings, and accounting workflows.",
    icon: "Package",
    id: "mifos-x",
    name: "Mifos X",
    shortName: "Mifos X",
  },
  {
    category: "Core",
    color: "bg-cyan-600",
    description:
      "Apache Fineract is the open source core banking engine that powers multi-tenant ledger, portfolio management, and REST API-based financial services.",
    icon: "Server",
    id: "apache-fineract",
    name: "Apache Fineract",
    shortName: "Fineract",
  },
  {
    category: "Enterprise",
    color: "bg-orange-600",
    description:
      "Payment Hub EE is the payment orchestration layer for real-time switch connectivity, bulk G2P disbursements, and modular payment workflows.",
    icon: "CreditCard",
    id: "payment-hub-ee",
    name: "Payment Hub EE",
    shortName: "Payment Hub",
  },
  {
    category: "Enterprise",
    color: "bg-violet-600",
    description:
      "Mifos Gazelle automates deployment and testing of the Mifos stack with containerized sandbox environments and Kubernetes-ready deployment workflows.",
    icon: "Cloud",
    id: "mifos-gazelle",
    name: "Mifos Gazelle",
    shortName: "Gazelle",
  },
  {
    category: "Mobile",
    color: "bg-purple-600",
    description:
      "Mifos Mobile is a white-label self-service mobile app for customers to view balances, transfer funds, submit loan requests, and review transactions.",
    icon: "Smartphone",
    id: "mifos-mobile",
    name: "Mifos Mobile",
    shortName: "Mobile",
  },
];

// Mock Documentation
export const documentations: Documentation[] = [
  {
    audience: "Users",
    content: "Get started with Mifos X and learn the everyday tasks available in the web client.",
    description: "Learn how to navigate Mifos X for onboarding, loan servicing, and account tasks.",
    id: "doc-001",
    lastUpdated: new Date("2024-01-15"),
    productId: "mifos-x",
    sections: [
      {
        content: "Overview of the main navigation and workflow steps.",
        id: "sec-1",
        title: "Getting Started",
      },
      {
        content: "A short guide to common actions for loan officers and branch staff.",
        id: "sec-2",
        title: "Day-to-Day Tasks",
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
    content: "Plan an Apache Fineract deployment, connect your services, and prepare the environment for production use.",
    description: "Install and configure Apache Fineract for a reliable core banking deployment.",
    id: "doc-002",
    lastUpdated: new Date("2024-01-20"),
    productId: "apache-fineract",
    sections: [
      {
        content: "Review prerequisites, service dependencies, and environment requirements.",
        id: "sec-1",
        title: "Deployment Checklist",
      },
      {
        content: "Reference the configuration points for tenants, data stores, and integrations.",
        id: "sec-2",
        title: "Configuration Guide",
      },
    ],
    slug: "apache-fineract-deployment",
    source: "Official",
    tags: ["fineract", "deployment", "implementers"],
    title: "Apache Fineract Deployment Guide",
    version: "1.0.0",
  },
  {
    audience: "Implementers",
    content: "Use Payment Hub EE to connect your payment channels, route transactions, and monitor orchestration flows.",
    description: "Understand the orchestration model and integration points for Payment Hub EE.",
    id: "doc-003",
    lastUpdated: new Date("2024-01-22"),
    productId: "payment-hub-ee",
    sections: [
      {
        content: "Learn how gateway connectors, workflows, and events fit together.",
        id: "sec-1",
        title: "Architecture Overview",
      },
      {
        content: "Follow the supported setup steps for new payment integrations.",
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
    audience: "Contributors",
    content: "Run a Mifos Gazelle environment locally and contribute improvements through the deployment workflows.",
    description: "Set up a sandbox environment with Mifos Gazelle and start contributing.",
    id: "doc-004",
    lastUpdated: new Date("2024-01-24"),
    productId: "mifos-gazelle",
    sections: [
      {
        content: "Prepare the environment and launch the deployment stack.",
        id: "sec-1",
        title: "Sandbox Setup",
      },
      {
        content: "Use the included tooling to validate changes and test deployments.",
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
    audience: "Users",
    content: "Use Mifos Mobile to review balances, transfer funds, request loans, and track activity from your phone.",
    description: "A simple guide to the everyday workflows available in Mifos Mobile.",
    id: "doc-005",
    lastUpdated: new Date("2024-01-18"),
    productId: "mifos-mobile",
    sections: [
      {
        content: "Sign in, review account details, and check your latest transactions.",
        id: "sec-1",
        title: "Getting Around the App",
      },
      {
        content: "Follow the steps for transfers, loan requests, and account support.",
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
    content: "Contribute to Mifos Mobile by reviewing UI patterns, testing flows, and improving the self-service experience.",
    description: "A contributor-focused overview of the mobile app architecture and workflow areas.",
    id: "doc-006",
    lastUpdated: new Date("2024-01-25"),
    productId: "mifos-mobile",
    sections: [
      {
        content: "Understand the app structure and main UI modules.",
        id: "sec-1",
        title: "Codebase Overview",
      },
      {
        content: "Check the recommended testing steps for new mobile features.",
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
];
