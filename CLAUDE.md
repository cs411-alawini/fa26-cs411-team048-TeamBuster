# CLAUDE.md — Space Junk Tracker (CS 411 Team048 TeamBuster)

Instructions for Claude Code (and any other AI assistant) working in this repo.

## HARD RULE: no AI-written database code

This is a graded CS 411 project. The course allows AI only for **front-end work** (UI, styling, page logic, server plumbing) and **forbids AI for any database-related code**. Breaking this rule is an academic-integrity violation for the whole team.

Never write, complete, fix, rewrite, optimize, or suggest the contents of:

- SQL queries: anything in `app/queries.js`, any `.sql` file, any SQL string anywhere
- Stored procedures, triggers, transactions (the SQL inside `START TRANSACTION … COMMIT`), constraints, DDL, or indexes
- Isolation-level choices

That includes small hints like "add a WHERE on Name" or "use LIKE". If a task needs a new query:

1. Add an **empty** entry to `app/queries.js` containing only a `-- TODO(team): …` comment.
2. Above it, write a comment listing the **named parameters** the server will pass (e.g. `:keyword`) and the **column names** the front end expects back.
3. Wire up the route and the page so they work as soon as the team fills in the SQL. `runQuery()` already returns HTTP 501 while a query is empty.
4. Tell the user which query a teammate needs to write.

If a SQL error shows up while debugging, explain what the MySQL error message means in general terms and point to the query. Don't rewrite the query.

Never use an ORM or a query builder (Sequelize, Prisma, Knex, TypeORM, etc.). The project requires raw SQL through `mysql2`.

## Stack (keep it simple; teammates are new to web dev)

- **Backend:** Node.js 20+, Express 4, `mysql2/promise` with one shared pool (`app/db.js`) and `namedPlaceholders: true`
- **Frontend:** plain HTML, CSS, and JavaScript in `app/public/`. No React, no bundler, no build step. A CDN `<script>` is fine for the globe visualization (e.g. globe.gl or three.js)
- **Config:** `app/.env` (git-ignored). Never print, commit, or hard-code credentials
- **Database:** MySQL 8 on GCP Cloud SQL

Run: `cd app && npm install && npm run dev`, then open http://localhost:3000

## How to add a feature

1. SQL slot in `app/queries.js` (empty TODO + params/columns comment, see above)
2. Route in `app/server.js`: validate input, then `runQuery(res, 'name', { params })`. Use `GET` for reads and `POST`/`PUT`/`DELETE` for writes, with JSON bodies.
3. Page or JS in `app/public/`: call it with `fetch()`, and render values with `textContent` (never `innerHTML` with DB data)
4. Keep files small and heavily commented. Explain the code to the person asking, because they need to understand it for the demo.

## Schema (as implemented in Stage 3), for rendering only

- `SpaceObject(JCAT PK, Name, Satcat, LaunchTag→Launch, Type, Parent→SpaceObject.JCAT, Owner→Organization, State→Organization, Manufacturer→Organization, DryMass, Status, DDate, Perigee, Apogee, Inc, OpOrbit)`
- `Launch(LaunchTag PK, Launch_Date, LV_Type, Launch_Site→LaunchSite, Launch_Agency→Organization, LaunchCode)`
- `LaunchSite(SiteCode PK, Type, Name, StateCode→Organization, Parent→Organization, Latitude, Longitude)`
- `Organization(Code PK, UCode, Name, ShortName, Class, Parent→Organization, StateCode→Organization, Latitude, Longitude)`
- `` `User`(UserID PK, Username, Email, Password) ``
- `Watchlist(UserID+JCAT PK, AddedAt, Note)`

## Project requirements to keep in mind (Stage 4)

- CRUD on at least one non-login table (Watchlist is the plan), plus keyword search
- Transaction, stored procedure, trigger, and constraints, all called from the front end (the team writes the SQL; Claude builds the buttons and forms)
- Creative component: interactive 3D Earth with a year slider (~1960 to today) and an altitude slider
- The demo must run the code from the tagged release (`stage.4`). Nothing added after the deadline counts.
