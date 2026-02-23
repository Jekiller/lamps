(function(){
'use strict';

/*
#########################################################
UA Cinema Plugin for Lampa (Native UI Edition)
Version: 21.0
#########################################################
*/

if(!window.UA_CINEMA){
    window.UA_CINEMA = {};
    window.UA_CINEMA.hooks = {};
}

const UA_CINEMA = window.UA_CINEMA;
UA_CINEMA.VERSION = '21.0';
UA_CINEMA.STORAGE_KEY = 'ua_cinema_progress';
UA_CINEMA.SITES_PRIORITY = ['uakinogo', 'uaserial', 'uaserials', 'uakino', 'uafix', 'kinotron', 'lavakino', 'hdrezka', 'filmix'];
UA_CINEMA.SITES = UA_CINEMA.SITES || {};

/* --- Мережа Lampa --- */
UA_CINEMA.request = function(url){
    return new Promise(function(resolve, reject){
        if(typeof Lampa.Reguest === 'undefined') { reject('Reguest error'); return; }
        let network = new Lampa.Reguest();
        network.timeout(10000);
        network.request(url, function(res){ resolve(res); }, function(err){ reject(err); }, false, { dataType: 'text' });
    });
};

/* --- Сховище (Resume) --- */
UA_CINEMA.storage = {
    getAll: function(){ return Lampa.Storage.get(UA_CINEMA.STORAGE_KEY, {}); },
    get: function(id){ return id ? (this.getAll()[id] || null) : null; },
    set: function(id, data){
        if(!id) return;
        let all = this.getAll();
        all[id] = data;
        Lampa.Storage.set(UA_CINEMA.STORAGE_KEY, all);
    }
};

/* --- Логіка кнопки (Надійна інтеграція) --- */
UA_CINEMA.initButtonObserver = function(){
    if(!UA_CINEMA.hooks.buttonObserver){
        Lampa.Listener.follow('full', function (e) {
            // Шукаємо правильний момент рендеру
            if (e.type === 'build' && e.html) {
                // Універсальний пошук блоку з кнопками для всіх тем Lampa
                let buttons = e.html.find('.info__buttons, .full-start__buttons, .view--buttons').first();
                
                if (buttons.length && !buttons.find('.ua-cinema-btn').length) {
                    let btn = $('<div class="full-start__button selector ua-cinema-btn" style="background: rgba(255, 215, 0, 0.15); border-radius: 4px;"><div>🇺🇦 Дивись UA</div></div>');
                    
                    btn.on('hover:enter click', function(){
                        UA_CINEMA.open(e.data || e.object.movie);
                    });
                    
                    // Додаємо кнопку наприкінці списку кнопок
                    buttons.append(btn);
                }
            }
        });
        UA_CINEMA.hooks.buttonObserver = true;
    }
};

/* --- Головний запуск --- */
UA_CINEMA.currentMovieData = null;

UA_CINEMA.open = function(movieData){
    if(!movieData) { Lampa.Noty.show('Немає даних фільму'); return; }
    UA_CINEMA.currentMovieData = movieData;
    
    if(movieData.name || movieData.media_type === 'tv'){
        UA_CINEMA.series.load(movieData); // Серіал
    } else {
        UA_CINEMA.search.start(movieData); // Фільм
    }
};

/* --- Пошук --- */
UA_CINEMA.search = { running: false, results: [] };

UA_CINEMA.search.getTitles = function(card){
    let titles = [];
    if(card.title) titles.push(card.title);
    if(card.name) titles.push(card.name);
    if(card.original_title) titles.push(card.original_title);
    if(card.original_name) titles.push(card.original_name);
    return titles.filter((v,i,a) => a.indexOf(v) === i);
};

UA_CINEMA.search.start = async function(card){
    if(UA_CINEMA.search.running) return;
    UA_CINEMA.search.running = true;
    UA_CINEMA.search.results = [];
    
    Lampa.Loading.start(() => { UA_CINEMA.search.running = false; }); // Нативний лоадер
    
    let titles = UA_CINEMA.search.getTitles(card);
    let year = card.release_date ? parseInt(card.release_date) : (card.first_air_date ? parseInt(card.first_air_date) : 0);

    for(let site of UA_CINEMA.SITES_PRIORITY){
        try{
            if(!UA_CINEMA.SITES[site]) continue;
            for(let title of titles){
                let res = await UA_CINEMA.SITES[site].search(title, year);
                if(res && res.length){
                    res.forEach(r => UA_CINEMA.search.results.push({ site: site, ...r }));
                    break;
                }
            }
        } catch(e) {}
    }
    
    UA_CINEMA.search.running = false;
    Lampa.Loading.stop();
    UA_CINEMA.renderResults();
};

/* --- Рендер через НАЛИВНЕ МЕНЮ Lampa --- */
UA_CINEMA.renderResults = function(){
    let items = [];
    let saved = UA_CINEMA.storage.get(UA_CINEMA.currentMovieData.id);

    // Кнопка "Продовжити"
    if(saved && saved.stream){
        items.push({
            title: '▶ ПРОДОВЖИТИ ПЕРЕГЛЯД',
            subtitle: 'Джерело: ' + saved.site.toUpperCase(),
            resume: true,
            data: saved
        });
    }

    if(!UA_CINEMA.search.results.length){
        items.push({ title: '❌ Нічого не знайдено', empty: true });
    } else {
        for(let item of UA_CINEMA.search.results){
            items.push({
                title: item.title + ' (' + item.year + ')',
                subtitle: 'Джерело: ' + item.site.toUpperCase(),
                site: item.site,
                url: item.url
            });
        }
    }

    // Нативне вікно вибору Lampa
    Lampa.Select.show({
        title: '🇺🇦 Оберіть українську озвучку',
        items: items,
        onSelect: function (a) {
            if(a.empty) {
                Lampa.Controller.toggle('full');
                return;
            }
            if(a.resume){
                UA_CINEMA.play({ url: a.data.stream, type: 'hls' }, a.data.site, a.data.sourceUrl);
                setTimeout(function(){ try{ if(a.data.time) Lampa.Player.seek(a.data.time); }catch(e){} }, 1500);
            } else {
                UA_CINEMA.openSource(a.site, a.url);
            }
        },
        onBack: function () {
            Lampa.Controller.toggle('full'); // Повертає фокус на сторінку фільму
        }
    });
};

/* --- Серіали (Нативне меню) --- */
UA_CINEMA.series = {};
UA_CINEMA.series.load = async function(card){
    Lampa.Loading.start();
    let seasons = card.seasons || [];
    if(!seasons.length){
        seasons = await new Promise((resolve) => {
            Lampa.TMDB.api('tv/' + card.id, {}, (data) => resolve(data.seasons || []), () => resolve([]));
        });
    }
    Lampa.Loading.stop();
    
    let items = seasons.filter(s => s.season_number > 0).map(s => ({
        title: 'Сезон ' + s.season_number,
        season: s.season_number
    }));

    if(!items.length) { Lampa.Noty.show('Немає сезонів'); return; }

    Lampa.Select.show({
        title: 'Оберіть сезон',
        items: items,
        onSelect: async function (a) {
            Lampa.Loading.start();
            let episodes = await new Promise((resolve) => {
                Lampa.TMDB.api('tv/' + card.id + '/season/' + a.season, {}, (data) => resolve(data.episodes || []), () => resolve([]));
            });
            Lampa.Loading.stop();
            UA_CINEMA.series.renderEpisodes(episodes, card);
        },
        onBack: function () { Lampa.Controller.toggle('full'); }
    });
};

UA_CINEMA.series.renderEpisodes = function(episodes, card){
    let items = episodes.map(ep => ({
        title: 'Серія ' + ep.episode_number + (ep.name ? ' - ' + ep.name : ''),
        ep: ep.episode_number
    }));

    Lampa.Select.show({
        title: 'Оберіть серію',
        items: items,
        onSelect: function (a) {
            UA_CINEMA.search.start(card);
        },
        onBack: function () { UA_CINEMA.series.load(card); }
    });
};

/* --- Плеєр та парсери --- */
UA_CINEMA.openSource = async function(site, url){
    try{
        Lampa.Loading.start();
        let stream = await UA_CINEMA.extractStream(site, url);
        Lampa.Loading.stop();
        if(!stream) { Lampa.Noty.show('Не вдалося отримати відео'); return; }
        UA_CINEMA.play(stream, site, url);
    } catch(e){
        Lampa.Loading.stop();
        Lampa.Noty.show('Помилка відтворення');
    }
};

UA_CINEMA.extractStream = async function(site, url){
    try{
        let html = await UA_CINEMA.request(url);
        let doc = new DOMParser().parseFromString(html,'text/html');
        let iframe = doc.querySelector('iframe');
        if(!iframe) return null;
        
        let src = iframe.getAttribute('src');
        if(!src) return null;
        if(src.startsWith('//')) src = 'https:' + src;

        let iframeHtml = await UA_CINEMA.request(src);
        let m3u8 = iframeHtml.match(/https?:\/\/[^"]+\.m3u8[^"]*/);
        if(!m3u8) return null;
        return { url: m3u8[0], type: 'hls' };
    } catch(e) { return null; }
};

UA_CINEMA.resumeTimer = null;
UA_CINEMA.play = function(stream, site, sourceUrl){
    let card = UA_CINEMA.currentMovieData;
    Lampa.Player.play({
        title: card.title || card.name || card.original_title,
        url: stream.url,
        type: stream.type || 'hls'
    });
    
    if(UA_CINEMA.resumeTimer) clearInterval(UA_CINEMA.resumeTimer);
    UA_CINEMA.resumeTimer = setInterval(function(){
        try{
            let video = Lampa.Player.video();
            if(video && video.currentTime){
                UA_CINEMA.storage.set(card.id, { site: site, sourceUrl: sourceUrl, stream: stream.url, time: video.currentTime });
            }
        }catch(e){}
    }, 5000);
};

/* --- Парсери сайтів --- */
function extractYearMatch(text){ let m = text.match(/\b(19|20)\d{2}\b/); return m ? parseInt(m[0]) : 0; }
const buildSiteEngine = (searchUrlTemplate, linkSelector) => ({
    search: async function(query, year){
        let url = searchUrlTemplate.replace('{query}', encodeURIComponent(query));
        let html = await UA_CINEMA.request(url);
        let doc = new DOMParser().parseFromString(html,'text/html');
        let results = [];
        doc.querySelectorAll(linkSelector).forEach(el => {
            let href = el.getAttribute('href');
            let title = el.textContent.trim();
            let y = extractYearMatch(title);
            if(href && (!year || !y || year === y)) results.push({ title: title, year: y, url: href });
        });
        return results;
    }
});

UA_CINEMA.SITES.uaserial = buildSiteEngine('https://uaserial.tv/search?query={query}', 'a[href*="/movie-"], a[href*="/serial-"]');
UA_CINEMA.SITES.uaserials = buildSiteEngine('https://uaserials.my/index.php?do=search&subaction=search&story={query}', 'a[href*=".html"]');
UA_CINEMA.SITES.uakino = buildSiteEngine('https://uakino-bay.net/search/{query}', 'a[href*=".html"]');
UA_CINEMA.SITES.uafix = buildSiteEngine('https://uafix.net/index.php?do=search&subaction=search&story={query}', 'a[href*="/"]');
UA_CINEMA.SITES.kinotron = buildSiteEngine('https://kinotron.tv/index.php?do=search&subaction=search&story={query}', 'a[href*=".html"]');
UA_CINEMA.SITES.lavakino = buildSiteEngine('https://lavakino.cc/index.php?do=search&subaction=search&story={query}', 'a[href*=".html"]');
UA_CINEMA.SITES.uakinogo = buildSiteEngine('https://uakinogo.io/index.php?do=search&subaction=search&story={query}', 'a[href*=".html"]');
UA_CINEMA.SITES.hdrezka = buildSiteEngine('https://hdrezka.inc/search/?do=search&subaction=search&q={query}', 'a[href*=".html"]');
UA_CINEMA.SITES.filmix = buildSiteEngine('https://filmix.my/search/{query}', 'a[href*=".html"]');

/* --- Ініціалізація --- */
UA_CINEMA.init = function(){
    UA_CINEMA.initButtonObserver();
};

if(window.Lampa){ UA_CINEMA.init(); }else{ window.addEventListener('lampa', function(){ UA_CINEMA.init(); }); }

})();
