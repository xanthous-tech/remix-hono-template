# Remix + Astro + Hono Boilerplate

This is a boilerplate for building web applications with [Remix](https://remix.run), [Astro](https://astro.build) and [Hono](https://hono.dev).

## Overview

- Server side tech stack:
  - [x] Hono (for server)
  - [x] TypeScript
  - [x] Postgres
  - [x] DrizzleORM (to operate Postgres)
  - [x] Redis
  - [x] BullMQ (via Redis)
    - [ ] Dashboard (via bull-board)
  - [x] Minio
  - [x] Auth (via Lucia)
  - [x] Stripe
  - [ ] Emails (via Resend / Nodemailer)
    - [x] Magic Link / OTP
- Client side tech stack:
  - [x] TailwindCSS
  - [x] shadcn/ui
  - [x] react-router v7 (aka Remix v3, for app)
  - [x] Astro (for static content)
    - [ ] Landing Page
      - [x] Hero
      - [ ] Features
      - [ ] Pricing
    - [x] Blog
    - [ ] Docs (via Starlight)
- Build system
  - [x] Vite
  - [x] BiomeJS (for linting and formatting)
  - [x] tsup (for server code bundling)

### Why Hono?

Hono has a lot of modern features that make it better than plain express (which I used to use) for building backend for any application (web, native app, API SaaS):

- Runtime agnostic
- Zod validator middleware
- Hono client (no need for tRPC)
- Request Streaming
- OpenAPI documentation generation


### What is BullMQ?

BullMQ is a Redis-backed task queue and it provides a lot of important functionalities for building a scalable application at the start. At the age of AI, it is increasingly common to run long-running tasks in the background (LLM request chains), handle rate-limiting, running I/O intensive tasks in JS via horizontal scaling, and even interop with Python code. BullMQ unlocks all the possibilities.

### Why Remix + Astro?

Remix (React-router v7) is used as SSR frontend for the web-app. Having a server-side rendered application frontend is safer and easier to manage states. At the time of writing, React-router v7 just released and does not have strong static generation library / framework available even if the feature is provided, so Astro is added alongside of the project to handle static content. Landing page, blog and documentations are all handled by Astro.
