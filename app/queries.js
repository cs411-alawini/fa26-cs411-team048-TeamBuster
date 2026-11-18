// queries.js - all the SQL for the app goes here.
//
// Course rule: the SQL in this file has to be written by us, not AI.
//
// - Each entry is a SQL string that server.js runs.
// - If an entry only has a -- TODO comment, its feature shows "Not built yet"
//   instead of crashing. The checklist at the bottom of the site shows which are left.
// - Use the named params listed above each one (:userId etc). Don't put user
//   input into the string directly.
// - Return the column names listed. Use AS if your column is named differently.
//
// More details in doc/QUERIES_TODO.md

module.exports = {
  // ---------- search (done) ----------

  // GET /api/objects/search?q=...
  // params:  :keyword  (whatever was typed in the search box)
  // returns: JCAT, Name, Type, Status, Owner
  searchObjects: `
    SELECT DISTINCT JCAT, Name, Type, Status, Owner
    FROM SpaceObject
    WHERE name LIKE CONCAT('%', :keyword, '%')
    ORDER BY name
    LIMIT 50
  `,

  // ---------- account ----------

  // sign in (also runs right after createUser to log the new user in)
  // params:  :username, :password
  // returns: UserID, Username
  //          1 row if the login is right, 0 rows if it's wrong
  findUser: `
    -- TODO(team): sign in lookup
  `,

  // create account form
  // params:  :username, :email, :password
  // returns: nothing
  // note: the server doesn't send a UserID, so the new user needs to get one some other way
  createUser: `
    -- TODO(team): create account
  `,

  // ---------- watchlist CRUD ----------

  // READ - the My Watchlist tab
  // params:  :userId
  // returns: JCAT, Name, Type, Status, AddedAt, Note
  watchlistList: `
    -- TODO(team): get one user's watchlist
  `,

  // CREATE - "+ Watchlist" button on the search results
  // params:  :userId, :jcat, :note  (note is null if left blank)
  // returns: nothing
  // note: AddedAt isn't sent by the server
  watchlistAdd: `
    -- TODO(team): add to watchlist
  `,

  // UPDATE - Save button next to a note
  // params:  :userId, :jcat, :note
  // returns: nothing
  // should only change this user's row for this object
  watchlistUpdateNote: `
    -- TODO(team): update a note
  `,

  // DELETE - Remove button
  // params:  :userId, :jcat
  // returns: nothing (if 0 rows are affected the page says it wasn't in the watchlist)
  // should only remove this user's row for this object
  watchlistRemove: `
    -- TODO(team): remove from watchlist
  `,

  // ---------- advanced stuff (Advanced tab) ----------
  // The CREATE PROCEDURE / CREATE TRIGGER / constraint code goes in
  // doc/advanced_programs.sql and gets run once on the database.
  // These slots are just what the buttons run.

  // stored procedure - "Run procedure" button
  // params:  :orgCode, :startYear, :endYear  (any of them can be null if left blank)
  // returns: any columns. if the procedure returns multiple result sets,
  //          each one shows up as its own table
  callStatsProcedure: `
    -- TODO(team): run the stored procedure
  `,

  // transaction - "Run transaction" button
  // params:  :userId
  // returns: any columns, one table per SELECT
  // this one can have multiple statements separated by ; (the whole transaction,
  // isolation level included). if anything fails the server rolls it back.
  // also copy the final version into doc/advanced_programs.sql
  runTransaction: `
    -- TODO(team): the transaction
  `,

  // (optional) "Show what the trigger did" button - lets us show the trigger
  // worked during the demo. can skip if the trigger's effect is visible somewhere else.
  // params:  :userId
  // returns: any columns
  triggerEffect: `
    -- TODO(team, optional): show the trigger's effect
  `,
};
