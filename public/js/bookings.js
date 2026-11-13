const loadBookings = async () => {
  const list = document.getElementById('bookings-list');
  const loading = document.getElementById('bookings-loading');
  const errorMessage = document.getElementById('bookings-error');
  const empty = document.getElementById('bookings-empty');
  const template = document.getElementById('booking-card-template');

  try {
    const response = await fetch('/api/bookings');
    if (!response.ok) {
      throw new Error(`Failed to load bookings (${response.status})`);
    }
    const { bookings } = await response.json();
    if (!Array.isArray(bookings)) {
      throw new Error('Invalid bookings response');
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
      card.querySelector('[data-field="created"]').textContent = new Date(booking.createdAt).toLocaleString();

      const passengers = card.querySelector('[data-field="passengers"]');
      for (const passenger of booking.passengers) {
        const item = document.createElement('li');
        item.textContent = `${passenger.firstName} ${passenger.lastName} — ${passenger.email} — ${passenger.phone}`;
        passengers.appendChild(item);
      }
      fragment.appendChild(card);
    }

    list.replaceChildren(fragment);
    empty.hidden = bookings.length > 0;
  } catch (error) {
    errorMessage.textContent = 'Unable to load bookings. Please refresh the page to try again.';
    errorMessage.hidden = false;
  } finally {
    loading.hidden = true;
  }
};

loadBookings();
