
document.addEventListener('DOMContentLoaded', () => {
    const tripsList = document.getElementById('admin-trips-list');
    const loading = document.getElementById('admin-trips-loading');
    const errorMessage = document.getElementById('admin-trips-error');
    const successMessage = document.getElementById('admin-trips-success');
    const tripForm = document.getElementById('trip-form');
    const formContainer = document.getElementById('trip-form-container');

    const startSelect = document.getElementById('trip-start');
    const endSelect = document.getElementById('trip-end');
    const scheduleSelect = document.getElementById('trip-schedule');

    let allTrips = [];
    let allStations = [];

    // Display success and error messages.
    function showMessage(message, isError = false) {
        errorMessage.hidden = true;
        successMessage.hidden = true;

        if (isError) {
            errorMessage.textContent = message;
            errorMessage.hidden = false;
        } else {
            successMessage.textContent = message;
            successMessage.hidden = false;
        }
    }

    // Load available stations from the Stations API.
    async function loadStations() {
        try {
            const response = await fetch('/api/stations');

            if (!response.ok) {
                throw new Error('Could not load stations.');
            }

            const data = await response.json();
            allStations = data.stations || [];

            [startSelect, endSelect].forEach(select => {
                select.innerHTML = '';

                const placeholder = document.createElement('option');
                placeholder.value = '';
                placeholder.textContent = 'Select a station';
                select.appendChild(placeholder);

                allStations.forEach(station => {
                    const option = document.createElement('option');
                    option.value = station.id;
                    option.textContent = station.name;
                    select.appendChild(option);
                });
            });
        } catch (error) {
            console.error(error);
            showMessage(
                'Stations are not available yet. Check that the Stations API is connected.',
                true
            );
        }
    }

    // Get a station name using its ID.
    function getStationName(stationId) {
        const station = allStations.find(item => item.id === stationId);
        return station ? station.name : stationId || 'Not available';
    }

    // Make sure an existing station ID can still be selected.
    function selectExistingStation(select, stationId) {
        if (!stationId) return;

        const exists = Array.from(select.options).some(
            option => option.value === stationId
        );

        if (!exists) {
            const option = document.createElement('option');
            option.value = stationId;
            option.textContent = stationId;
            select.appendChild(option);
        }

        select.value = stationId;
    }

    // Load schedules belonging to the selected trip.
    async function loadSchedules(tripId) {
        scheduleSelect.innerHTML = '';

        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = 'Select a schedule';
        scheduleSelect.appendChild(placeholder);

        try {
            const response = await fetch(
                `/api/trips/${encodeURIComponent(tripId)}/schedules`
            );

            if (!response.ok) {
                throw new Error('Could not load schedules.');
            }

            const schedules = await response.json();

            schedules.forEach(schedule => {
                const option = document.createElement('option');
                option.value = schedule.id;

                const days = (schedule.daysOfWeek || []).join(', ');

                option.textContent =
                    `${schedule.departureTime || 'Departure time unavailable'} - ` +
                    `${schedule.arrivalTime} (${days})`;

                scheduleSelect.appendChild(option);
            });

            if (schedules.length === 0) {
                placeholder.textContent = 'No schedules available';
            }
        } catch (error) {
            console.error(error);
            placeholder.textContent = 'Schedules are not available yet';
        }
    }

    // Load all trips.
    async function loadTrips() {
        try {
            const response = await fetch('/api/trips');

            if (!response.ok) {
                throw new Error('Failed to load trips.');
            }

            allTrips = await response.json();
            displayTrips(allTrips);
        } catch (error) {
            showMessage(error.message, true);
        } finally {
            loading.hidden = true;
        }
    }

    // Display trips in the table.
    function displayTrips(trips) {
        tripsList.innerHTML = '';

        if (trips.length === 0) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');

            cell.colSpan = 5;
            cell.textContent = 'No trips found.';

            row.appendChild(cell);
            tripsList.appendChild(row);
            return;
        }

        trips.forEach(trip => {
            const row = document.createElement('tr');

            const nameCell = document.createElement('td');
            nameCell.textContent = trip.name;

            const regionCell = document.createElement('td');
            regionCell.textContent = trip.region;

            const startCell = document.createElement('td');
            startCell.textContent = getStationName(trip.startStation);

            const endCell = document.createElement('td');
            endCell.textContent = getStationName(trip.endStation);

            const actionsCell = document.createElement('td');

            const editButton = document.createElement('button');
            editButton.type = 'button';
            editButton.textContent = 'Edit';

            editButton.addEventListener('click', () => {
                editTrip(trip);
            });

            const deleteButton = document.createElement('button');
            deleteButton.type = 'button';
            deleteButton.textContent = 'Delete';

            deleteButton.addEventListener('click', () => {
                deleteTrip(trip.id);
            });

            actionsCell.appendChild(editButton);
            actionsCell.appendChild(deleteButton);

            row.appendChild(nameCell);
            row.appendChild(regionCell);
            row.appendChild(startCell);
            row.appendChild(endCell);
            row.appendChild(actionsCell);

            tripsList.appendChild(row);
        });
    }

    // Prepare the form for editing an existing trip.
    async function editTrip(trip) {
        document.getElementById('trip-form-title').textContent = 'Edit Trip';

        document.getElementById('trip-id').value = trip.id;
        document.getElementById('trip-name').value = trip.name;
        document.getElementById('trip-description').value =
            trip.description;
        document.getElementById('trip-region').value = trip.region;
        document.getElementById('trip-duration').value = trip.duration;
        document.getElementById('trip-distance').value = trip.distance;
        document.getElementById('trip-season').value = trip.bestSeason;

        document.getElementById('trip-highlights').value =
            (trip.highlights || []).join('\n');

        document.getElementById('trip-months').value =
            (trip.operatingMonths || []).join(',');

        selectExistingStation(startSelect, trip.startStation);
        selectExistingStation(endSelect, trip.endStation);

        formContainer.hidden = false;

        await loadSchedules(trip.id);
    }

    // Save changes to an existing trip.
    tripForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const id = document.getElementById('trip-id').value;

        if (!id) {
            showMessage('Please select an existing trip to edit.', true);
            return;
        }

        const tripData = {
            name: document.getElementById('trip-name').value.trim(),
            description: document.getElementById('trip-description').value.trim(),
            region: document.getElementById('trip-region').value.trim(),
            startStation: startSelect.value,
            endStation: endSelect.value,
            duration: document.getElementById('trip-duration').value.trim(),
            distance: Number(document.getElementById('trip-distance').value),
            bestSeason: document.getElementById('trip-season').value.trim(),
            highlights: document.getElementById('trip-highlights').value
                .split('\n')
                .map(item => item.trim())
                .filter(Boolean),
            operatingMonths: document.getElementById('trip-months').value
                .split(',')
                .map(item => Number(item.trim()))
                .filter(Number.isInteger)
        };

        try {
            const response = await fetch(
                `/api/trips/${encodeURIComponent(id)}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(tripData)
                }
            );

            if (!response.ok) {
                throw new Error('Failed to update trip. Check administrator access.');
            }

            showMessage('Trip updated successfully.');
            formContainer.hidden = true;
            tripForm.reset();

            await loadTrips();
        } catch (error) {
            showMessage(error.message, true);
        }
    });

    // Delete a trip.
    async function deleteTrip(id) {
        const confirmed = window.confirm(
            'Are you sure you want to delete this trip?'
        );

        if (!confirmed) return;

        try {
            const response = await fetch(
                `/api/trips/${encodeURIComponent(id)}`,
                { method: 'DELETE' }
            );

            if (!response.ok) {
                throw new Error('Failed to delete trip. Check administrator access.');
            }

            showMessage('Trip deleted successfully.');
            await loadTrips();
        } catch (error) {
            showMessage(error.message, true);
        }
    }

    // Adding new trips is not part of the connected API yet.
    document.getElementById('show-add-trip').addEventListener('click', () => {
        showMessage(
            'Adding new trips is not connected yet. Select an existing trip to edit.',
            true
        );
    });

    // Cancel editing.
    document.getElementById('cancel-trip').addEventListener('click', () => {
        formContainer.hidden = true;
        tripForm.reset();
    });

    // Load stations before displaying trips.
    async function initializePage() {
        await loadStations();
        await loadTrips();
    }

    initializePage();
});
