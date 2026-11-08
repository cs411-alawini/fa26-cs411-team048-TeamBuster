// queries.js - ALL SQL for the app lives here.
//
// ============================================================
//  COURSE RULE: SQL in this file must be written by the team.
//  AI tools (ChatGPT, Claude, Copilot...) may NOT write or edit
//  SQL queries, stored procedures, or triggers. (CS 411 syllabus VII.A)
// ============================================================
//
// How it works:
//   - Each entry is a SQL string. server.js runs it and sends the rows to the page.
//   - Leave an entry as '' and its endpoint will answer "not written yet" (HTTP 501)
//     instead of crashing.
//   - Use named parameters (e.g. :keyword). Never paste user input into the string
//     yourself - the parameter system escapes it and prevents SQL injection.

module.exports = {
  // GET /api/objects/search?q=<text>
  //
  // Parameters available:
  //   :keyword  -> exactly what the user typed in the search box (e.g. "starlink")
  //
  // The results table on the home page shows these columns, so SELECT
  // them with these names (use AS to rename if needed):
  //   JCAT, Name, Type, Status, Owner
  //
  // Tip: add a LIMIT (e.g. 50) so a short keyword doesn't return 70,000 rows.
  searchObjects: `
    SELECT DISTINCT JCAT, Name, Type, Status, Owner
    FROM Organization
    NATURAL JOIN SpaceObject
    NATURAL JOIN LaunchSite
    WHERE name LIKE CONCAT('%', :keyword, '%')
    ORDER BY name
    LIMIT 50
  `,
};
