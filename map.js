var map = L.map('map', {
    zoomControl: false,
    attributionControl: false
}).setView([55.3962, 86.0727], 12); // Координаты Кемерово

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
}).addTo(map);



// Переменные для хранения маркера местоположения и маршрута
var locationMarker;
var routeControl;
var waypoints = [];
let places = [];

// Функция для получения достопримечательностей из API
async function fetchAttractions() { 
    try {
        const response = await fetch('http://localhost:3000/attractions');
        places = await response.json(); 
        console.log(places); 
        // Добавление маркеров для мест
        places.forEach(function(place) {
            if (place.coordinates && typeof place.coordinates === 'object') {
            console.log(`Изображения для ${place.name}: ${place.image_urls}`);
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


    } catch (error) {
        console.error('Ошибка при загрузке достопримечательностей:', error);
    }
}


fetchAttractions();

// обработчик для кнопки "Информация"
document.getElementById('info-button').onclick = function() {
    const infoPanel = document.getElementById('info-panel');
    const isOpen = infoPanel.classList.contains('open');

    closeAllPanels(); // Закрываем все панели
    if (!isOpen) {
        infoPanel.classList.add('open'); // Открываем только текущую панель, если она была закрыта
    }
};

// обработчик для кнопки "Закрыть" в панели информации
document.getElementById('close-info').onclick = function() {
    document.getElementById('info-panel').classList.remove('open');
};

// Функция для отображения информации о достопримечательности
function showAttractionInfo(place) {
    const infoContent = document.getElementById('info-content');
    let images = [];

    if (place.image_urls && Array.isArray(place.image_urls)) {
        images = place.image_urls.map(url => url.trim());
    } else if (place.image_urls && typeof place.image_urls === 'string') {
        try {
            const imageUrls = JSON.parse(`[${place.image_urls}]`);
            images = imageUrls.map(url => url.trim());
        } catch (error) {
            console.error('Ошибка при обработке image_urls:', error);
        }
    }

    // Создаем HTML-структуру для Swiper
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
        ${swiperHtml}
        <h3>${place.name}</h3>
        <p>Координаты: ${place.coordinates.x}, ${place.coordinates.y}</p>
        <p>${place.description}</p>
    `;

    // Инициализируем Swiper
    new Swiper('.swiper', {
        pagination: {
            el: '.swiper-pagination',
        },
    });
}




document.getElementById('location-button').onclick = function() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            var lat = position.coords.latitude;
            var lon = position.coords.longitude;

            // Удаляем предыдущий маркер местоположения, если он есть
            if (locationMarker) {
                map.removeLayer(locationMarker);
            }
            // Добавляем новый маркер местоположения
            locationMarker = L.marker([lat, lon]).addTo(map)
                .bindPopup('Вы находитесь здесь!')
                .openPopup();
            map.setView([lat, lon], 15); 

            // Заполняем поле "Откуда" координатами местоположения
            document.getElementById('from').value = `${lat}, ${lon}`;
        });
    } else {
        alert('Ваш браузер не поддерживает геолокацию.');
    }
};

// Обработчик для кнопки "Добавить точку"
document.getElementById('add-point').onclick = function() {
    const extraPointName = document.getElementById('extra-point').value.trim();
    const extraPlace = places.find(place => place.name === extraPointName);

    if (extraPlace) {
        waypoints.push(L.latLng(extraPlace.coordinates.y, extraPlace.coordinates.x)); // Добавляем точку в массив
        alert('Точка добавлена: ' + extraPointName);
        document.getElementById('extra-point').value = ''; // Очищаем поле для новой точки
    } else {
        alert('Пожалуйста, введите корректное название достопримечательности.');
    }
};

// Обработчик для кнопки "Построить маршрут"
document.getElementById('build-route').onclick = function() {
    const startName = document.getElementById('from').value.trim();
    const endName = document.getElementById('to').value.trim();

    const startPlace = places.find(place => place.name === startName);
    const endPlace = places.find(place => place.name === endName);

    if (startPlace && endPlace) {
        waypoints.push(L.latLng(endPlace.coordinates.y, endPlace.coordinates.x));

        // Создаем маршрут
        routeControl = L.Routing.control({
            waypoints: [
                L.latLng(startPlace.coordinates.y, startPlace.coordinates.x),
                ...waypoints
            ],
            routeWhileDragging: true,
            createMarker: function() { return null; } 
        }).addTo(map);
        
        // Отображаем информацию о маршруте
        var routeInfo = routeControl.getRouteItineraryHtml(0);
        document.getElementById('route-info').innerHTML = routeInfo;
    } else {
        alert('Пожалуйста, заполните корректные названия для "Откуда" и "Куда".');
    }
};

// Обработчик для кнопки открытия панели маршрута
document.getElementById('route-button').onclick = function() {
    const routePanel = document.getElementById('route-panel');
    const isOpen = routePanel.classList.contains('open');

    closeAllPanels(); // Закрываем все панели
    if (!isOpen) {
        routePanel.classList.add('open'); // Открываем только текущую панель, если она была закрыта
    }
};

function closeAllPanels() {
    document.getElementById('route-panel').classList.remove('open');
    document.getElementById('info-panel').classList.remove('open');
}