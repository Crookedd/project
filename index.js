const carousel = document.querySelector('.carousel');
const items = Array.from(document.querySelectorAll('.carousel-item'));

let activeIndex = Math.floor(items.length / 2); // Центральный элемент

function updateCarousel() {
    items.forEach((item, index) => {
        const offset = index - activeIndex;
        item.style.transform = `translateX(${offset * 240}px)`; // Выравнивание по оси X
        item.classList.remove('active', 'inactive'); // Убираем классы
        if (index === activeIndex) {
            item.classList.add('active'); // Центральный элемент
        } else {
            item.classList.add('inactive'); // Боковые элементы
        }
    });
}

updateCarousel();

items.forEach((item, index) => {
    item.addEventListener('click', () => {
        if (index === activeIndex) {
            const link = item.getAttribute('data-link');
            if (link) window.location.href = link; // Переход на страницу
        } else {
            activeIndex = index; // Новый центральный элемент
            updateCarousel();
        }
    });
});

window.addEventListener('scroll', () => {
    const header = document.querySelector('header');
    if (window.scrollY > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});




