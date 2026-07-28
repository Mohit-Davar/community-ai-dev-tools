import { ProjectContent } from "@/app/components/products/content";

export const projectData = [
  {
    category: "Mifos X",
    title: "Web-Based Core Banking Application",
    src: "https://images.unsplash.com/photo-1779518079934-4c60db23e4a0?q=80&w=3540&auto=format&fit=crop",
    content: (
      <ProjectContent
        eyebrow="Core Web UI & Management"
        body={
          <>
            Mifos X is the web reference client for the OpenMF ecosystem. It provides
            financial institutions with an intuitive web application to manage client onboarding,
            loan disbursements, savings accounts, and GL accounting out of the box.
            For developers, it serves as an extensible Angular front-end communicating
            directly with Apache Fineract REST APIs.
          </>
        }
        stats={[
          {
            label: "User role",
            value: "Loan officers, branch managers, accountants",
          },
          {
            label: "Core capability",
            value: "Full operational tracking, loan servicing, & accounting",
          },
          {
            label: "Tech stack",
            value: "Angular, TypeScript, REST APIs",
          },
          {
            label: "Built on",
            value: "Apache Fineract engine",
          },
        ]}
      />
    ),
  },
  {
    category: "Apache Fineract",
    title: "Open Source Core Banking Engine",
    src: "https://images.unsplash.com/photo-1695668548342-c0c1ad479aee?q=80&w=3540&auto=format&fit=crop",
    content: (
      <ProjectContent
        eyebrow="Backend Engine"
        body={
          <>
            Apache Fineract is the open-source backend core banking platform hosted by
            the Apache Software Foundation. It executes business logic for interest accruals,
            loan schedules, portfolio management, multi-tenancy, and double-entry accounting.
            Developers interact with Fineract strictly via secure RESTful APIs to build custom
            fintech apps, while users benefit from a proven, multi-tenant banking foundation.
          </>
        }
        stats={[
          {
            label: "User role",
            value: "System admins, core engine developers",
          },
          {
            label: "Core capability",
            value: "Multi-tenant ledger, loan engines, product rules",
          },
          {
            label: "Tech stack",
            value: "Java, Spring Boot, MySQL/MariaDB",
          },
          {
            label: "Architecture",
            value: "Headless microservice with REST APIs",
          },
        ]}
      />
    ),
  },
  {
    category: "Payment Hub EE",
    title: "Payment Orchestration & Gateway",
    src: "https://images.unsplash.com/photo-1533234944761-2f5337579079?q=80&w=3540&auto=format&fit=crop",
    content: (
      <ProjectContent
        eyebrow="Payment Gateway"
        body={
          <>
            Payment Hub Enterprise Edition (PH-EE) acts as an orchestration bridge connecting
            core banking systems to external payment networks, mobile money, and instant payment switches.
            It enables operations teams to execute G2P bulk disbursements and real-time transfers,
            while providing developers with a modular Zeebe workflow engine and adaptable payment connectors.
          </>
        }
        stats={[
          {
            label: "User role",
            value: "Integrators, payment ops team, fintech builders",
          },
          {
            label: "Core capability",
            value: "Real-time payment routing & G2P disbursements",
          },
          {
            label: "Tech stack",
            value: "Spring Boot, Zeebe Engine, Docker, Kafka",
          },
          {
            label: "Integrates with",
            value: "Mojaloop, M-Pesa, ISO 20022, Open Banking",
          },
        ]}
      />
    ),
  },
  {
    category: "Mifos Gazelle",
    title: "Automated Deployment & Testing Tool",
    src: "https://images.unsplash.com/photo-1457364559154-aa2644600ebb?q=80&w=3540&auto=format&fit=crop",
    content: (
      <ProjectContent
        eyebrow="DevOps & Deployment"
        body={
          <>
            Mifos Gazelle is a Digital Public Infrastructure (DPI) deployment tool designed
            to spin up full-stack OpenMF environments with a single command. It lets
            evaluators, partners, and implementers spin up sandbox environments, while giving
            DevOps engineers pre-configured Kubernetes and containerized packages for rapid
            testing and pilot deployments.
          </>
        }
        stats={[
          {
            label: "User role",
            value: "DevOps, system evaluators, test engineers",
          },
          {
            label: "Core capability",
            value: "One-command deployment of the full Mifos stack",
          },
          {
            label: "Tech stack",
            value: "Bash, Helm, Kubernetes / k3s, Docker",
          },
          {
            label: "Deploys",
            value: "Fineract, Payment Hub EE, Mojaloop",
          },
        ]}
      />
    ),
  },
  {
    category: "Mifos Mobile",
    title: "Self-Service Mobile Banking App",
    src: "https://images.unsplash.com/photo-1681825984459-47ee999da245?q=80&w=3540&auto=format&fit=crop",
    content: (
      <ProjectContent
        eyebrow="Client Mobile App"
        body={
          <>
            Mifos Mobile is a white-label mobile banking application for end-customers
            of institutions using the Mifos platform. End users can view balance details, request
            loans, transfer money, and review transaction histories directly. For app developers,
            it serves as a reference implementation utilizing Fineract’s Self-Service APIs.
          </>
        }
        stats={[
          {
            label: "User role",
            value: "End-customers of financial institutions",
          },
          {
            label: "Core capability",
            value: "Account balances, transfers, loan applications",
          },
          {
            label: "Tech stack",
            value: "Flutter / Android Native, Java/Kotlin",
          },
          {
            label: "Built on",
            value: "Fineract Self-Service REST APIs",
          },
        ]}
      />
    ),
  },
];
