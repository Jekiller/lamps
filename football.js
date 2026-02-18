(function () {
    'use strict';

    // Налаштування
    var BASE_URL = 'https://livetv873.me';
    // Використовуємо AllOrigins, він стабільніший для текстових даних
    var PROXY_Помилка `[object Object]` означає, що плагін намагається виAPI = 'https://api.allorigins.win/get?url=';

    function Component(object) {
        var comp = new Lampa.InteractionMain(object);

        comp.create = function () {
вести технічну інформацію про помилку, але не може перетворити її на текст. Швидше за все, це **4            this.activity.loader(true);
            return this.render();
        };

        comp.start03 Forbidden** (сайт блокує проксі) або **404 Not Found**.

Ось **ви = function () {
            this.build();
        };

        comp.build = function () {
            this.activity.head = Lampa.Template.get('head', { title: 'LiveTV Футбол (Fixправлена версія плагіна**.

### Що змінено:
1.  **Замінено проксі:** Замі)' });
            this.activity.line = Lampa.Template.get('items_line', { title: 'Найближчі трансляції' });
            
            this.activity.render().find('.activity__сть `corsproxy.io` використано `allorigins.win`. Він працює стабільніше для таких сайтів.
2.  body').append(this.activity.head);
            this.activity.render().find('.activity__body').append(this.activity.line);

            this.loadMainPage();
        };

        comp.load**Виправлено вивід помилок:** Тепер замість `[object Object]` ви побачите конкретний код помилки (наприклад, 404, 500) або текст.
3.  **Додано декодування:** ДоданоMainPage = function () {
            var _this = this;
            var targetUrl = BASE_URL + '/ua/allupcomingsports/1/';
            var url = PROXY_API + encodeURIComponent(targetUrl);

            console обробку кодування, щоб текст не перетворювався на "кракозябри".

### Оновлений код (.log('LiveTV: Requesting', url);

            Lampa.Network.silent(url, function (responselivetv.js)

```javascript
(function () {
    'use strict';

    // На) {
                // AllOrigins повертає JSON, де HTML лежить в полі .contents
                try {
                    varлаштування
    var BASE_URL = 'https://livetv873.me'; 
    // Використовуємо json = JSON.parse(response);
                    if (json.contents) {
                        var items = _this.parseHtml інший проксі, який часто краще обходить захист
    var PROXY = 'https://api.allorigins.win(json.contents);
                        if (items.length) {
                            _this.drawItems(items);/raw?url='; 

    function Component(object) {
        var comp = new Lampa.
                        } else {
                            _this.activity.empty();
                            Lampa.Noty.show('InteractionMain(object);

        comp.create = function () {
            this.activity.loader(true);
            return this.render();
        };

        comp.start = function () {
            this.build();
        };

        comp.build = function () {
            this.activity.head = Lampa.Список порожній. Можливо змінилась верстка.');
                        }
                    } else {
                        throw new Error('ПоTemplate.get('head', { title: 'LiveTV Футбол' });
            this.activity.line = Lрожня відповідь від проксі');
                    }
                } catch (e) {
                    console.error('ampa.Template.get('items_line', { title: 'Найближчі трансляції' });
            
            this.activity.render().find('.activity__body').append(this.activity.head);
            this.activity.render().LiveTV Parse Error:', e);
                    Lampa.Noty.show('Помилка обробки даних');find('.activity__body').append(this.activity.line);

            this.loadMainPage();
        
                    _this.activity.empty();
                }
                _this.activity.loader(false);
            }, function (a, c) {
                _this.activity.loader(false);
                // Виводимо реальну поми};

        comp.loadMainPage = function () {
            var _this = this;
            var targetUrl = BASE_URL + '/ua/allupcomingsports/1/';
            var url = PROXY + encodeлку замість [object Object]
                var errorText = (c && c.statusText) ? c.statusText :URIComponent(targetUrl);

            console.log('LiveTV: Запит на', url);

            Lampa.Network.silent 'Помилка з\'єднання';
                Lampa.Noty.show('Мережа: ' + errorText);(url, function (html) {
                // Перевірка, чи не повернув проксі помилку в
            });
        };

        comp.parseHtml = function (html) {
            var doc = new тексті
                if (html.length < 500 || html.includes('403 Forbidden') || html.includes('Access DOMParser().parseFromString(html, 'text/html');
            var items = [];
            
            // Denied')) {
                    Lampa.Noty.show('Помилка: Сайт заблокував запит ( Шукаємо таблиці матчів
            var elements = doc.querySelectorAll('a.live');

            elements.403)');
                    _this.activity.empty();
                    _this.activity.loader(false);forEach(function (el) {
                var url = el.getAttribute('href');
                if (!url ||
                    return;
                }

                var items = _this.parseHtml(html);
                
                 url.indexOf('eventinfo') === -1) return;

                var title = el.innerText.trim();if (items.length) {
                    _this.drawItems(items);
                } else {
                    
                
                // Опис (час і ліга)
                var descEl = el.parentNode.querySelector('.evdesc_this.activity.empty();
                    Lampa.Noty.show('Список пустий. Можливо,');
                var subtitle = descEl ? descEl.innerText.replace(/[\n\r]+/g, ' ').trim() : '';

                 змінилась верстка.');
                }
                _this.activity.loader(false);
            }, function (a// Іконка (шукаємо img у батьківській таблиці)
                var img = './img/img_broken.svg';
                var parentTable = el.closest('table');
                if(parentTable) {
                    var img, c) {
                _this.activity.loader(false);
                // Нормальний вивід помилки
El = parentTable.querySelector('img');
                    if(imgEl && imgEl.src) {
                                        var errorMsg = 'Мережа: ';
                if (a && a.status) errorMsg += a.status; 
                else if (typeof c === 'string') errorMsg += c;
                else errorMsg += 'Не// AllOrigins іноді ламає відносні шляхи, відновлюємо їх
                        var src = imgEl.відома помилка';
                
                Lampa.Noty.show(errorMsg);
                console.getAttribute('src');
                        if (src.startsWith('//')) img = 'https:' + src;
                        else iferror('LiveTV Error:', a);
            });
        };

        comp.parseHtml = function (html (src.startsWith('/')) img = BASE_URL + src;
                        else img = src;
                    }
                }

                // Перевірка Live
                var isLive = el.parentNode.innerHTML.includes('live.gif');
                if(isLive) subtitle = '🔴 ' + subtitle;

                items.push({
                    title: title,
                    subtitle: subtitle,
                    url: url.startsWith('http') ?) {
            var doc = new DOMParser().parseFromString(html, 'text/html');
            var url : BASE_URL + url,
                    img: img
                });
            });

            // Вида items = [];
            
            var elements = doc.querySelectorAll('a.live');

            elements.forEach(function (el) {
                var url = el.getAttribute('href');
                if (!url || url.indexOf('eventinfo') === -1) return;

                var title = el.innerText.trim();
                var descEl = el.parentNode.querySelector('.evdesc');
                var subtitle = descEl ? descEl.ляємо дублікати
            return items.filter((v,i,a)=>a.findIndex(t=>(t.url===v.url))===i);
        };

        comp.drawItems = function (innerText.replace(/[\n\r]+/g, ' ').trim() : '';

                var img = './img/img_broken.svg';
                var parentTable = el.closest('table');
                if(parentitems) {
            var _this = this;
            items.forEach(function (item) {
                var card = LTable) {
                    var imgEl = parentTable.querySelector('img');
                    if(imgEl && imgampa.Template.get('card', {
                    title: item.title,
                    release_year: itemEl.src) {
                        var rawSrc = imgEl.getAttribute('src');
                        if (rawSrc.startsWith('//')) img = 'https:' + rawSrc;
                        else if (rawSrc.startsWith('/')) img.subtitle
                });

                card.find('.card__img').attr('src', item.img).css({
                    'object- = BASE_URL + rawSrc;
                        else img = rawSrc;
                    }
                }

                fit': 'contain',
                    'padding': '10px',
                    'background': '#e0e0e0'
var isLive = el.parentNode.innerHTML.includes('live.gif');
                if(isLive) subtitle = '🔴 ' + subtitle;

                items.push({
                    title: title,
                    subtitle: subtitle                });

                card.on('hover:enter', function () {
                    // Відкриваємо в новому вікні/браузері, бо відео на LiveTV 
                    // дуже складно витягнути автомати,
                    url: url.startsWith('http') ? url : BASE_URL + url,
                    img: img
                });
            });

            return items.filter((v,i,a)=>a.findIndex(t=>(t.url===v.url))===i);
        };

        comp.drawItems =чно через захист
                    Lampa.Select.show({
                        title: item.title,
                        items: [ function (items) {
            var _this = this;
            items.forEach(function (item) {
                var card = Lampa.Template.get('card', {
                    title: item.title,
                    release_year: item
                            {title: 'Відкрити сторінку матчу (Браузер)', id: 'browser'}
                        ],
.subtitle
                });

                card.find('.card__img').attr('src', item.img).css({
                    'object-                        onSelect: function(a) {
                            if(a.id == 'browser') {
                                // Використовуємо системний метод відкриття посилань
                                if(Lampa.Platform.is('android')) Lampa.Android.open(item.url);
                                else window.open(item.url, '_blank');
                            }
                        }
                    });
                });
                _this.activity.line.append(card);
            });
        };

        return comp;
    }

    function startPlugin() {
        window.plugin_livetv_fix = true;
        Lampa.Component.add('livetv_fix', Component);
        
        var btn = $('<li class="menu__item selector" data-action="livetv_fix"><div class="menu__ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 fit': 'contain',
                    'padding': '15px',
                    'background': '#f0f0f0'
                });

                card.on('hover:enter', function () {
                    _this.openMatch(item.url, item.title);
                });
                _this.activity.line.append(card);
            });
        };

        comp.openMatch = function (url, title) {
            Lampa.Loading.start();
            // Для сторінки матчу теж використовуємо новий проксі
            var proxyUrl = PROXY + encodeURIComponent(url);

            Lampa.Network.silent(proxyUrl, function (html) {
                Lampa.Loading.stop();
                var doc = new DOMParser().parseFromString(html0 1 0 10 10A10 10 0 0 0 , 'text/html');
                var foundLink = null;

                // 1. Шукаємо if12 2zm0 18a8 8 0 1 1 8-8 rames
                var iframes = doc.querySelectorAll('iframe');
                for(var i=0; i<8 8 0 0 1-8 8z"/><path d="M12 7viframes.length; i++) {
                    var src = iframes[i].getAttribute('src') || '';5l4.2 2.5"/></svg></div><div class="menu__text">LiveTV Fix
                    if(src.includes('youtube') || src.includes('player') || src.includes('video')) {
                        if(src.startsWith('//')) src = 'https:' + src;
                        foundLink = src</div></li>');
        
        btn.on('hover:enter click', function () {
            Lampa.Activity.push({ url: '', title: 'LiveTV Fix', component: 'livetv_fix', page: 1 });
        ;
                        break;
                    }
                }

                // 2. Шукаємо webplayer
                if(!foundLink) {
                    var webplayerLink = doc.querySelector('a[href*="webplayer.php"]');
                    if});

        if ($('.menu .menu__list').length) {
            $('.menu .menu__list').append(btn);(webplayerLink) {
                        var href = webplayerLink.getAttribute('href');
                        if(href
        } else {
            // Фолбек для старих версій
            $('.activity__menu .activity.startsWith('//')) href = 'https:' + href;
                        else if(href.startsWith('/')) href__menu-list').append(btn);
        }
    }

    if (!window.plugin_liv = BASE_URL + href;
                        foundLink = href; 
                    }
                }

                ifetv_fix) {
        if (window.appready) startPlugin();
        else Lampa. (foundLink) {
                    if(foundLink.includes('webplayer.php')) {
                        LampaListener.follow('app', function (e) { if (e.type == 'ready') startPlugin(); });.Select.show({
                            title: 'Плеєр',
                            items: [{title: 'Відкрити в брау
    }
})();
