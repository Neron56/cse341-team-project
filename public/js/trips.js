
document.addEventListener('DOMContentLoaded', () => {
    const tripsList = document.getElementById('trips-list');
    const loading = document.getElementById('trips-loading');
    const errorMessage = document.getElementById('trips-error');
    const template = document.getElementById('trip-card-template');
    const regionFilter = document.getElementById('region-filter');
    const seasonFilter = document.getElementById('season-filter');

    let allTrips = [];

    async function loadTrips() {
        try {
            const response = await fetch('/api/trips');

            if (!response.ok) {
                throw new Error('Failed to load trips.');
            }

            allTrips = await response.json();

            populateFilters();
            displayTrips(allTrips);
        } catch (error) {
            errorMessage.textContent = error.message;
            errorMessage.hidden = false;
        } finally {
            loading.hidden = true;
        }
    }

    function populateFilters() {
        const regions = [...new Set(allTrips.map(trip => trip.region))];
        const seasons = [...new Set(allTrips.map(trip => trip.bestSeason))];

        regions.forEach(region => {
            const option = document.createElement('option');
            option.value = region;
            option.textContent = region.charAt(0).toUpperCase() + region.slice(1);
            regionFilter.appendChild(option);
        });

        seasons.forEach(season => {
            const option = document.createElement('option');
            option.value = season;
            option.textContent = season.charAt(0).toUpperCase() + season.slice(1);
            seasonFilter.appendChild(option);
        });
    }

    function displayTrips(trips) {
        tripsList.innerHTML = '';

        if (trips.length === 0) {
            tripsList.textContent = 'No trips found.';
            return;
        }

        trips.forEach(trip => {
            const card = template.content.cloneNode(true);

            card.querySelector('[data-field="name"]').textContent = trip.name;
            card.querySelector('[data-field="region"]').textContent = trip.region;
            card.querySelector('[data-field="startStation"]').textContent = trip.startStation;
            card.querySelector('[data-field="endStation"]').textContent = trip.endStation;
            card.querySelector('[data-field="duration"]').textContent = trip.duration;
            card.querySelector('[data-field="distance"]').textContent = trip.distance;
            card.querySelector('[data-field="bestSeason"]').textContent = `Best in ${trip.bestSeason}`;
            card.querySelector('[data-field="description"]').textContent = trip.description;

            const highlights = card.querySelector('[data-field="highlights"]');

            trip.highlights.forEach(highlight => {
                const tag = document.createElement('span');
                tag.className = 'highlight-tag';
                tag.textContent = highlight;
                highlights.appendChild(tag);
            });

            const detailsLink = card.querySelector('[data-field="details-link"]');
            detailsLink.href = `/trips/${encodeURIComponent(trip.id)}`;

            tripsList.appendChild(card);
        });
    }

    function filterTrips() {
        const selectedRegion = regionFilter.value;
        const selectedSeason = seasonFilter.value;

        const filteredTrips = allTrips.filter(trip => {
            const matchesRegion =
                selectedRegion === 'all' || trip.region === selectedRegion;

            const matchesSeason =
                selectedSeason === 'all' || trip.bestSeason === selectedSeason;

            return matchesRegion && matchesSeason;
        });

        displayTrips(filteredTrips);
    }

    regionFilter.addEventListener('change', filterTrips);
    seasonFilter.addEventListener('change', filterTrips);

    loadTrips();
});
