# Stage 4 SQL to-do

The pages and server routes are set up. Each feature starts working once its query is filled in
`app/queries.js`. Remember: all SQL has to be written by us, not AI.

## How to fill one in

1. Find the slot in `app/queries.js` and replace the `-- TODO(team)` line with your SQL (keep the backticks).
2. Use the params listed above the slot (`:userId`, `:jcat`, etc).
3. Return the column names listed (use `AS` if yours are named differently).
4. Save. `npm run dev` restarts on its own, then refresh the page.
5. The SQL checklist at the bottom of the site marks it as done.

If a query isn't written yet, its button says "Not built yet". If the SQL has an error, the MySQL error
shows up in red on the page and in the terminal.

## Queries

| # | Slot | Used for | Params | Should return | Who |
|---|---|---|---|---|---|
| 1 | `searchObjects` | search (done) | `:keyword` | `JCAT, Name, Type, Status, Owner` | done |
| 2 | `findUser` | sign in | `:username, :password` | `UserID, Username` (0 rows if wrong login) | |
| 3 | `createUser` | create account | `:username, :email, :password` | nothing | |
| 4 | `watchlistList` | READ - My Watchlist tab | `:userId` | `JCAT, Name, Type, Status, AddedAt, Note` | |
| 5 | `watchlistAdd` | CREATE - "+ Watchlist" button | `:userId, :jcat, :note` | nothing | |
| 6 | `watchlistUpdateNote` | UPDATE - Save note | `:userId, :jcat, :note` | nothing | |
| 7 | `watchlistRemove` | DELETE - Remove button | `:userId, :jcat` | nothing | |
| 8 | `callStatsProcedure` | stored procedure button | `:orgCode, :startYear, :endYear` (can be null) | anything | |
| 9 | `runTransaction` | transaction button | `:userId` | anything | |
| 10 | `triggerEffect` | (optional) show the trigger worked | `:userId` | anything | |

Things to watch out for:

- `watchlistAdd`: the server doesn't send `AddedAt`. `:note` is null if left blank.
- `watchlistUpdateNote` / `watchlistRemove`: make sure they only touch that user's row for that object.
- `createUser`: the server doesn't send a `UserID`. After it runs, the server calls `findUser` to log them in.
- `runTransaction`: can be multiple statements separated by `;` (the whole transaction, isolation level
  included). If something fails the server rolls back.
- `callStatsProcedure`: just the part that runs the procedure. The procedure itself goes in the file below.
- If you need different params than what's listed, let whoever's doing the front end know so the
  form/route can be changed.

## Stuff that gets created once in the database

These go in `doc/advanced_programs.sql` (the rubric wants this file in `doc/`), then get run once on
Cloud SQL (Cloud SQL Studio or Workbench). They're not in `queries.js`.

| What | Rubric needs | Where it shows up in the app |
|---|---|---|
| Stored procedure | 2+ advanced queries, control structures (IF/loop/cursor) | Advanced tab, "Run procedure" (#8) |
| Transaction | 2+ advanced queries, isolation level | Advanced tab, "Run transaction" (#9) |
| Trigger | event + IF condition + action (insert/update/delete) | fires on watchlist add/edit/remove, #10 shows it |
| Constraints | PKs/FKs at least, CHECKs are encouraged | errors show in red when input is rejected |

Advanced query = at least two of: joining multiple tables, set operators, GROUP BY, or a subquery that
can't easily be a join. The Stage 3 queries count.

Also: the titles on the Advanced tab ("Orbital statistics", etc.) are placeholders. Change them in
`app/public/index.html` once we know what each thing does.
