(function () {
    'use strict';

    console.log('UA_CINEMA_UAKINO: start');

    // Чекаємо, поки Lampa повністю завантажиться
    function startPlugin() {
        if (!window.Lampa) {
            setTimeout(startPlugin, 1000);
            return;
        }

        var network = new Lampa.Reguest();

        function searchUAKino(title, callback) {
            console.log('UA_CINEMA_UAKINO: search:', title);
            network.native(
                'https://uakino.me/index.php?do=search&subaction=search&story=' + encodeURIComponent(title),
                function (html) {
                    var results = [];
                    try {
                        var doc = document.createElement('div');
                        doc.innerHTML = html;
                        var items = doc.querySelectorAll('.movie-item');

                        items.forEach(function (item) {
                            var link = item.querySelector('a');
                            var img = item.querySelector('img');
                            var title = item.querySelector('.movie-title');
                            if (!link) return;

                            results.push({
                                title: title ? title.innerText.trim() : link.innerText.trim(),
                                url: link.href,
                                img: img ? img.src : '',
                                type: 'movie'
                            });
                        });
                    } catch (e) {
                        console.log('UA_CINEMA_UAKINO parse error', e);
                    }
                    callback(results);
                },
                function () {
                    console.log('UA_CINEMA_UAKINO search error');
                    callback([]);
                }
            );
        }

        function openResults(results, originalTitle) {
            if (!results.length) {
                Lampa.Noty.show('Нічого не знайдено на UAKino');
                return;
            }

            var items = results.map(function (item) {
                return {
                    title: item.title,
                    poster: item.img,
                    onSelect: function () {
                        openFilm(item.url, item.title);
                    }
                };
            });

            Lampa.Activity.push({
                title: 'UA KinoGo',
                component: 'list',
                items: items
            });
        }

        function openFilm(url, title) {
            console.log('UA_CINEMA_UAKINO open film:', url);
            network.native(
                url,
                function (html) {
                    var player = null;
                    try {
                        var doc = document.createElement('div');
                        doc.innerHTML = html;
                        var iframe = doc.querySelector('iframe');
                        if (iframe) {
                            player = iframe.src;
                            if (player.startsWith('//')) {
                                player = 'https:' + player;
                            }
                        }
                    } catch (e) {
                        console.log('UA_CINEMA_UAKINO iframe parse error', e);
                    }

                    if (!player) {
                        Lampa.Noty.show('Плеєр не знайдено');
                        return;
                    }

                    Lampa.Player.play({
                        url: player,
                        title: title,
                        type: 'iframe'
                    });
                },
                function () {
                    Lampa.Noty.show('Помилка відкриття');
                }
            );
        }

        function addButton() {
            Lampa.Listener.follow('full', function (event) {
                if (event.type !== 'complite') return;

                var movie = event.data.movie;
                if (!movie) return;

                var title = movie.title || movie.name;
                if (!title) return;

                // Робимо мікро-затримку, щоб переконатися, що Lampa намалювала кнопки
                setTimeout(function(){
                    var buttonsContainer = event.object.activity.render().find('.full-start__buttons');
                    
                    // Перевіряємо, чи кнопка вже не додана (щоб не було дублів)
                    if (buttonsContainer.find('.ua_cinema_btn').length === 0) {
                        
                        var btn = $('<div class="full-start__button selector ua_cinema_btn">🇺🇦 UA KinoGo</div>');
                        
                        btn.on('hover:enter', function () {
                            Lampa.Noty.show('Пошук: ' + title);
                            searchUAKino(title, function (results) {
                                openResults(results, title);
                            });
                        });

                        buttonsContainer.append(btn);
                        console.log('UA_CINEMA_UAKINO button added');
                    }
                }, 100);
            });
        }

        addButton();
        console.log('UA_CINEMA_UAKINO: successfully initialized');
    }

    // Запускаємо перевірку
    startPlugin();

})();
