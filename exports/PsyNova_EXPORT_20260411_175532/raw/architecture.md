# Architecture Overview

## Scope

PsyNova is an online-only virtual psychology clinic platform for Quebec.

## High-Level Components

- WordPress public site (`frontend/wordpress`)
- Patient portal frontend (`frontend/patient-portal`)
- NestJS backend API (`backend/src`)
- PostgreSQL data layer (`database`)
- Third-party integrations (`integrations`)
- Infrastructure definitions (`infrastructure`)
- Legal and compliance assets (`legal`)

## Core Functional Domains

- Identity and access management
- Appointment booking and scheduling
- Secure messaging
- Clinical records and document handling
- Billing and payment orchestration
- Telehealth session integration
- AI assistant (non-diagnostic support only)

## Non-Functional Priorities

- Security by default
- Privacy by design
- Bilingual clinical operations (EN/FR)
- Scalable cloud deployment in Canada
- Accessibility (WCAG 2.1)

## Data and Privacy Guardrails

- Data residency target: Canada region (`ca-central-1`)
- Encrypt data in transit and at rest
- Role-based access controls for clinicians and staff
- Audit logging for sensitive operations
- Minimize personally identifiable information exposure
