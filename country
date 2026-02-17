(function () {
    'use strict';

    /**
     * Country Filter (Fixed)
     * Based on logic from Studios & Lampa Core
     */

    // Список країн
    const countries_list = [
        {name:'США', code:'US'}, {name:'Велика Британія', code:'GB'},
        {name:'Франція', code:'FR'}, {name:'Німеччина', code:'DE'},
        {name:'Італія', code:'IT'}, {name:'Іспанія', code:'ES'},
        {name:'Польща', code:'PL'}, {name:'Україна', code:'UA'},
        {name:'Індія', code:'IN'}, {name:'Китай', code:'CN'},
        {name:'Японія', code:'JP'}, {name:'Південна Корея', code:'KR'},
        {name:'Туреччина', code:'TR'}, {name:'Канада', code:'CA'}
    ];

    // Налаштування за замовчуванням
    const default_settings = {
        type: 'movie',
        rating: 5,
        sort: 'popularity.desc',
        exclude: []
    };

    // Отримання збережених налаштувань
    function getSettings() {
        let saved = {};
        try {
            saved = JSON.parse(localStorage.getItem('lampa_country_filter')) || {};
        } catch (e) {}
        return Object.assign({}, default_settings, saved);
    }

    // Збереження налаштувань
    function saveSettings(settings) {
        localStorage.setItem('lampa_country_filter', JSON.stringify(settings));
    }

    // --- ЛОГІКА МЕНЮ (НАЛАШТУВАННЯ) ---

    function showFilterMenu() {
        let settings = getSettings();

        const items = [
            { title: 'Тип: ' + (settings.type === 'movie' ? 'Фільми' : 'Серіали'), type: 'type' },
            { title: 'Мінімальний рейтинг: ' + settings.rating, type: 'rating' },
            { title: 'Сортування: ' + (settings.sort.includes('popularity') ? 'Популярні' : 'Нові'), type: 'sort' },
            { title: 'Країни (Виключено: ' + settings.exclude.length + ')', type: 'countries' },
            { title: '🚀 ПОКАЗАТИ РЕЗУЛЬТАТИ', type: 'apply', ghost: true }
        ];

        Lampa.Select.show({
            title: 'Фільтр контенту',
            items: items,
            onSelect: item => {
                switch(item.type){
                    case 'apply': 
                        openFilterResults(settings); 
                        break;
                    case 'type': 
                        settings.type = settings.type === 'movie' ? 'tv' : 'movie'; 
                        saveSettings(settings); 
                        showFilterMenu(); // Оновити меню
                        break;
                    case 'rating':
                        const ratings = Array.from({length: 10}, (_, i) => ({title: i.toString(), value: i, selected: i == settings.rating}));
                        Lampa.Select.show({
                            title:'Рейтинг від', 
                            items: ratings, 
                            onSelect: r=>{ 
                                settings.rating = r.value; 
                                saveSettings(settings); 
                                showFilterMenu();
                            },
                            onBack: showFilterMenu
                        });
                        break;
                    case 'sort':
                        Lampa.Select.show({
                            title:'Сортування',
                            items: [
                                {title:'Популярні', value:'popularity.desc', selected: settings.sort === 'popularity.desc'},
                                {title:'Нові', value: (settings.type === 'movie' ? 'primary_release_date.desc' : 'first_air_date.desc'), selected: settings.sort !== 'popularity.desc'}
                            ],
                            onSelect: s=>{ 
                                settings.sort = s.value; 
                                saveSettings(settings); 
                                showFilterMenu();
                            },
                            onBack: showFilterMenu
                        });
                        break;
                    case 'countries': 
                        selectCountries(settings); 
                        break;
                }
            },
            onBack: () => Lampa.Controller.toggle('menu')
        });
    }

    function selectCountries(settings){
        const items = countries_list.map(c => ({
            title: c.name, 
            code: c.code, 
            selected: settings.exclude.includes(c.code),
            icon: settings.exclude.includes(c.code) ? '<svg... (icon checked) ...>' : '' // Спрощено, Lampa сама ставить галочки
        }));
        
        Lampa.Select.show({
            title: 'Виключити країни',
            items: items,
            onSelect: item => {
                const idx = settings.exclude.indexOf(item.code);
                if(idx > -1) settings.exclude.splice(idx, 1);
                else settings.exclude.push(item.code);
                
                saveSettings(settings);
                // Перемальовуємо, щоб оновити галочки
                selectCountries(settings);
            },
            onBack: showFilterMenu
        });
    }

    // --- ЛОГІКА ВІДОБРАЖЕННЯ (COMPONENT) ---

    function openFilterResults(settings) {
        // Формуємо параметри запиту так само, як у studios.js
        let params = {
            sort_by: settings.sort,
            'vote_average.gte': settings.rating,
            'vote_count.gte': 10, // Фільтр сміття
            language: 'uk-UA' // Примусова українська
        };

        // Додаємо дату для "Нових", щоб не показувати фільми з майбутнього
        if (settings.sort.includes('date')) {
            let date = new Date().toISOString().slice(0,10);
            if (settings.type === 'movie') params['primary_release_date.lte'] = date;
            else params['first_air_date.lte'] = date;
        }

        // Логіка виключення країн
        if (settings.exclude.length) {
            params['without_origin_country'] = settings.exclude.join('|');
        }

        // Відкриваємо компонент категорії
        // Використовуємо стандартний Lampa category компонент, але з нашим URL
        // Це надійніше, ніж створювати свій з нуля
        Lampa.Activity.push({
            url: 'discover/' + settings.type, // Відносний шлях, Lampa сама підставить API домен
            title: 'Результат фільтру',
            component: 'category', // Використовуємо вбудований компонент категорії (сітка)
            page: 1,
            params: params // Передаємо об'єкт параметрів
        });
    }

    // --- ІНІЦІАЛІЗАЦІЯ ---

    function addMenuButton() {
        // Перевіряємо, чи кнопка вже є
        if (Lampa.Menu.find('country_filter')) return;

        const item = {
            title: 'Фільтр країн',
            subtitle: 'Пошук фільмів',
            icon: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 4.5C3 3.67157 3.67157 3 4.5 3H19.5C20.3284 3 21 3.67157 21 4.5V6.5C21 7.32843 20.3284 8 19.5 8H4.5C3.67157 8 3 7.32843 3 6.5V4.5Z" fill="currentColor"/><path d="M3 17.5C3 16.6716 3.67157 16 4.5 16H19.5C20.3284 16 21 16.6716 21 17.5V19.5C21 20.3284 20.3284 21 19.5 21H4.5C3.67157 21 3 20.3284 3 19.5V17.5Z" fill="currentColor"/><path d="M10 10H14V14H10V10Z" fill="currentColor"/></svg>',
            id: 'country_filter',
            action: function() {
                showFilterMenu();
            }
        };

        // Додаємо кнопку в меню. Безпечний метод.
        Lampa.Menu.add(item); 
    }

    if (window.appready) {
        addMenuButton();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type == 'ready') addMenuButton();
        });
    }

})();
