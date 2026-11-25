const loadBookings = async () => {
  const list = document.getElementById('bookings-list');
  const loading = document.getElementById('bookings-loading');
  const errorMessage = document.getElementById('bookings-error');
  const empty = document.getElementById('bookings-empty');
  const template = document.getElementById('booking-card-template');
  const previous = document.getElementById('bookings-previous');
  const next = document.getElementById('bookings-next');
  const pageLabel = document.getElementById('bookings-page');
  const summary = document.getElementById('bookings-summary');
  const retry = document.getElementById('bookings-retry');
  const filterForm = document.getElementById('bookings-filters');
  let appliedFilters = {};
  let lastRequestedFilters = {};
  let page = 1;
  let lastRequestedPage = 1;
  let pagination;
  let requestNumber = 0;

  const updateControls = (busy = false) => {
    previous.disabled = busy || !pagination?.hasPreviousPage;
    next.disabled = busy || !pagination?.hasNextPage;
  };

  const fetchPage = async (requestedPage, filters = appliedFilters) => {
    const requestedFilters = { ...filters };
    const currentRequest = ++requestNumber;
    lastRequestedPage = requestedPage;
    lastRequestedFilters = requestedFilters;
    loading.hidden = false;
    errorMessage.hidden = true;
    retry.hidden = true;
    updateControls(true);
    try {
      const query = new URLSearchParams({ page: requestedPage, limit: 10, sort: 'desc' });
      for (const [key, value] of Object.entries(requestedFilters)) {
        if (value) query.set(key, value);
      }
      const response = await fetch(`/api/bookings?${query}`);
      if (!response.ok) {
        if (response.status === 400) {
          const payload = await response.json();
          const failure = new Error(payload.error || 'Invalid booking filters.');
          failure.isQueryError = true;
          throw failure;
        }
        throw new Error(`Failed to load bookings (${response.status})`);
      }
      const { bookings, pagination: metadata } = await response.json();
      if (currentRequest !== requestNumber) return;
      if (!Array.isArray(bookings) || !metadata || !Number.isInteger(metadata.page)
        || !Number.isInteger(metadata.totalItems) || !Number.isInteger(metadata.totalPages)) {
        throw new Error('Invalid bookings response');
      }
      // A concurrent deletion may have removed the last page since it was shown.
      if (requestedPage > 1 && requestedPage > metadata.totalPages) {
        await fetchPage(Math.max(1, metadata.totalPages), requestedFilters);
        return;
      }

      const fragment = document.createDocumentFragment();
      for (const booking of bookings) {
        const card = template.content.cloneNode(true);
        const reference = card.querySelector('[data-field="reference"]');
        reference.textContent = booking.id;
        reference.href = `/trips/confirmation/${encodeURIComponent(booking.id)}`;
        card.querySelector('[data-field="trip"]').textContent = booking.tripId;
        card.querySelector('[data-field="schedule"]').textContent = booking.scheduleId;
        card.querySelector('[data-field="ticket"]').textContent = booking.ticketClass;
        card.querySelector('[data-field="day"]').textContent = booking.selectedDay;
        card.querySelector('[data-field="created"]').textContent =
          `${new Date(booking.createdAt).toLocaleString(undefined, { timeZone: 'UTC' })} UTC`;

        const passengers = card.querySelector('[data-field="passengers"]');
        for (const passenger of booking.passengers) {
          const item = document.createElement('li');
          item.textContent = `${passenger.firstName} ${passenger.lastName} — ${passenger.email} — ${passenger.phone}`;
          passengers.appendChild(item);
        }
        fragment.appendChild(card);
      }

      list.replaceChildren(fragment);
      pagination = metadata;
      appliedFilters = requestedFilters;
      page = metadata.page;
      empty.hidden = metadata.totalItems > 0;
      empty.textContent = Object.keys(appliedFilters).length ? 'No bookings match these filters.' : 'No bookings yet.';
      pageLabel.textContent = metadata.totalPages ? `Page ${page} of ${metadata.totalPages}` : 'No pages';
      const start = metadata.totalItems ? (page - 1) * metadata.limit + 1 : 0;
      const end = start ? start + bookings.length - 1 : 0;
      summary.textContent = `Showing ${start}-${end} of ${metadata.totalItems} bookings`;
    } catch (error) {
      if (currentRequest !== requestNumber) return;
      errorMessage.textContent = error.isQueryError ? error.message : 'Unable to load bookings. Please try again.';
      errorMessage.hidden = false;
      retry.hidden = false;
    } finally {
      if (currentRequest === requestNumber) {
        loading.hidden = true;
        updateControls();
      }
    }
  };

  previous.addEventListener('click', async () => { await fetchPage(page - 1); });
  next.addEventListener('click', async () => { await fetchPage(page + 1); });
  retry.addEventListener('click', async () => { await fetchPage(lastRequestedPage, lastRequestedFilters); });
  filterForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const filters = Object.fromEntries([...new FormData(filterForm)].filter(([, value]) => value));
    if (filters.startDate && filters.endDate && filters.startDate > filters.endDate) {
      ++requestNumber;
      loading.hidden = true;
      retry.hidden = true;
      errorMessage.textContent = 'Start date must not be after end date.';
      errorMessage.hidden = false;
      updateControls();
      return;
    }
    await fetchPage(1, filters);
  });
  document.getElementById('bookings-clear').addEventListener('click', async () => {
    filterForm.reset();
    await fetchPage(1, {});
  });
  await fetchPage(1);
};

loadBookings();
