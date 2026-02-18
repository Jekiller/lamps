(function () {
    'use strict';

    var Manifest = {
        name: 'LiveTV UA Fix',
        version: '1.2',
        component: 'livetv_ua_fix'
    };

    // Налаштування
    var BASE_URL = 'https://livetv873.me';
    // Використовуємо AllOrigins, він повертає JSON з полем contents, що краще для JS
    var PROXY = 'https://api.allorigins.win/get?url=';

    function Component(object) {
        var comp = new Lampa.InteractionMain(object);

        comp.create = function () {
            this.activity.loader(true);
            return this.render();
        };

        comp.start = function () {
            this.build();
        };

        comp.build = function () {
            this.activity.head = Lampa.Template.get('head', { title: 'LiveTV Футбол' });
            this.activity.line = Lampa.Template.get('items_line', { title: 'Трансляції (Live & Анонс)' });
            this.activity.render().find('.activity__body').append(this.activity.head);
            this.activity.render().find('.activity__body').append(this.activity.line);
            this.loadMainPage();
        };

        comp.loadMainPage = function () {
            var _this = this;
            var targetUrl = BASE_URL + '/ua/allupcomingsports/1/';
            var url = PROXY + encodeURIComponent(targetUrl);

            console.log('LiveTV: Запит на', url);

            // Використовуємо $.ajax для кращого контролю, ніж Lampa.Network
            $.ajax({
                url: url,
                method: 'GET',
                dataType: 'json', // AllOrigins повертає JSON
                success: function(data) {
                    if (!data || !data.contents) {
                        _this.showError('Пуста відповідь від проксі');
                        return;
                    }
                    
                    var items = _this.parseHtml(data.contents);
                    
                    if (items.length) {
                        _this.drawItems(items);
                    } else {
                        _this.activity.empty();
                        Lampa.Noty.show('Список матчів порожній. Можливо сайт змінився.');
                    }
                    _this.activity.loader(false);
                },
                error: function(xhr, status, error) {
                    _this.activity.loader(false);
                    var msg = 'Помилка: ' + status;
                    if(xhr.status === 0) msg = 'Блокування CORS або AdBlock';
                    else if(xhr.status === 403) msg = 'Доступ заборонено (403)';
                    
                    _this.showError(msg);
                    console.error('LiveTV Error:', xhr);
                }
            });
        };

        comp.showError = function(msg) {
            this.activity.empty();
            Lampa.Noty.show(msg);
            this.activity.line.append(Lampa.Template.get('empty', {
                title: 'Помилка',
                descr: msg + '. Спробуйте увімкнути VPN або змінити дзеркало в коді.'
            }));
        };

        comp.parseHtml = function (html) {
            var doc = new DOMParser().parseFromString(html, 'text/html');
            var items = [];
            
            // LiveTV: таблична верстка. Шукаємо таблиці з матчами.
            // Посилання на матчі мають клас "live" або знаходяться в комірках з live.gif
            var elements = doc.querySelectorAll('table a[href*="eventinfo"]');

            elements.forEach(function (el) {
                // Фільтруємо сміття (посилання на коментарі, архіви і т.д.)
                var url = el.getAttribute('href');
                if (!url || !el.querySelector('img') && !el.classList.contains('live')) return;

                var title = el.innerText.trim();
                if(!title) return; // Пропускаємо пусті посилання (картинки)

                // Опис (час)
                var descEl = el.parentNode.querySelector('.evdesc');
                var subtitle = descEl ? descEl.innerText.replace(/[\n\r\t]+/g, ' ').trim() : '';

                // Іконка
                var img = './img/img_broken.svg';
                var parentRow = el.closest('tr');
                if(parentRow) {
                    var imgEl = parentRow.querySelector('img');
                    if(imgEl && imgEl.src && imgEl.src.includes('sport')) {
                         // Іноді це іконка виду спорту, шукаємо лого ліги
                         var leagueImg = parentRow.querySelector('img[src*="icons"]');
                         if(leagueImg) imgEl = leagueImg;
                    }
                    
                    if(imgEl) {
                        img = imgEl.getAttribute('src');
                        if (img.startsWith('//')) img = 'https:' + img;
                        else if (img.startsWith('/')) img = BASE_URL + img;
                    }
                }

                // Статус Live
                var isLive = el.parentNode.innerHTML.includes('live.gif');
                if(isLive) subtitle = '🔴 ' + subtitle;

                items.push({
                    title: title,
                    subtitle: subtitle,
                    url: url.startsWith('http') ? url : BASE_URL + url,
                    img: img
                });
            });

            // Видаляємо дублікати за URL
            return items.filter((v,i,a)=>a.findIndex(t=>(t.url===v.url))===i);
        };

        comp.drawItems = function (items) {
            var _this = this;
            items.forEach(function (item) {
                var card = Lampa.Template.get('card', {
                    title: item.title,
                    release_year: item.subtitle
                });

                card.find('.card__img').attr('src', item.img).css({
                    'object-fit': 'contain',
                    'padding': '10px',
                    'background': '#e0e0e0'
                });

                card.on('hover:enter', function () {
                    _this.openMatch(item.url, item.title);
                });
                _this.activity.line.append(card);
            });
        };

        comp.openMatch = function (url, title) {
            Lampa.Loading.start();
            // AllOrigins знову, щоб отримати контент сторінки матчу
            var proxyUrl = PROXY + encodeURIComponent(url);

            $.ajax({
                url: proxyUrl,
                method: 'GET',
                dataType: 'json',
                success: function(data) {
                    Lampa.Loading.stop();
                    if (!data || !data.contents) {
                        Lampa.Noty.show('Не вдалося завантажити сторінку матчу');
                        return;
                    }
                    _this.parseMatchPage(data.contents, title);
                },
                error: function() {
                    Lampa.Loading.stop();
                    Lampa.Noty.show('Помилка мережі при відкритті матчу');
                }
            });
        };

        comp.parseMatchPage = function(html, title) {
            var doc = new DOMParser().parseFromString(html, 'text/html');
            var links = [];

            // 1. Шукаємо AceStream посилання (acestream://)
            var aceLinks = html.match(/acestream:\/\/[a-z0-9]+/g);
            if(aceLinks) {
                aceLinks.forEach((link, idx) => {
                    links.push({
                        title: 'AceStream ' + (idx+1),
                        url: link,
                        type: 'ace'
                    });
                });
            }

            // 2. Шукаємо веб-плеєри (webplayer.php)
            var webPlayers = doc.querySelectorAll('a[href*="webplayer.php"]');
            webPlayers.forEach((el, idx) => {
                var href = el.getAttribute('href');
                if (href.startsWith('//')) href = 'https:' + href;
                else if (href.startsWith('/')) href = BASE_URL + href;
                
                links.push({
                    title: 'Web Player ' + (idx+1),
                    url: href,
                    type: 'web'
                });
            });

            // 3. Шукаємо прямі m3u8 (рідкість, але буває)
            var m3u8 = html.match(/["'](https?:\/\/.*?\.m3u8.*?)["']/);
            if(m3u8) {
                links.push({
                    title: 'Direct Stream (HLS)',
                    url: m3u8[1],
                    type: 'hls'
                });
            }

            if(links.length === 0) {
                Lampa.Noty.show('Трансляцій не знайдено (або вони ще не почалися)');
                return;
            }

            // Показуємо меню вибору
            Lampa.Select.show({
                title: 'Виберіть джерело',
                items: links,
                onSelect: function(item) {
                    if(item.type === 'ace') {
                        // Для AceStream потрібен TorrServe або зовнішній плеєр
                        if(Lampa.Platform.is('android')) {
                            Lampa.Android.open(item.url);
                        } else {
                            Lampa.Noty.show('AceStream працює тільки через TorrServe/Android');
                        }
                    } else if (item.type === 'web') {
                        // Веб-плеєри LiveTV часто вбудовані, їх важко витягнути
                        // Пробуємо відкрити в браузері
                        if(Lampa.Platform.is('android')) Lampa.Android.open(item.url);
                        else window.open(item.url, '_blank');
                    } else {
                        // Звичайний потік
                        Lampa.Player.play({ url: item.url, title: title });
                    }
                }
            });
        };

        return comp;
    }

    function startPlugin() {
        window.plugin_livetv_fix = true;
        Lampa.Component.add('livetv_ua_fix', Component);
        
        var btn = $('<li class="menu__item selector" data-action="livetv_fix"><div class="menu__ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12h20M2 12l4-4m-4 4 4 4M22 12l-4-4m4 4-4 4"/></svg></div><div class="menu__text">LiveTV (Fix)</div></li>');
        
        btn.on('hover:enter click', function () {
            Lampa.Activity.push({ url: '', title: 'LiveTV', component: 'livetv_ua_fix', page: 1 });
        });

        $('.menu .menu__list').append(btn);
    }

    if (!window.plugin_livetv_fix) {
        if (window.appready) startPlugin();
        else Lampa.Listener.follow('app', function (e) { if (e.type == 'ready') startPlugin(); });
    }
})();
