// status.js - the "DB connected" pill in the header, and the
// "Team SQL checklist" at the bottom of the page (which query slots are still empty).

async function checkDatabase() {
  const statusEl = document.getElementById('db-status');
  try {
    const data = await api('/api/health');
    statusEl.textContent = `DB connected: ${data.name}`;
    statusEl.className = 'status status-ok';
  } catch (err) {
    statusEl.textContent = 'DB not connected';
    statusEl.title = err.message;
    statusEl.className = 'status status-bad';
  }
}

async function loadChecklist() {
  const list = document.getElementById('checklist-list');
  const summary = document.getElementById('checklist-summary');
  try {
    const slots = await api('/api/queries');
    const done = slots.filter((slot) => slot.written).length;
    summary.textContent = `Team SQL checklist: ${done} of ${slots.length} queries written`;
    list.replaceChildren();
    for (const slot of slots) {
      const li = document.createElement('li');
      li.textContent = `${slot.written ? '✅' : '⬜'} ${slot.name}`;
      li.className = slot.written ? 'done' : 'todo';
      list.append(li);
    }
    // Open the checklist automatically while there's still work left.
    document.getElementById('checklist').open = done < slots.length;
  } catch (err) {
    summary.textContent = `Team SQL checklist (could not load: ${err.message})`;
  }
}

checkDatabase();
loadChecklist();
