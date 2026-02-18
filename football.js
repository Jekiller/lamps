(function () {
    'use strict';

    // НАЛАШТУВАННЯ
    // Спробуйте ці дзеркала, якщо не працює: 'https://livetv.sx', 'https://livetv873.me'
    var BASE_URL = 'https://livetv873.me'; 
    var PROXY = 'https://corsproxy.io/?'; 

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
            this.activity.head = Lampa.Template.get('head', { title: 'LiveTV (Safe Mode)' });
            this.activity.line = Lampa.Template.get('items_line', { title: 'Трансляції' });
            
            this.activity.render().find('.activity__body').append(this.activity.head);
            this.activity.render().find('.activity__body').append(this.activity.line);

            this.loadMainPage();
        };

        comp.loadMainPage = function () {
            var _this = this;
            // Формуємо URL для футболу
            var url = encodeURIComponent(BASE_URL + '/ua/allupcomingsports/1/');

            Lampa.Network.silent(url, function (html) {
                try {
                    var items = _this.parseHtml(html);
                    
                    if (items.length) {
                        _this.drawItems(items);
                    } else {
                        _this.activity.empty();
                        Lampa.Noty.show('Список порожній. Змініть дзеркало в коді.');
                    }
                } catch (e) {
                    Lampa.Noty.show('Помилка парсингу: ' + e.message);
                    _this.activity.empty();
                }
                _this.activity.loader(false);
            }, function (a, c) {
                _this.activity.loader(false);
                Lampa.Noty.show('Помилка мережі. Перевірте VPN.');
            });
        };

        comp.parseHtml = function (html) {
            var doc = new DOMParser().parseFromString(html, 'text/html');
            var items = [];
            
            // Простий пошук всіх посилань на події
            var elements = doc.querySelectorAll('a');

            for (var i = 0; i < elements.length; i++) {
                var el = elements[i];
                var href = el.getAttribute('href');

                // Фільтруємо тільки посилання на матчі (eventinfo)
                if (href && href.indexOf('eventinfo') !== -1) {
                    
                    // Перевіряємо, чи є всередині текст (назва матчу)
                    var title = el.innerText.trim();
                    if (!title || title.length < 3) continue;

                    // Шукаємо час матчу поруч (в структурі LiveTV)
                    var parent = el.parentNode; 
                    var desc = parent ? parent.querySelector('.evdesc') : null;
                    var subtitle = desc ? desc.innerText.replace(/\s+/g, ' ').trim() : '';

                    // Шукаємо іконку
                    var img = './img/img_broken.svg';
                    var row = el.closest('tr');
                    if (row) {
                        var imgTag = row.querySelector('img');
                        if (imgTag) {
                            var src = imgTag.getAttribute('src');
                            if (src) {
                                if (src.indexOf('//') === 0) img = 'https:' + src;
                                else img = BASE_URL + src;
                            }
                        }
                    }

                    // Формуємо повне посилання
                    var fullUrl = href;
                    if (href.indexOf('http') !== 0) {
                        fullUrl = BASE_URL + href;
                    }

                    // Перевірка на дублікати
                    var exists = false;
                    for (var j = 0; j < items.length; j++) {
                        if (items[j].url === fullUrl) {
                            exists = true;
                            break;
                        }
                    }

                    if (!exists) {
                        items.push({
                            title: title,
                            subtitle: subtitle,
                            url: fullUrl,
                            img: img
                        });
                    }
                }
            }
            return items;
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
                    'background': '#e6e6e6'
                });

                card.on('hover:enter', function () {
                    Lampa.Noty.show('Відкриваємо: ' + item.title);
                    _this.openMatch(item.url, item.title);
                });
                _this.activity.line.append(card);
            });
        };

        comp.openMatch = function (url, title) {
            Lampa.Loading.start();
            var proxyUrl = PROXY + encodeURIComponent(url);

            Lampa.Network.silent(proxyUrl, function (html) {
                Lampa.Loading.stop();
                var found = false;

                // 1. Спроба знайти AceStream
                var aceMatch = html.match(/acestream:\/\/([a-z0-9]+)/);
                if (aceMatch) {
                    found = true;
                    if(Lampa.Platform.is('android')) {
                        Lampa.Android.open('acestream://' + aceMatch[1]);
                    } else {
                        Lampa.Noty.show('Знайдено AceStream. Потрібен Android + TorrServe.');
                    }
                    return;
                }

                // 2. Спроба знайти iframe
                var doc = new DOMParser().parseFromString(html, 'text/html');
                var iframe = doc.querySelector('iframe[src*="youtube"], iframe[src*="video"]');
                
                if (iframe) {
                    found = true;
                    var src = iframe.getAttribute('src');
                    if (src.indexOf('//') === 0) src = 'https:' + src;
                    Lampa.Player.play({ url: src, title: title });
                    return;
                }

                // 3. Якщо нічого не знайшли, але посилання є - відкриваємо браузер
                if (!found) {
                    Lampa.Select.show({
                        title: 'Потік не знайдено',
                        items: [{ title: 'Відкрити сторінку в браузері', url: url }],
                        onSelect: function(a) {
                            if(Lampa.Platform.is('android')) Lampa.Android.open(a.url);
                            else window.open(a.url, '_blank');
                        }
                    });
                }

            }, function () {
                Lampa.Loading.stop();
                Lampa.Noty.show('Помилка завантаження матчу');
            });
        };

        return comp;
    }

    function startPlugin() {
        window.plugin_football_safe = true;
        Lampa.Component.add('football_safe', Component);
        
        var btn = $('<li class="menu__item selector" data-action="football_safe"><div class="menu__ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path></svg></div><div class="menu__text">Футбол (Safe)</div></li>');
        
        btn.on('hover:enter click', function () {
            Lampa.Activity.push({ url: '', title: 'Футбол', component: 'football_safe', page: 1 });
        });

        $('.menu .menu__list').append(btn);
    }

    if (!window.plugin_football_safe) {
        if (window.appready) startPlugin();
        else {
            Lampa.Listener.follow('app', function (e) {
                if (e.type == 'ready') startPlugin();
            });
        }
    }
})();
