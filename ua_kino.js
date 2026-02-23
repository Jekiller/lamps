(function(){
'use strict';

/*
#########################################################
UA Cinema Plugin for Lampa (FIXED for Smart TV & PC)
Version: 20.2
#########################################################
*/

if(!window.UA_CINEMA){
    window.UA_CINEMA = {};
    window.UA_CINEMA.hooks = {};
}

const UA_CINEMA = window.UA_CINEMA;

UA_CINEMA.VERSION = '20.2';
UA_CINEMA.NAME = 'ua_cinema';
UA_CINEMA.STORAGE_KEY = 'ua_cinema_progress';
UA_CINEMA.DEBUG = false;
UA_CINEMA.SITES_PRIORITY = ['uakinogo', 'uaserial', 'uaserials', 'uakino', 'uafix', 'kinotron', 'lavakino', 'hdrezka', 'filmix'];
UA_CINEMA.SITES = UA_CINEMA.SITES || {};

UA_CINEMA.log = function(){
    if(!UA_CINEMA.DEBUG) return;
    console.log('[UA_CINEMA]', ...arguments);
};

/* --- Мережевий модуль Lampa --- */
UA_CINEMA.request = function(url){
    return new Promise(function(resolve, reject){
        if(typeof Lampa.Reguest === 'undefined') { reject('Lampa Network module not found'); return; }
        let network = new Lampa.Reguest();
        network.timeout(15000);
        network.request(url, function(res){ resolve(res); }, function(err){ reject(err); }, false, { dataType: 'text' });
    });
};

/* --- Utils & Storage --- */
UA_CINEMA.getYearFromDate = function(date){
    if(!date) return 0;
    if(typeof date === 'number') return date;
    if(typeof date === 'string'){
        let year = parseInt(date);
        if(!isNaN(year)) return year;
    }
    return 0;
};

UA_CINEMA.getCardYear = function(card){
    if(!card) return 0;
    if(card.release_date) return UA_CINEMA.getYearFromDate(card.release_date);
    if(card.first_air_date) return UA_CINEMA.getYearFromDate(card.first_air_date);
    if(card.year) return UA_CINEMA.getYearFromDate(card.year);
    return 0;
};

UA_CINEMA.storage = {
    getAll: function(){
        let data = Lampa.Storage.get(UA_CINEMA.STORAGE_KEY, {});
        return (!data || typeof data !== 'object') ? {} : data;
    },
    get: function(id){ return id ? (this.getAll()[id] || null) : null; },
    set: function(id, data){
        if(!id) return;
        let all = this.getAll();
        all[id] = data;
        Lampa.Storage.set(UA_CINEMA.STORAGE_KEY, all);
    }
};

/* --- Card Engine --- */
UA_CINEMA.currentMovieData = null; // Зберігаємо дані тут

UA_CINEMA.getCardData = function(card){
    if(!card) return null;
    let poster = card.poster_path ? Lampa.TMDB.image('w500', card.poster_path) : '';
    let backdrop = card.backdrop_path ? Lampa.TMDB.image('w1280', card.backdrop_path) : '';
    return {
        id: card.id, title: card.title || '', name: card.name || '',
        original_title: card.original_title || '', original_name: card.original_name || '',
        year: UA_CINEMA.getCardYear(card), poster: poster, backdrop: backdrop, card: card
    };
};

/* --- Ін'єкція кнопки (ФІКС для ТБ пультів та отримання даних) --- */
UA_CINEMA.initButtonObserver = function(){
    if(!UA_CINEMA.hooks.buttonObserver){
        Lampa.Listener.follow('full', function (e) {
            if (e.type === 'build') {
                let html = e.object.activity.render();
                let container = html.find('.full-start__buttons, .full-start-new__buttons').eq(0);
                
                if (container.length && !container.find('.ua-cinema-btn').length) {
                    // Використовуємо jQuery (Lampa стандарт)
                    let btn = $('<div class="full-start__button selector ua-cinema-btn">🇺🇦 Дивись UA1</div>');
                    
                    // hover:enter - це натискання ОК на пульті ТВ. click - для мишки ПК
                    btn.on('hover:enter click', function(){
                        // Беремо дані прямо з події, щоб уникнути помилки null
                        let movieData = e.data || e.object.movie;
                        UA_CINEMA.open(movieData);
                    });
                    
                    container.prepend(btn);
                }
            }
        });
        UA_CINEMA.hooks.buttonObserver = true;
    }
};

/* --- Modal Engine --- */
UA_CINEMA.modal = null;
UA_CINEMA.modalContent = null;

UA_CINEMA.open = function(movieData){
    if(!movieData){
        Lampa.Noty.show('Помилка: Немає даних фільму');
        return;
    }
    UA_CINEMA.currentMovieData = movieData;
    let card = UA_CINEMA.getCardData(movieData);
    
    UA_CINEMA.createModal(card);
    UA_CINEMA.showLoader();
    
    if(UA_CINEMA.series.isSeries(card)){
        setTimeout(function(){ UA_CINEMA.series.load(card); }, 300);
    } else {
        UA_CINEMA.search.start(card);
    }
};

/* Обробник кнопок пульта (Назад / Esc) */
UA_CINEMA.onKeyDown = function(e){
    // 27=Esc, 8=Backspace, 461/10009=TV Back Buttons
    if (e.keyCode === 27 || e.keyCode === 8 || e.keyCode === 461 || e.keyCode === 10009) {
        UA_CINEMA.destroyModal();
        e.preventDefault();
        e.stopPropagation();
    }
};

UA_CINEMA.createModal = function(card){
    UA_CINEMA.destroyModal();
    let modalStr = `
    <div class="ua-cinema-modal">
        <div class="ua-cinema-modal__bg"></div>
        <div class="ua-cinema-modal__overlay"></div>
        <div class="ua-cinema-modal__body">
            <div class="ua-cinema-modal__header">
                <div class="ua-cinema-modal__title">🇺🇦 Дивись українською</div>
                <div class="ua-cinema-modal__close selector">✕ Закрити</div>
            </div>
            <div class="ua-cinema-modal__content"></div>
        </div>
    </div>`;
    
    let modal = $(modalStr);
    $('body').append(modal);
    
    UA_CINEMA.modal = modal;
    UA_CINEMA.modalContent = modal.find('.ua-cinema-modal__content');
    
    // Закриття модалки
    modal.find('.ua-cinema-modal__close').on('hover:enter click', UA_CINEMA.destroyModal);
    document.addEventListener('keydown', UA_CINEMA.onKeyDown);
    
    let bg = card.backdrop || card.poster || '';
    modal.find('.ua-cinema-modal__bg').css('background-image', 'url('+bg+')');
    UA_CINEMA.injectStyles();
};

UA_CINEMA.destroyModal = function(){
    if(!UA_CINEMA.modal) return;
    document.removeEventListener('keydown', UA_CINEMA.onKeyDown);
    UA_CINEMA.modal.remove();
    UA_CINEMA.modal = null;
};

UA_CINEMA.showLoader = function(){
    if(!UA_CINEMA.modalContent) return;
    UA_CINEMA.modalContent.html(`<div class="ua-cinema-loader"><div class="ua-cinema-loader__spinner"></div><div class="ua-cinema-loader__text">Пошук...</div></div>`);
};
UA_CINEMA.hideLoader = function(){
    if(!UA_CINEMA.modalContent) return;
    UA_CINEMA.modalContent.empty();
};

/* --- Search Engine --- */
UA_CINEMA.search = { results: [], running: false };

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
    
    let titles = UA_CINEMA.search.getTitles(card);
    let year = card.year;

    for(let site of UA_CINEMA.SITES_PRIORITY){
        try{ await UA_CINEMA.search.searchSite(site, titles, year); } catch(e) {}
    }
    UA_CINEMA.search.running = false;
    UA_CINEMA.renderResults();
};

UA_CINEMA.search.searchSite = async function(site, titles, year){
    if(!UA_CINEMA.SITES[site]) return;
    let engine = UA_CINEMA.SITES[site];
    for(let title of titles){
        let results = await engine.search(title, year);
        if(results && results.length){
            for(let r of results){
                UA_CINEMA.search.results.push({ site: site, title: r.title, year: r.year, url: r.url, data: r });
            }
            break; 
        }
    }
};

UA_CINEMA.renderResults = function(){
    UA_CINEMA.hideLoader();
    if(!UA_CINEMA.modalContent) return;
    
    UA_CINEMA.resume.render();

    if(!UA_CINEMA.search.results.length){
        UA_CINEMA.modalContent.append(`<div class="ua-cinema-empty">Не знайдено озвучок</div>`);
        return;
    }

    let html = $('<div></div>');
    for(let item of UA_CINEMA.search.results){
        let el = $(`<div class="ua-cinema-item selector" data-site="${item.site}" data-url="${item.url}">
                    <div class="ua-cinema-item__site">${item.site.toUpperCase()}</div>
                    <div class="ua-cinema-item__title">${item.title} (${item.year})</div>
                 </div>`);
                 
        // hover:enter для пультів ТВ
        el.on('hover:enter click', function(){
            UA_CINEMA.openSource($(this).attr('data-site'), $(this).attr('data-url'));
        });
        html.append(el);
    }
    UA_CINEMA.modalContent.append(html);
};

/* --- Player & Extract Engine --- */
UA_CINEMA.openSource = async function(site, url){
    try{
        UA_CINEMA.showLoader();
        let stream = await UA_CINEMA.extractStream(site, url);
        UA_CINEMA.hideLoader();
        if(!stream) {
            Lampa.Noty.show('Не вдалося отримати відео');
            UA_CINEMA.renderResults();
            return;
        }
        UA_CINEMA.destroyModal(); // Закриваємо модалку перед плейєром
        UA_CINEMA.play(stream, site, url);
    } catch(e){
        UA_CINEMA.hideLoader();
        Lampa.Noty.show('Помилка відтворення');
    }
};

UA_CINEMA.extractStream = async function(site, url){
    if(['uaserials', 'uakino', 'uafix', 'kinotron', 'lavakino', 'uakinogo', 'hdrezka', 'filmix', 'uaserial'].includes(site)){
        return await UA_CINEMA.genericIframeExtractor(url);
    }
    return null;
};

UA_CINEMA.genericIframeExtractor = async function(url){
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

/* --- Play Engine --- */
UA_CINEMA.play = function(stream, site, sourceUrl){
    let card = UA_CINEMA.getCardData(UA_CINEMA.currentMovieData);
    let playerData = {
        title: card.title || card.name || card.original_title,
        url: stream.url,
        type: stream.type || 'hls',
        subtitles: []
    };
    Lampa.Player.play(playerData);
    UA_CINEMA.resume.startTracking(stream.url, site, sourceUrl);
};

/* --- Resume Engine --- */
UA_CINEMA.resume = { current: null, timer: null };
UA_CINEMA.resume.get = function(){
    let card = UA_CINEMA.getCardData(UA_CINEMA.currentMovieData);
    if(!card) return null;
    return UA_CINEMA.storage.get(card.id);
};

UA_CINEMA.resume.render = function(){
    let saved = UA_CINEMA.resume.get();
    if(!saved || !saved.stream || !UA_CINEMA.modalContent) return;

    let btn = $(`<div class="ua-cinema-resume selector">
                    <div class="ua-cinema-resume__title">▶ Продовжити перегляд</div>
                    <div class="ua-cinema-resume__site">Джерело: ${saved.site}</div>
                </div>`);
                
    btn.on('hover:enter click', function(){
        UA_CINEMA.destroyModal(); // Закриваємо модалку перед плейєром
        UA_CINEMA.play({ url: saved.stream, type: 'hls' }, saved.site, saved.sourceUrl);
        setTimeout(function(){
            try{ if(saved.time) Lampa.Player.seek(saved.time); }catch(e){}
        }, 1500);
    });
    
    UA_CINEMA.modalContent.prepend(btn);
};

UA_CINEMA.resume.startTracking = function(streamUrl, site, sourceUrl){
    let card = UA_CINEMA.getCardData(UA_CINEMA.currentMovieData);
    if(!card) return;
    if(UA_CINEMA.resume.timer) clearInterval(UA_CINEMA.resume.timer);

    UA_CINEMA.resume.timer = setInterval(function(){
        try{
            let video = Lampa.Player.video();
            if(video && video.currentTime){
                UA_CINEMA.storage.set(card.id, {
                    site: site, sourceUrl: sourceUrl, stream: streamUrl, time: video.currentTime
                });
            }
        }catch(e){}
    }, 5000);
};

/* --- Series Engine --- */
UA_CINEMA.series = {};
UA_CINEMA.series.isSeries = function(card){
    return card && (card.card.media_type === 'tv' || card.card.name);
};

UA_CINEMA.series.load = async function(card){
    let seasons = card.card.seasons || [];
    if(!seasons.length){
        seasons = await new Promise((resolve) => {
            Lampa.TMDB.api('tv/' + card.card.id, {}, (data) => resolve(data.seasons || []), () => resolve([]));
        });
    }
    UA_CINEMA.series.renderSeasons(seasons, card);
};

UA_CINEMA.series.renderSeasons = function(seasons, card){
    if(!UA_CINEMA.modalContent) return;
    let html = $('<div class="ua-cinema-seasons"></div>');
    seasons.forEach(s => {
        if(s.season_number > 0) {
            let el = $(`<div class="ua-cinema-season selector" data-season="${s.season_number}">Сезон ${s.season_number}</div>`);
            el.on('hover:enter click', async function(){
                UA_CINEMA.showLoader();
                let season = parseInt($(this).attr('data-season'));
                let episodes = await new Promise((resolve) => {
                    Lampa.TMDB.api('tv/' + card.card.id + '/season/' + season, {}, (data) => resolve(data.episodes || []), () => resolve([]));
                });
                UA_CINEMA.hideLoader();
                UA_CINEMA.series.renderEpisodes(season, episodes, card);
            });
            html.append(el);
        }
    });
    UA_CINEMA.modalContent.empty().append(html);
};

UA_CINEMA.series.renderEpisodes = function(season, episodes, card){
    if(!UA_CINEMA.modalContent) return;
    let html = $('<div class="ua-cinema-episodes"></div>');
    
    let backBtn = $(`<div class="ua-cinema-season selector" style="background:#444;">🔙 Назад до сезонів</div>`);
    backBtn.on('hover:enter click', function(){ UA_CINEMA.series.load(card); });
    html.append(backBtn);
    
    episodes.forEach(ep => {
        let el = $(`<div class="ua-cinema-episode selector" data-ep="${ep.episode_number}">Серія ${ep.episode_number} — ${ep.name || ''}</div>`);
        el.on('hover:enter click', function(){
            UA_CINEMA.showLoader();
            UA_CINEMA.search.start(card);
        });
        html.append(el);
    });
    UA_CINEMA.modalContent.empty().append(html);
};

/* --- Site Parsers --- */
function extractYearMatch(text){
    let match = text.match(/\b(19|20)\d{2}\b/);
    return match ? parseInt(match[0]) : 0;
}

const buildSiteEngine = (searchUrlTemplate, linkSelector) => {
    return {
        search: async function(query, year){
            let url = searchUrlTemplate.replace('{query}', encodeURIComponent(query));
            let html = await UA_CINEMA.request(url);
            let doc = new DOMParser().parseFromString(html,'text/html');
            let links = doc.querySelectorAll(linkSelector);
            let results = [];
            links.forEach(el => {
                let href = el.getAttribute('href');
                let title = el.textContent.trim();
                let y = extractYearMatch(title);
                if(href && (!year || !y || year === y)) {
                    results.push({ title: title, year: y, url: href });
                }
            });
            return results;
        }
    };
};

UA_CINEMA.SITES.uaserial = buildSiteEngine('https://uaserial.tv/search?query={query}', 'a[href*="/movie-"], a[href*="/serial-"]');
UA_CINEMA.SITES.uaserials = buildSiteEngine('https://uaserials.my/index.php?do=search&subaction=search&story={query}', 'a[href*=".html"]');
UA_CINEMA.SITES.uakino = buildSiteEngine('https://uakino-bay.net/search/{query}', 'a[href*=".html"]');
UA_CINEMA.SITES.uafix = buildSiteEngine('https://uafix.net/index.php?do=search&subaction=search&story={query}', 'a[href*="/"]');
UA_CINEMA.SITES.kinotron = buildSiteEngine('https://kinotron.tv/index.php?do=search&subaction=search&story={query}', 'a[href*=".html"]');
UA_CINEMA.SITES.lavakino = buildSiteEngine('https://lavakino.cc/index.php?do=search&subaction=search&story={query}', 'a[href*=".html"]');
UA_CINEMA.SITES.uakinogo = buildSiteEngine('https://uakinogo.io/index.php?do=search&subaction=search&story={query}', 'a[href*=".html"]');
UA_CINEMA.SITES.hdrezka = buildSiteEngine('https://hdrezka.inc/search/?do=search&subaction=search&q={query}', 'a[href*=".html"]');
UA_CINEMA.SITES.filmix = buildSiteEngine('https://filmix.my/search/{query}', 'a[href*=".html"]');

/* --- Styles Injection --- */
UA_CINEMA.injectStyles = function(){
    if(UA_CINEMA.hooks.stylesInjected) return;
    UA_CINEMA.hooks.stylesInjected = true;
    let style = document.createElement('style');
    style.innerHTML = `
        .ua-cinema-modal {position: fixed; z-index: 999999; left:0; top:0; right:0; bottom:0;}
        .ua-cinema-modal__bg {position:absolute; left:0; top:0; right:0; bottom:0; background-size:cover; background-position:center; filter: blur(20px); opacity:0.3;}
        .ua-cinema-modal__overlay {position:absolute; left:0; top:0; right:0; bottom:0; background: linear-gradient(to bottom, rgba(0,0,0,0.9), rgba(0,0,0,0.95));}
        .ua-cinema-modal__body {position:absolute; left:0; top:0; right:0; bottom:0; padding:60px; overflow:auto;}
        .ua-cinema-modal__header {display:flex; justify-content:space-between; align-items:center;}
        .ua-cinema-modal__title {font-size:32px; font-weight:600;}
        .ua-cinema-modal__close {font-size:20px; padding: 10px 20px; background: rgba(255,255,255,0.1); border-radius: 10px; cursor:pointer;}
        .ua-cinema-modal__close:hover {background: rgba(255,0,0,0.5);}
        .ua-cinema-modal__content {margin-top:40px;}
        .ua-cinema-loader {text-align:center; margin-top:100px;}
        .ua-cinema-loader__spinner {width:60px; height:60px; border:5px solid rgba(255,255,255,0.2); border-top:5px solid #ffd700; border-radius:50%; animation: ua-cinema-spin 1s linear infinite; margin:0 auto;}
        .ua-cinema-loader__text {margin-top:20px; font-size:20px;}
        @keyframes ua-cinema-spin {from {transform:rotate(0deg);} to {transform:rotate(360deg);}}
        .ua-cinema-item, .ua-cinema-season, .ua-cinema-episode, .ua-cinema-resume {padding:15px; margin:10px 0; background:rgba(255,255,255,0.05); border-radius:10px; cursor:pointer; transition: 0.2s;}
        .ua-cinema-item:hover, .ua-cinema-season:hover, .ua-cinema-episode:hover, .ua-cinema-resume:hover {background:rgba(255,255,255,0.2); transform: scale(1.02);}
        .ua-cinema-item.focus, .ua-cinema-season.focus, .ua-cinema-episode.focus, .ua-cinema-resume.focus, .ua-cinema-modal__close.focus {background:rgba(255,255,255,0.3); outline: 2px solid #ffd700;}
        .ua-cinema-item__site {font-weight:bold; color:#ffd700;}
        .ua-cinema-empty {padding:40px; text-align:center; font-size:20px;}
        .ua-cinema-resume {background:rgba(255,215,0,0.1);}
    `;
    document.head.appendChild(style);
};

/* --- Start Safe Init --- */
UA_CINEMA.init = function(){
    UA_CINEMA.log('init plugin v'+UA_CINEMA.VERSION);
    UA_CINEMA.initButtonObserver();
};

if(window.Lampa){ UA_CINEMA.init(); }else{ window.addEventListener('lampa', function(){ UA_CINEMA.init(); }); }

})();
