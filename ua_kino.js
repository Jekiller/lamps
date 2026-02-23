(function () {
    'use strict';

    // 1. ДЖЕРЕЛА (Додав актуальні дзеркала та проксі)
    const PROXY = 'https://api.allorigins.win/raw?url='; // Обхід CORS
    const SOURCES = {
        uaserials: { name: 'UASerials', url: 'https://uaserials.my', search: 'https://uaserials.my/index.php?do=search&subaction=search&story={q}' },
        hdrezka:   { name: 'HDRezka',   url: 'https://hdrezka.inc', search: 'https://hdrezka.inc/search/?do=search&subaction=search&q={q}' },
        uakino:    { name: 'UAKino',    url: 'https://uakino-bay.net', search: 'https://uakino-bay.net/index.php?do=search&subaction=search&story={q}' },
        uafix:     { name: 'UAFix',     url: 'https://uafix.net', search: 'https://uafix.net/index.php?do=search&subaction=search&story={q}' },
        uakinogo:  { name: 'UAKinogo',  url: 'https://uakinogo.io', search: 'https://uakinogo.io/search/{q}' },
        uaserial:  { name: 'UASerial',  url: 'https://uaserial.tv', search: 'https://uaserial.tv/search?query={q}' },
        kinotron:  { name: 'KinoTron',  url: 'https://kinotron.tv', search: 'https://kinotron.tv/index.php?do=search', method: 'POST', data: 'do=search&subaction=search&story={q}' }
    };

    // 2. БЕЗПЕЧНИЙ ЛОАДЕР (Виправлення помилки зі скриншоту №2)
    function toggleLoader(status) {
        try {
            if (Lampa.Select && Lampa.Select.loader) Lampa.Select.loader(status);
            else if (Lampa.Activity && Lampa.Activity.loader) Lampa.Activity.loader(status);
        } catch (e) { console.log('Loader notice: system busy'); }
    }

    // 3. ФІЛЬТР УКРАЇНСЬКОЇ МОВИ
    function isUA(text) {
        if (!text) return false;
        const t = text.toLowerCase();
        return (/[ґєії]/.test(t) || t.includes('ua') || t.includes('укр')) && !t.includes('rus');
    }

    // 4. КОМПОНЕНТ ПОШУКУ
    function UASearch() {
        this.network = new Lampa.Reguest();
        
        this.find = function(card, callback) {
            let results = [];
            let query = encodeURIComponent(card.title);
            let sourcesKeys = Object.keys(SOURCES);
            let completed = 0;

            sourcesKeys.forEach(key => {
                let s = SOURCES[key];
                let url = PROXY + encodeURIComponent(s.search.replace('{q}', query));
                
                this.network.silent(url, (html) => {
                    let dom = $('<div/>').html(html);
                    // Адаптивний парсинг під різні сайти
                    dom.find('a').each(function() {
                        let link = $(this).attr('href');
                        let title = $(this).text() || $(this).attr('title');
                        if (link && title && isUA(title)) {
                            if (link.indexOf('/') === 0) link = s.url + link;
                            results.push({ title: title.trim(), url: link, source: s.name });
                        }
                    });
                    
                    completed++;
                    if (completed === sourcesKeys.length) callback(results);
                }, () => {
                    completed++;
                    if (completed === sourcesKeys.length) callback(results);
                });
            });
        };
    }

    // 5. ОСНОВНИЙ КОМПОНЕНТ (Виправлення помилки append)
    function UAOnline(object) {
        var scroll = new Lampa.Scroll({mask: true, over: true});
        var list = $('<div class="online-list"></div>');
        var engine = new UASearch();

        this.create = function () {
            toggleLoader(true);
            engine.find(object.card, (results) => {
                toggleLoader(false);
                if (results.length > 0) {
                    results.forEach(item => {
                        let el = $(`<div class="online-list__item selector"><div class="online-list__title">${item.title}</div><div class="online-list__subtitle">${item.source}</div></div>`);
                        el.on('hover:enter', () => { Lampa.Player.play({ url: item.url, title: item.title }); });
                        list.append(el);
                    });
                } else {
                    list.append('<div class="empty">Нічого не знайдено (UA)</div>');
                }
                // ВАЖЛИВО: додаємо в скролл, а не в activity.append (виправлення помилки №1)
                scroll.append(list);
            });
            return scroll.render();
        };

        this.render = function () { return scroll.render(); };
        this.destroy = function () { scroll.destroy(); list.remove(); };
    }

    // 6. РЕЄСТРАЦІЯ ТА КНОПКИ
    function startPlugin() {
        Lampa.Component.add('ua_online', UAOnline);

        // Ін'єкція кнопки в картку
        setInterval(() => {
            const container = $('.full-start__buttons, .full-start-new__buttons');
            if (container.length > 0 && !container.find('.ua-btn').length) {
                const btn = $('<div class="full-start__button selector ua-btn">🇺🇦 UA Online</div>');
                btn.on('click', () => {
                    Lampa.Activity.push({ title: 'UA Online', component: 'ua_online', card: Lampa.Activity.active().card });
                });
                container.prepend(btn);
            }
        }, 1000);
    }

    if (window.appready) startPlugin();
    else Lampa.Listener.follow('app', (e) => { if (e.type === 'ready') startPlugin(); });
})();
