(function() {
    'use strict';

    // Локалізація
    Lampa.Lang.add({
        location_redirect_title: {
            ru: 'Смена сервера',
            uk: 'Зміна сервера',
            en: 'Change server'
        },
        location_redirect_current: {
            ru: 'Текущий',
            uk: 'Поточний',
            en: 'Current'
        },
        location_redirect_select_domain: {
            ru: 'Выберите домен Lampa',
            uk: 'Виберіть домен Lampa',
            en: 'Choose Lampa domain'
        },
        location_redirect_process: {
            ru: 'Переход на сервер: ',
            uk: 'Перехід на сервер: ',
            en: 'Redirecting to: '
        }
    });

    // 2. Іконка
    var icon_server_redirect = `<svg height="36" viewBox="0 0 38 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 2L24 7L19 12" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M19 24L24 29L19 34" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M14 7H8C5.79086 7 4 8.79086 4 11V25C4 27.2091 5.79086 29 8 29H14" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M24 7H30C32.2091 7 34 8.79086 34 11V25C34 27.2091 32.2091 29 30 29H24" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="19" cy="18" r="3" stroke="white" stroke-width="2"/>
    </svg>`;

    // 3. Функція перевірки та переходу
    function checkRedirect() {
        // Аварійний стоп: якщо в адресі є #no_redirect, ми не перекидаємо
        if (window.location.hash === '#no_redirect') {
            console.log('Redirect cancelled by user (#no_redirect)');
            Lampa.Noty.show('Redirect cancelled (#no_redirect)');
            return;
        }

        var target = Lampa.Storage.get('location_server');
        var current = window.location.hostname;

        // Перевірка: чи є ціль, чи це не "поточний", і чи ми вже не там
        if (target && target !== '-' && target !== '' && current !== target) {
            // Показуємо користувачеві, що відбувається
            Lampa.Noty.show(Lampa.Lang.translate('location_redirect_process') + target);
            
            // Невелика затримка (опціонально), щоб Lampa встигла зберегти стан, якщо треба
            setTimeout(function() {
                window.location.href = 'http://' + target;
            }, 500); 
        }
    }

    // 4. Ініціалізація
    function initPlugin() {
        Lampa.SettingsApi.addComponent({
            component: 'location_redirect',
            name: Lampa.Lang.translate('location_redirect_title'),
            icon: icon_server_redirect
        });

        Lampa.SettingsApi.addParam({
            component: 'location_redirect',
            param: {
                name: 'location_server',
                type: 'select',
                values: {
                    '-': Lampa.Lang.translate('location_redirect_current'),
                    'lampaua.mooo.com': 'lampaua.mooo.com', // Мій сервер
                    'lampa.mx': 'lampa.mx'                  // Офіційний
                },
                default: '-'
            },
            field: {
                name: Lampa.Lang.translate('location_redirect_select_domain'),
                description: 'Автоматичний перехід на обраний домен (HTTP)'
            },
            onChange: function (value) {
                if (value !== '-') {
                    Lampa.Storage.set('location_server', value);
                    checkRedirect();
                } else {
                    // Якщо вибрали "Поточний", очищаємо налаштування для цього домену
                    Lampa.Storage.set('location_server', '-');
                }
            }
        });
        
        // Запускаємо перевірку при завантаженні
        checkRedirect();
    }

    if (window.appready) initPlugin();
    else {
        Lampa.Listener.follow('app', function(e) {
            if (e.type == 'ready') initPlugin();
        });
    }
})();
