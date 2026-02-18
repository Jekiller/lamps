(function () {
    'use strict';

    // Налаштування
    var BASE_URL = 'https://livetv873.me'; // Дзеркало з вашого коду
    var PROXY = 'https://corsproxy.io/?'; // Проксі

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
            this.activity.line = Lampa.Template.get('items_line', { title: 'Найближчі трансляції' });
            
            this.activity.render().find('.activity__body').append(this.activity.head);
            this.activity.render().find('.activity__body').append(this.activity.line);

            this.loadMainPage();
        };

        comp.loadMainPage = function () {
            var _this = this;
            // Сторінка футболу
            var url = PROXY + encodeURIComponent(BASE_URL + '/ua/allupcomingsports/1/');

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

        // Парсинг саме під структуру LiveTV
        comp.parseHtml = function (html) {
            var doc = new DOMParser().parseFromString(html, 'text/html');
            var items = [];
            
            // LiveTV використовує таблиці. Шукаємо посилання з класом "live"
            var elements = doc.querySelectorAll('a.live');

            elements.forEach(function (el) {
                var url = el.getAttribute('href');
                if (!url || url.indexOf('eventinfo') === -1) return;

                var title = el.innerText.trim();
                
                // Опис (час і ліга) зазвичай в наступному span з класом evdesc
                var descEl = el.parentNode.querySelector('.evdesc');
                var subtitle = descEl ? descEl.innerText.replace(/[\n\r]+/g, ' ').trim() : '';

                // Іконка (шукаємо img у батьківській таблиці)
                var img = './img/img_broken.svg';
                var parentTable = el.closest('table');
                if(parentTable) {
                    var imgEl = parentTable.querySelector('img');
                    if(imgEl && imgEl.src) {
                        // Виправляємо відносні посилання
                        img = imgEl.getAttribute('src');
                        if (img.startsWith('//')) img = 'https:' + img;
                        else if (img.startsWith('/')) img = BASE_URL + img;
                    }
                }

                // Перевірка чи це Live (шукаємо картинку live.gif поруч)
                var isLive = el.parentNode.innerHTML.includes('live.gif');
                if(isLive) subtitle = '🔴 ' + subtitle;

                items.push({
                    title: title,
                    subtitle: subtitle,
                    url: url.startsWith('http') ? url : BASE_URL + url,
                    img: img
                });
            });

            // Видаляємо дублікати (LiveTV часто дублює топ матчі)
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
                    'padding': '15px',
                    'background': '#f0f0f0' // Світлий фон, бо іконки LiveTV часто темні
                });

                card.on('hover:enter', function () {
                    _this.openMatch(item.url, item.title);
                });

                _this.activity.line.append(card);
            });
        };

        // Відкриття сторінки матчу
        comp.openMatch = function (url, title) {
            Lampa.Loading.start();
            var proxyUrl = PROXY + encodeURIComponent(url);

            Lampa.Network.silent(proxyUrl, function (html) {
                // 1. Спочатку шукаємо iframes прямо на сторінці
                var doc = new DOMParser().parseFromString(html, 'text/html');
                var iframes = doc.querySelectorAll('iframe');
                var foundLink = null;

                // Перебираємо іфрейми, шукаємо плеєри
                for(var i=0; i<iframes.length; i++) {
                    var src = iframes[i].getAttribute('src') || '';
                    if(src.includes('youtube') || src.includes('player') || src.includes('video')) {
                        if(src.startsWith('//')) src = 'https:' + src;
                        foundLink = src;
                        break;
                    }
                }

                // 2. Якщо iframe немає, шукаємо посилання на webplayer.php (специфіка LiveTV)
                if(!foundLink) {
                    var webplayerLink = doc.querySelector('a[href*="webplayer.php"]');
                    if(webplayerLink) {
                        var href = webplayerLink.getAttribute('href');
                        if(href.startsWith('//')) href = 'https:' + href;
                        else if(href.startsWith('/')) href = BASE_URL + href;
                        
                        // Тут треба було б парсити ще й webplayer.php, але для початку спробуємо відкрити його
                        // LiveTV часто відкриває плеєр у новому вікні
                        foundLink = href; 
                    }
                }

                Lampa.Loading.stop();

                if (foundLink) {
                    // Якщо знайшли посилання на плеєр
                    if(foundLink.includes('webplayer.php')) {
                        // Якщо це внутрішній плеєр LiveTV - його важко вбудувати, 
                        // пропонуємо відкрити через Android System (браузер) або намагаємось парсити далі
                        Lampa.Select.show({
                            title: 'Знайдено WebPlayer',
                            items: [
                                {title: 'Спробувати знайти потік (beta)', method: 'parse_deep'},
                                {title: 'Відкрити в браузері', method: 'browser'}
                            ],
                            onSelect: function(a){
                                if(a.method == 'browser') Lampa.Android.open(foundLink);
                                if(a.method == 'parse_deep') parseWebPlayer(foundLink, title);
                            }
                        });
                    } else {
                        // Якщо це прямий iframe/youtube
                        Lampa.Player.play({ url: foundLink, title: title });
                    }
                } else {
                    Lampa.Noty.show('Посилання на відео не знайдено (можливо, AceStream?)');
                }

            }, function () {
                Lampa.Loading.stop();
                Lampa.Noty.show('Помилка завантаження сторінки матчу');
            });
        };

        // Глибокий парсинг webplayer.php (спроба витягнути m3u8)
        function parseWebPlayer(url, title) {
            Lampa.Loading.start();
            var proxyUrl = PROXY + encodeURIComponent(url);
            
            Lampa.Network.silent(proxyUrl, function(html) {
                Lampa.Loading.stop();
                // Шукаємо m3u8
                var match = html.match(/["'](https?:\/\/.*?\.m3u8.*?)["']/);
                // Шукаємо iframe всередині webplayer
                var doc = new DOMParser().parseFromString(html, 'text/html');
                var iframe = doc.querySelector('iframe');

                if (match) {
                    Lampa.Player.play({ url: match[1], title: title });
                } else if(iframe) {
                    var src = iframe.getAttribute('src');
                    if(src.startsWith('//')) src = 'https:' + src;
                    Lampa.Player.play({ url: src, title: title }); // Спроба грати iframe
                } else {
                    Lampa.Noty.show('Потік захищено. Відкрийте в браузері.');
                    if(Lampa.Platform.is('android')) Lampa.Android.open(url);
                }
            });
        }

        return comp;
    }

    function startPlugin() {
        window.plugin_livetv_ua = true;
        Lampa.Component.add('livetv_ua', Component);
        var btn = $('<li class="menu__item selector" data-action="livetv_ua"><div class="menu__ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/><path d="M12 7v5l4.2 2.5"/></svg></div><div class="menu__text">LiveTV UA</div></li>');
        btn.on('hover:enter click', function () {
            Lampa.Activity.push({ url: '', title: 'LiveTV UA', component: 'livetv_ua', page: 1 });
        });
        $('.menu .menu__list').append(btn);
    }

    if (!window.plugin_livetv_ua) {
        if (window.appready) startPlugin();
        else Lampa.Listener.follow('app', function (e) { if (e.type == 'ready') startPlugin(); });
    }
})();
