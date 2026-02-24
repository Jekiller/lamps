(function() {
    'use strict';

    // 1. Унікальний ключ, щоб не конфліктувати з системними налаштуваннями Lampa
    var STORAGE_KEY = 'plugin_custom_domain_target_v2';

    // 2. Локалізація
    Lampa.Lang.add({
        location_redirect_title: { ru: 'Смена сервера', uk: 'Зміна сервера', en: 'Change server' },
        location_redirect_current: { ru: 'Текущий', uk: 'Поточний', en: 'Current' },
        location_redirect_select_domain: { ru: 'Выберите домен Lampa', uk: 'Виберіть домен Lampa', en: 'Choose Lampa domain' },
        location_redirect_process: { ru: 'Переход на: ', uk: 'Перехід на: ', en: 'Redirecting to: ' }
    });

    var icon_server_redirect = `<svg height="36" viewBox="0 0 38 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 2L24 7L19 12" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M19 24L24 29L19 34" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M14 7H8C5.79086 7 4 8.79086 4 11V25C4 27.2091 5.79086 29 8 29H14" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M24 7H30C32.2091 7 34 8.79086 34 11V25C34 27.2091 32.2091 29 30 29H24" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="19" cy="18" r="3" stroke="white" stroke-width="2"/>
    </svg>`;

    // 3. Функція перевірки
    function checkRedirect() {
        // Аварійний стоп користувача
        if (window.location.hash === '#no_redirect') return;

        // ЗАХИСТ 1: Якщо ми щойно прийшли з редіректу - зупиняємось
        if (window.location.href.indexOf('redirect_done=1') !== -1) {
            console.log('Redirect finished cleanly. Stopping to prevent loop.');
            return;
        }

        var target = Lampa.Storage.get(STORAGE_KEY);
        if (!target || target === '-') return; // Якщо нічого не обрано - нічого не робимо

        var current = (window.location.hostname || '').toLowerCase().replace(/^www\./i, '');
        var cleanTarget = target.toLowerCase().replace(/^www\./i, '');

        if (current !== cleanTarget) {
            // ЗАХИСТ 2: Блокування циклу перезавантажень
            if (sessionStorage.getItem('anti_loop_lock') === cleanTarget) {
                console.log('Infinite loop prevented by sessionStorage lock.');
                Lampa.Noty.show('Помилка: не вдалося закріпитись на новому сервері.');
                Lampa.Storage.set(STORAGE_KEY, '-'); // Скидаємо налаштування на "Поточний"
                return;
            }

            // Ставимо "замок" перед тим, як перейти
            sessionStorage.setItem('anti_loop_lock', cleanTarget);

            Lampa.Noty.show(Lampa.Lang.translate('location_redirect_process') + target);
            
            setTimeout(function() {
                // ЗАХИСТ 3: Додаємо мітку в URL для нового сервера
                window.location.href = 'https://' + target + '/?redirect_done=1';
            }, 500); 
        } else {
            // Ми на правильному сайті! Знімаємо замок.
            sessionStorage.removeItem('anti_loop_lock');
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
                name: STORAGE_KEY, // Використовуємо новий безпечний ключ
                type: 'select',
                values: {
                    '-': Lampa.Lang.translate('location_redirect_current'),
                    'lampaua.mooo.com': 'lampaua.mooo.com',
                    'lampa.mx': 'lampa.mx'
                },
                default: '-'
            },
            field: {
                name: Lampa.Lang.translate('location_redirect_select_domain'),
                description: 'Автоматичний перехід на обраний домен'
            },
            onChange: function (value) {
                Lampa.Storage.set(STORAGE_KEY, value);
                checkRedirect();
            }
        });
        
        // Запускаємо через пів секунди після старту
        setTimeout(checkRedirect, 500);
    }

    if (window.appready) initPlugin();
    else {
        Lampa.Listener.follow('app', function(e) {
            if (e.type == 'ready') initPlugin();
        });
    }
})();
