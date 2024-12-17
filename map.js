var map = L.map('map', {
    zoomControl: false,
    attributionControl: false
}).setView([55.3962, 86.0727], 12); // Координаты Кемерово

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {}).addTo(map);

// Переменные для хранения маркера местоположения и маршрута
var locationMarker;
var routeControl;
let places = [];

async function fetchAttractions() { 
    try {
        const response = await fetch('http://localhost:3000/attractions');
        places = await response.json(); 
        console.log(places);

        places.forEach(function(place) {
            if (place.coordinates && typeof place.coordinates === 'object') {
                const coords = place.coordinates;
                const marker = L.marker([parseFloat(coords.y), parseFloat(coords.x)]).addTo(map)
                    .bindPopup(place.name)
                    .on('click', function() {
                        closeAllPanels(); // Закрываем все панели
                        showAttractionInfo(place); // Показываем информацию о месте
                        document.getElementById('info-panel').classList.add('open'); // Открываем панель информации
                    });
            }
        });

        filterAttractions('all');
    } catch (error) {
        console.error('Ошибка при загрузке достопримечательностей:', error);
    }
}

fetchAttractions();

document.getElementById('info-button').onclick = function() {
    const infoPanel = document.getElementById('info-panel');
    const isOpen = infoPanel.classList.contains('open');
    closeAllPanels(); 
    if (!isOpen) {
        infoPanel.classList.add('open');
    }
};


document.getElementById('attraction-type').addEventListener('change', function() {
    const selectedType = this.value;
    filterAttractions(selectedType);
});

function filterAttractions(type) {
    const infoPanel = document.getElementById('info-content');
    infoPanel.innerHTML = ''; 

    const filteredPlaces = (type === 'all') ? places : places.filter(place => place.type === type);

    filteredPlaces.forEach(function(place) {
        const attractionItem = document.createElement('div');
        attractionItem.classList.add('attraction-item');
        const imagesHtml = place.image_urls.slice(0, 2).map(url => `
            <img src="${url}" alt="${place.name}" class="attraction-image">
        `).join('');

        attractionItem.innerHTML = `
            <div class="attraction-summary">
                ${imagesHtml}
                <h4>${place.name}</h4>
                <p>${place.description.split('.')[0]}...</p>
            </div>
        `;

        attractionItem.onclick = function() {
            showAttractionInfo(place);
        };

        infoPanel.appendChild(attractionItem);
    });
}

function showAttractionInfo(place) {
    const infoContent = document.getElementById('info-content');
    let images = place.image_urls && Array.isArray(place.image_urls) ? place.image_urls.map(url => url.trim()) : [];

    let swiperHtml = `
        <div class="swiper">
            <div class="swiper-wrapper">
    `;
    images.forEach(url => {
        swiperHtml += `
            <div class="swiper-slide">
                <img src="${url}" alt="${place.name}" class="attraction-image">
            </div>
        `;
    });
    swiperHtml += `
            </div>
            <div class="swiper-pagination"></div>
        </div>
    `;

    infoContent.innerHTML = `
        <button id="back-button" class="back-button">Назад</button>
        ${swiperHtml}
        <h3>${place.name}</h3>
        <p>Координаты: ${place.coordinates.x}, ${place.coordinates.y}</p>
        <p>${place.description}</p>
    `;

    // Обработчик для кнопки "Назад"
    document.getElementById('back-button').onclick = function () {
        filterAttractions('all'); // Возврат к списку всех достопримечательностей
    };

    new Swiper('.swiper', {
        pagination: {
            el: '.swiper-pagination',
        },
    });

    document.getElementById('info-panel').classList.add('open');
}

document.getElementById('location-button').onclick = function() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            var lat = position.coords.latitude;
            var lon = position.coords.longitude;

            if (locationMarker) {
                map.removeLayer(locationMarker);
            }

            locationMarker = L.marker([lat, lon]).addTo(map)
                .bindPopup('Вы находитесь здесь!')
                .openPopup();
            map.setView([lat, lon], 15);

            document.getElementById('from').value = `${lat}, ${lon}`;
        });
    } else {
        alert('Ваш браузер не поддерживает геолокацию.');
    }
};

let waypoints = [];

document.addEventListener('DOMContentLoaded', function () {
    const container = document.getElementById('extra-points-container');
    const placeholder = document.getElementById('add-point-placeholder');

    document.getElementById('add-point-button').onclick = function () {
        const newInput = document.createElement('input');
        newInput.type = 'text';
        newInput.placeholder = 'Введите название достопримечательности';
        newInput.classList.add('extra-point-input');

        container.insertBefore(newInput, placeholder);
        container.appendChild(placeholder);

        newInput.focus();
    };
});

document.getElementById('build-route').onclick = function () {
    waypoints = [];
    const startName = document.getElementById('from').value.trim();
    const endName = document.getElementById('to').value.trim();
    const extraInputs = document.querySelectorAll('.extra-point-input');

    let startLatLon;
    if (startName.match(/^[-+]?\d+(\.\d+)?\,\s*[-+]?\d+(\.\d+)?$/)) {
        const coords = startName.split(',').map(coord => parseFloat(coord.trim()));
        startLatLon = L.latLng(coords[0], coords[1]);
    } else {
        const startPlace = places.find(place => place.name === startName);
        if (startPlace) {
            startLatLon = L.latLng(startPlace.coordinates.y, startPlace.coordinates.x);
        }
    }

    if (startLatLon) {
        waypoints.push(startLatLon);
    } else {
        alert('Пожалуйста, введите корректное местоположение или достопримечательность в поле "Откуда".');
        return;
    }

    const endPlace = places.find(place => place.name === endName);
    if (endPlace) {
        waypoints.push(L.latLng(endPlace.coordinates.y, endPlace.coordinates.x));
    }

    extraInputs.forEach(input => {
        const extraName = input.value.trim();
        const extraPlace = places.find(place => place.name === extraName);

        if (extraPlace) {
            waypoints.push(L.latLng(extraPlace.coordinates.y, extraPlace.coordinates.x));
        } else {
            console.warn(`Место "${extraName}" не найдено!`);
        }
    });

    if (routeControl) {
        map.removeControl(routeControl);
    }

    if (waypoints.length > 1) {
        routeControl = L.Routing.control({
            waypoints: waypoints,
            routeWhileDragging: true,
            createMarker: function () { return null; }
        }).addTo(map);
    } else {
        alert('Пожалуйста, заполните корректные названия всех точек маршрута.');
    }
};

document.getElementById('clear-routes-button').onclick = function() {
    if (routeControl) {
        map.removeControl(routeControl);
        routeControl = null;
    }

    if (locationMarker) {
        map.removeLayer(locationMarker);
        locationMarker = null;
    }

    waypoints = [];

    document.getElementById('from').value = '';
    document.getElementById('to').value = '';
    document.querySelectorAll('.extra-point-input').forEach(input => input.remove());
};

document.getElementById('route-button').onclick = function() {
    const routePanel = document.getElementById('route-panel');
    const isOpen = routePanel.classList.contains('open');
    closeAllPanels();
    if (!isOpen) {
        routePanel.classList.add('open');
    }
};

function closeAllPanels() {
    document.getElementById('route-panel').classList.remove('open');
    document.getElementById('info-panel').classList.remove('open');
}
