(() => {
  const panel = document.querySelector('#view-followups');
  const segment = panel.querySelector('#sample-segment');
  const group = panel.querySelector('#sample-group');
  const outcome = panel.querySelector('#sample-outcome');
  const download = panel.querySelector('#sample-export');
  const summary = panel.querySelector('.sample-summary');
  const body = panel.querySelector('tbody');
  const fields = ['Order_ID', 'Segment', 'Issue', 'Outcome', 'Delivery_days'];
  let records = [];
  let visible = [];

  document.querySelector('#open-sample').addEventListener('click', () => {
    document.querySelector('#nav-followups').click();
    panel.querySelector('select').focus();
  });

  function render() {
    visible = records.filter(row =>
      (!segment.value || row.Segment === segment.value) &&
      (!group.value || row.Issue === group.value) &&
      (!outcome.value || row.Outcome === outcome.value)
    );
    const successes = visible.filter(row => row.Outcome === 'Resolved').length;
    const rate = visible.length ? (100 * successes / visible.length).toFixed(1) + '%' : '—';
    summary.textContent = visible.length + ' of ' + records.length + ' simulated cases · Resolution rate in selection: ' + rate;
    const rows = visible.map(row => {
      const tr = document.createElement('tr');
      for (const field of fields) tr.insertCell().textContent = row[field];
      return tr;
    });
    if (!rows.length) {
      const tr = document.createElement('tr');
      const cell = tr.insertCell();
      cell.colSpan = fields.length;
      cell.textContent = 'No records match these filters.';
      rows.push(tr);
    }
    body.replaceChildren(...rows);
    download.disabled = !visible.length;
  }

  download.addEventListener('click', () => {
    const escape = value => '"' + String(value).replaceAll('"', '""') + '"';
    const lines = [fields, ...visible.map(row => fields.map(key => row[key]))];
    const csv = lines.map(line => line.map(escape).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['\uFEFF', csv], {type: 'text/csv;charset=utf-8'}));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'followups-selection.csv';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  });

  async function load() {
    try {
      const response = await fetch('data/followups.json');
      if (!response.ok) throw Error('Unavailable');
      records = await response.json();
      for (const [select, field] of [[segment, 'Segment'], [group, 'Issue'], [outcome, 'Outcome']]) {
        for (const value of [...new Set(records.map(row => row[field]))].sort()) {
          select.add(new Option(value, value));
        }
        select.addEventListener('change', render);
      }
      render();
    } catch {
      summary.textContent = 'The sample could not be loaded. Refresh to try again.';
    }
  }
  load();
})();
