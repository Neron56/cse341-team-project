document.querySelectorAll('button[data-station-id]').forEach((button) => {
  const panel = document.getElementById(button.getAttribute('aria-controls'));
  let pending = false;
  let loaded = false;

  const loadStation = async () => {
    if (pending || loaded) return;
    pending = true;
    panel.setAttribute('aria-busy', 'true');
    panel.textContent = 'Loading station details...';

    try {
      const response = await fetch(`/api/stations/${encodeURIComponent(button.dataset.stationId)}`);
      if (response.status === 404) {
        panel.textContent = 'Station details are not available.';
        return;
      }
      if (!response.ok) throw new Error('Station request failed');

      const { station } = await response.json();
      if (!station || ['id', 'name', 'prefecture', 'region'].some((field) => typeof station[field] !== 'string')
        || (station.description !== undefined && typeof station.description !== 'string')
        || (station.facilities !== undefined && (!Array.isArray(station.facilities)
          || station.facilities.some((facility) => typeof facility !== 'string')))) {
        throw new Error('Invalid station response');
      }

      const content = document.createDocumentFragment();
      const name = document.createElement('h3');
      name.textContent = station.name;
      content.appendChild(name);
      for (const text of [
        `Prefecture: ${station.prefecture}`,
        `Region: ${station.region}`,
        `Facilities: ${station.facilities?.length ? station.facilities.join(', ') : 'None listed'}`,
        station.description || 'No description available.'
      ]) {
        const paragraph = document.createElement('p');
        paragraph.textContent = text;
        content.appendChild(paragraph);
      }
      panel.replaceChildren(content);
      loaded = true;
    } catch {
      panel.textContent = 'Unable to load station details. ';
      const retry = document.createElement('button');
      retry.type = 'button';
      retry.textContent = 'Retry';
      retry.addEventListener('click', loadStation);
      panel.appendChild(retry);
    } finally {
      pending = false;
      panel.setAttribute('aria-busy', 'false');
    }
  };

  button.addEventListener('click', async () => {
    const open = button.getAttribute('aria-expanded') !== 'true';
    button.setAttribute('aria-expanded', String(open));
    panel.hidden = !open;
    if (open) await loadStation();
  });
});
