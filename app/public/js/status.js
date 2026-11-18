// status.js - database status in the header + the SQL checklist in the footer

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
    const done = slots.filter((s) => s.written).length;
    summary.textContent = `SQL checklist: ${done}/${slots.length} done`;
    list.replaceChildren();
    for (const slot of slots) {
      const li = document.createElement('li');
      li.textContent = `[${slot.written ? 'x' : ' '}] ${slot.name}`;
      li.className = slot.written ? 'done' : 'todo';
      list.append(li);
    }
    // leave it open until everything is written
    document.getElementById('checklist').open = done < slots.length;
  } catch (err) {
    summary.textContent = `SQL checklist (couldn't load: ${err.message})`;
  }
}

checkDatabase();
loadChecklist();
