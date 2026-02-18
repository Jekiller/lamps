(function () {
    'use strict';

    // 1. Налаштування
    var BASE_URL = 'https://sport-tv.biz'; 
    // Використовуємо AllOrigins (повертає JSON, що надійніше для TV)
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
            this.activity.head = Lampa.Template.get('head', { title: 'Sport TV' });
            this.activity.line = Lampa.Template.get('items_line', { title: 'Прямий ефір' });
            
            this.activity.render().find('.activity__body').append(this.activity.head);
            this.activity.render().find('.activity__body').append(this.activity.line);

            this.loadMainPage();
        };

        comp.loadMainPage = function () {
            var _this = this;
            var url = PROXY + encodeURIComponent(BASE_URL);

            Lampa.Network.silent(url, function (response) {
                try {
                    // AllOrigins повертає відповідь у полі contents
                    var html = response.contents; 
                    if(!html) throw "Пуста відповідь";

                    var items = _this.parseHtml(html);
                    
                    if (items.length) {
                        _this.drawItems(items);
                    } else {
                        _this.activity.empty();
                        Lampa.Noty.show('Список трансляцій порожній');
                    }
                } catch (e) {
                    _this.activity.empty();
                    Lampa.Noty.show('Помилка парсингу: ' + e.message);
                }
                _this.activity.loader(false);
            }, function (a, c) {
                _this.activity.loader(false);
                _this.activity.empty();
                Lampa.Noty.show('Помилка мережі (CORS/VPN)');
            });
        };

        comp.parseHtml = function (html) {
            var doc = new DOMParser().parseFromString(html, 'text/html');
            var items = [];
            
            // На sport-tv.biz матчі зазвичай у блоках .short або .custom-poster
            // Шукаємо посилання на повні новини
            var elements = doc.querySelectorAll('a.short-img, a.clip-link'); 

            for (var i = 0; i < elements.length; i++) {
                var el = elements[i];
                var url = el.getAttribute('href');
                var title = el.getAttribute('title') || el.innerText;
                var imgEl = el.querySelector('img');
                var img = imgEl ? imgEl.getAttribute('src') : './img/img_broken.svg';

                // Виправляємо посилання на картинку
                if (img.indexOf('/') === 0) img = BASE_URL + img;

                // Очищаємо заголовок від зайвого
                title = title.replace('Смотреть онлайн', '').replace('прямая трансляция', '').trim();

                if (title && url) {
                    items.push({
                        title: title,
                        url: url,
                        img: img,
                        subtitle: 'Live'
                    });
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

                card.find('.card__img').attr('src', item.img).css('object-fit', 'cover');

                card.on('hover:enter', function () {
                    _this.openPage(item.url, item.title);
                });
                _this.activity.line.append(card);
            });
        };

        comp.openPage = function (url, title) {
            Lampa.Loading.start();
            var proxyUrl = PROXY + encodeURIComponent(url);

            Lampa.Network.silent(proxyUrl, function (response) {
                try {
                    var html = response.contents;
                    var doc = new DOMParser().parseFromString(html, 'text/html');
                    
                    // 1. Шукаємо iframe (найчастіший варіант)
                    var iframes = doc.querySelectorAll('iframe');
                    var foundLink = null;

                    for (var i = 0; i < iframes.length; i++) {
                        var src = iframes[i].getAttribute('src');
                        // Фільтруємо рекламу
                        if (src && !src.includes('banner') && !src.includes('ads')) {
                            if(src.indexOf('//') === 0) src = 'https:' + src;
                            foundLink = src;
                            break; 
                        }
                    }

                    // 2. Якщо iframe немає, шукаємо плеєр Uppod/Playerjs (скрипти)
                    if (!foundLink) {
                        var scripts = html.match(/file:"(.*?\.m3u8)"/);
                        if(scripts) foundLink = scripts[1];
                    }

                    Lampa.Loading.stop();

                    if (foundLink) {
                        Lampa.Player.play({
                            url: foundLink,
                            title: title
                        });
                        Lampa.Player.playlist([{
                            url: foundLink,
                            title: title
                        }]);
                    } else {
                        Lampa.Noty.show('Плеєр не знайдено (можливо захищений)');
                        // Можна запропонувати відкрити в браузері (Android)
                        if(Lampa.Platform.is('android')) {
                            Lampa.Android.open(url);
                        }
                    }

                } catch (e) {
                    Lampa.Loading.stop();
                    Lampa.Noty.show('Помилка сторінки');
                }
            }, function() {
                Lampa.Loading.stop();
                Lampa.Noty.show('Не вдалося завантажити');
            });
        };

        return comp;
    }

    function startPlugin() {
        window.plugin_sporttv = true;
        Lampa.Component.add('sporttv', Component);
        
        var btn = $('<li class="menu__item selector" data-action="sporttv"><div class="menu__ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect><polyline points="17 2 12 7 7 2"></polyline></svg></div><div class="menu__text">Sport TV</div></li>');
        
        btn.on('hover:enter click', function () {
            Lampa.Activity.push({ url: '', title: 'Sport TV', component: 'sporttv', page: 1 });
        });

        $('.menu .menu__list').append(btn);
    }

    if (!window.plugin_sporttv) {
        if (window.appready) startPlugin();
        else Lampa.Listener.follow('app', function (e) { if (e.type == 'ready') startPlugin(); });
    }
})();
