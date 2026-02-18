(function () {
    'use strict';

    // Налаштування
    var BASE_URL = 'https://liveball.gg'; // Актуальне дзеркало
    var PROXY = 'https://api.allorigins.win/raw?url='; // Проксі для обходу CORS

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
            this.activity.head = Lampa.Template.get('head', { title: 'LiveBall Футбол' });
            this.activity.line = Lampa.Template.get('items_line', { title: 'Матчі (Live та Анонс)' });
            
            this.activity.render().find('.activity__body').append(this.activity.head);
            this.activity.render().find('.activity__body').append(this.activity.line);

            this.loadMainPage();
        };

        comp.loadMainPage = function () {
            var _this = this;
            var url = PROXY + encodeURIComponent(BASE_URL);

            Lampa.Network.silent(url, function (html) {
                var items = _this.parseHtml(html);
                
                if (items.length) {
                    _this.drawItems(items);
                } else {
                    _this.activity.empty();
                }
                _this.activity.loader(false);
            }, function (error) {
                _this.activity.loader(false);
                Lampa.Noty.show('Помилка мережі: ' + error);
            });
        };

        // Парсинг HTML, який ви надали
        comp.parseHtml = function (html) {
            var doc = new DOMParser().parseFromString(html, 'text/html');
            var items = [];
            
            // Шукаємо блоки матчів .live_block2
            var elements = doc.querySelectorAll('.live_block2');

            elements.forEach(function (el) {
                var linkEl = el.querySelector('a.match_a');
                if (!linkEl) return;

                var url = linkEl.getAttribute('href'); // /match/123456
                
                // Назви команд
                var teamLeft = el.querySelector('.team_title_left') ? el.querySelector('.team_title_left').innerText.trim() : 'Team 1';
                var teamRight = el.querySelector('.team_title_right') ? el.querySelector('.team_title_right').innerText.trim() : 'Team 2';
                
                // Рахунок або час
                var score = el.querySelector('.score') ? el.querySelector('.score').innerText.trim() : null;
                var time = el.querySelector('.vs') ? el.querySelector('.vs').innerText.trim() : null;
                
                // Логотип (беремо лівий)
                var imgEl = el.querySelector('.logo_left');
                var img = imgEl ? imgEl.src : './img/img_broken.svg';

                // Статус матчу
                var status = score ? 'LIVE: ' + score : time;

                items.push({
                    title: teamLeft + ' - ' + teamRight,
                    subtitle: status,
                    url: BASE_URL + url, // Повне посилання на сторінку матчу
                    img: img,
                    is_live: !!score
                });
            });

            return items;
        };

        comp.drawItems = function (items) {
            var _this = this;

            items.forEach(function (item) {
                var card = Lampa.Template.get('card', {
                    title: item.title,
                    release_year: item.subtitle
                });

                // Стилізація картки
                card.find('.card__img').attr('src', item.img).css({
                    'object-fit': 'contain',
                    'padding': '10px',
                    'background': '#1a1a1a'
                });
                
                if(item.is_live) {
                    card.find('.card__view').append('<div class="card__quality" style="background:red; padding: 2px 5px;">LIVE</div>');
                }

                card.on('hover:enter', function () {
                    _this.openMatch(item.url, item.title);
                });

                _this.activity.line.append(card);
            });
        };

        // Відкриття сторінки матчу та пошук потоку
        comp.openMatch = function (url, title) {
            Lampa.Loading.start();
            var proxyUrl = PROXY + encodeURIComponent(url);

            Lampa.Network.silent(proxyUrl, function (html) {
                // ТУТ МАГІЯ: Шукаємо посилання на m3u8 всередині сторінки матчу
                // 1. Шукаємо прямий m3u8
                var matchM3U8 = html.match(/["'](https?:\/\/.*?\.m3u8.*?)["']/);
                
                // 2. Шукаємо iframe (LiveBall часто ховає плеєр в iframe)
                // Шукаємо <iframe src="...">
                var doc = new DOMParser().parseFromString(html, 'text/html');
                var iframe = doc.querySelector('iframe[src*="player"], iframe[src*="stream"], iframe[allowfullscreen]');

                if (matchM3U8) {
                    Lampa.Loading.stop();
                    Lampa.Player.play({ url: matchM3U8[1], title: title });
                    Lampa.Player.playlist([{ url: matchM3U8[1], title: title }]);
                } else if (iframe) {
                    var iframeSrc = iframe.getAttribute('src');
                    if (iframeSrc.startsWith('//')) iframeSrc = 'https:' + iframeSrc;
                    
                    // Якщо знайшли iframe, треба парсити його.
                    // Для простоти спробуємо відкрити через Webview (якщо це Android) 
                    // або повідомити користувача.
                    Lampa.Loading.stop();
                    
                    // Спроба розпарсити iframe (рекурсія)
                    Lampa.Noty.show('Знайдено iframe, пробую витягнути потік...');
                    parseIframe(iframeSrc, title);
                    
                } else {
                    Lampa.Loading.stop();
                    Lampa.Noty.show('Прямий потік не знайдено. Можливо потрібен VPN або сайт змінив захист.');
                }
            }, function () {
                Lampa.Loading.stop();
                Lampa.Noty.show('Не вдалося завантажити сторінку матчу');
            });
        };

        // Додаткова функція для парсингу iframe
        function parseIframe(url, title) {
             var proxyUrl = PROXY + encodeURIComponent(url);
             Lampa.Network.silent(proxyUrl, function(html){
                 var match = html.match(/file: ?["'](https?:\/\/.*?\.m3u8)["']/) || 
                             html.match(/source: ?["'](https?:\/\/.*?\.m3u8)["']/) ||
                             html.match(/src=["'](https?:\/\/.*?\.m3u8)["']/);
                 
                 if(match) {
                     Lampa.Player.play({ url: match[1], title: title });
                 } else {
                     // Якщо зовсім нічого не знайшли - пропонуємо відкрити в браузері (Android)
                     if(Lampa.Platform.is('android')) {
                         Lampa.Android.open(url);
                     } else {
                         Lampa.Noty.show('Потік захищено. Відкрийте сайт на ПК.');
                     }
                 }
             });
        }

        return comp;
    }

    function startPlugin() {
        window.plugin_liveball_ready = true;

        Lampa.Component.add('liveball', Component);

        var btn = $('<li class="menu__item selector" data-action="liveball"><div class="menu__ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path></svg></div><div class="menu__text">Футбол (LiveBall)</div></li>');
        
        btn.on('hover:enter click', function () {
            Lampa.Activity.push({
                url: '',
                title: 'LiveBall',
                component: 'liveball',
                page: 1
            });
        });

        $('.menu .menu__list').append(btn);
    }

    if (!window.plugin_liveball_ready) {
        if (window.appready) startPlugin();
        else {
            Lampa.Listener.follow('app', function (e) {
                if (e.type == 'ready') startPlugin();
            });
        }
    }
})();
