(function(){
'use strict';

/*
#########################################################
UA Cinema Plugin for Lampa (FIXED & OPTIMIZED)
Version: 20.1
#########################################################
*/

if(!window.UA_CINEMA){
    window.UA_CINEMA = {};
    window.UA_CINEMA.hooks = {}; // Для запобігання дублюванню хуків
}

const UA_CINEMA = window.UA_CINEMA;

UA_CINEMA.VERSION = '20.1';
UA_CINEMA.NAME = 'ua_cinema';
UA_CINEMA.STORAGE_KEY = 'ua_cinema_progress';
UA_CINEMA.DEBUG = false;
UA_CINEMA.SITES_PRIORITY = ['uakinogo', 'uaserial', 'uaserials', 'uakino', 'uafix', 'kinotron', 'lavakino', 'hdrezka', 'filmix'];
UA_CINEMA.SITES = UA_CINEMA.SITES || {};

UA_CINEMA.log = function(){
    if(!UA_CINEMA.DEBUG) return;
    console.log('[UA_CINEMA]', ...arguments);
};

/* --- ВАЖЛИВИЙ ФІКС: Обгортка для запитів через мережу Lampa --- */
UA_CINEMA.request = function(url){
    return new Promise(function(resolve, reject){
        if(typeof Lampa.Reguest === 'undefined') {
            reject('Lampa Network module not found');
            return;
        }
        let network = new Lampa.Reguest();
        network.timeout(15000);
        network.request(url, function(res){
            resolve(res);
        }, function(err){
            reject(err);
        }, false, {
            dataType: 'text'
        });
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

UA_CINEMA.storage = UA_CINEMA.storage || {};
UA_CINEMA.storage.getAll = function(){
    let data = Lampa.Storage.get(UA_CINEMA.STORAGE_KEY, {});
    if(!data || typeof data !== 'object') data = {};
    return data;
};
UA_CINEMA.storage.get = function(id){
    if(!id) return null;
    return UA_CINEMA.storage.getAll()[id] || null;
};
UA_CINEMA.storage.set = function(id,data){
    if(!id) return;
    let all = UA_CINEMA.storage.getAll();
    all[id] = data;
    Lampa.Storage.set(UA_CINEMA.STORAGE_KEY, all);
};

/* --- Card Engine --- */
UA_CINEMA.getActiveCard = function(){
    let activity = Lampa.Activity.active();
    if(!activity) return null;
    return activity.card || null;
};

UA_CINEMA.getCardData = function(){
    let card = UA_CINEMA.getActiveCard();
    if(!card) return null;
    let poster = card.poster_path ? Lampa.TMDB.image('w500', card.poster_path) : '';
    let backdrop = card.backdrop_path ? Lampa.TMDB.image('w1280', card.backdrop_path) : '';
    return {
        id: card.id, title: card.title || '', name: card.name || '',
        original_title: card.original_title || '', original_name: card.original_name || '',
        year: UA_CINEMA.getCardYear(card), poster: poster, backdrop: backdrop, card: card
    };
};

/* --- ФІКС: Використовуємо Lampa Listener замість важкого MutationObserver --- */
UA_CINEMA.initButtonObserver = function(){
    if(!UA_CINEMA.hooks.buttonObserver){
        Lampa.Listener.follow('full', function (e) {
            if (e.type === 'build') {
                let html = e.object.activity.render();
                let container = html.find('.full-start__buttons, .full-start-new__buttons').eq(0);
                
                if (container.length && !container.find('.ua-cinema-btn').length) {
                    let btn = document.createElement('div');
                    btn.className = 'full-start__button selector ua-cinema-btn';
                    btn.innerHTML = '🇺🇦 Дивись UA';
                    btn.onclick = function(){ UA_CINEMA.open(); };
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

UA_CINEMA.open = function(){
    let card = UA_CINEMA.getCardData();
    if(!card) return;
    UA_CINEMA.createModal(card);
    UA_CINEMA.showLoader();
    if(UA_CINEMA.series.isSeries()){
        setTimeout(function(){ UA_CINEMA.series.load(); }, 300);
    } else {
        UA_CINEMA.search.start(card);
    }
};

UA_CINEMA.createModal = function(card){
    UA_CINEMA.destroyModal();
    let modal = document.createElement('div');
    modal.className = 'ua-cinema-modal';
    modal.innerHTML = `
    <div class="ua-cinema-modal__bg"></div>
    <div class="ua-cinema-modal__overlay"></div>
    <div class="ua-cinema-modal__body">
        <div class="ua-cinema-modal__header">
            <div class="ua-cinema-modal__title">🇺🇦 Дивись українською</div>
            <div class="ua-cinema-modal__close">✕</div>
        </div>
        <div class="ua-cinema-modal__content"></div>
    </div>`;
    document.body.appendChild(modal);
    UA_CINEMA.modal = modal;
    UA_CINEMA.modalContent = modal.querySelector('.ua-cinema-modal__content');
    modal.querySelector('.ua-cinema-modal__close').onclick = UA_CINEMA.destroyModal;
    
    let bg = card.backdrop || card.poster || '';
    modal.querySelector('.ua-cinema-modal__bg').style.backgroundImage = 'url('+bg+')';
    UA_CINEMA.injectStyles();
};

UA_CINEMA.destroyModal = function(){
    if(!UA_CINEMA.modal) return;
    UA_CINEMA.modal.remove();
    UA_CINEMA.modal = null;
};

UA_CINEMA.showLoader = function(){
    if(!UA_CINEMA.modalContent) return;
    UA_CINEMA.modalContent.innerHTML = `
        <div class="ua-cinema-loader"><div class="ua-cinema-loader__spinner"></div><div class="ua-cinema-loader__text">Пошук...</div></div>`;
};
UA_CINEMA.hideLoader = function(){
    if(!UA_CINEMA.modalContent) return;
    UA_CINEMA.modalContent.innerHTML = '';
};

/* --- Search Engine --- */
UA_CINEMA.search = { results: [], running: false };

UA_CINEMA.search.getTitles = function(card){
    let titles = [];
    if(card.title) titles.push(card.title);
    if(card.name) titles.push(card.name);
    if(card.original_title) titles.push(card.original_title);
    if(card.original_name) titles.push(card.original_name);
    return titles.filter((v,i,a) => a.indexOf(v) === i); // Unique
};

UA_CINEMA.search.start = async function(card){
    if(UA_CINEMA.search.running) return;
    UA_CINEMA.search.running = true;
    UA_CINEMA.search.results = [];
    
    let titles = UA_CINEMA.search.getTitles(card);
    let year = card.year;

    for(let site of UA_CINEMA.SITES_PRIORITY){
        try{
            await UA_CINEMA.search.searchSite(site, titles, year);
        } catch(e) { UA_CINEMA.log('SEARCH ERROR', site, e); }
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
            break; // Стоп якщо знайшли по одному з тайтлів на цьому сайті
        }
    }
};

UA_CINEMA.renderResults = function(){
    UA_CINEMA.hideLoader();
    if(!UA_CINEMA.modalContent) return;
    
    UA_CINEMA.resume.render(); // Рендер кнопки "Продовжити"

    if(!UA_CINEMA.search.results.length){
        UA_CINEMA.modalContent.insertAdjacentHTML('beforeend', `<div class="ua-cinema-empty">Не знайдено озвучок</div>`);
        return;
    }

    let html = '';
    for(let item of UA_CINEMA.search.results){
        html += `<div class="ua-cinema-item" data-site="${item.site}" data-url="${item.url}">
                    <div class="ua-cinema-item__site">${item.site.toUpperCase()}</div>
                    <div class="ua-cinema-item__title">${item.title} (${item.year})</div>
                 </div>`;
    }
    UA_CINEMA.modalContent.insertAdjacentHTML('beforeend', html);
    
    UA_CINEMA.modalContent.querySelectorAll('.ua-cinema-item').forEach(function(el){
        el.onclick = function(){
            UA_CINEMA.openSource(el.dataset.site, el.dataset.url);
        };
    });
};

/* --- Player & Extract Engine --- */
UA_CINEMA.openSource = async function(site, url){
    try{
        UA_CINEMA.showLoader();
        let stream = await UA_CINEMA.extractStream(site, url);
        UA_CINEMA.hideLoader();
        if(!stream) {
            Lampa.Noty.show('Не вдалося отримати відео');
            UA_CINEMA.renderResults(); // Повернення до результатів
            return;
        }
        UA_CINEMA.play(stream, site, url);
    } catch(e){
        UA_CINEMA.hideLoader();
        Lampa.Noty.show('Помилка відтворення');
    }
};

/* Базовий маршрутизатор екстракторів */
UA_CINEMA.extractStream = async function(site, url){
    if(['uaserials', 'uakino', 'uafix', 'kinotron', 'lavakino', 'uakinogo', 'hdrezka', 'filmix', 'uaserial'].includes(site)){
        return await UA_CINEMA.genericIframeExtractor(url);
    }
    return null;
};

/* --- ФІКС: Універсальний парсер iframe без fetch-CORS і з правильним getAttribute --- */
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
    } catch(e) {
        return null;
    }
};

/* --- Play Engine --- */
UA_CINEMA.play = function(stream, site, sourceUrl){
    let card = UA_CINEMA.getCardData();
    let playerData = {
        title: card.title || card.name || card.original_title,
        url: stream.url,
        type: stream.type || 'hls',
        subtitles: []
    };
    Lampa.Player.play(playerData);
    
    // ФІКС: Безпечний хук таймера
    UA_CINEMA.resume.startTracking(stream.url, site, sourceUrl);
};

/* --- Resume Engine --- */
UA_CINEMA.resume = { current: null, timer: null };

UA_CINEMA.resume.get = function(){
    let card = UA_CINEMA.getCardData();
    if(!card) return null;
    return UA_CINEMA.storage.get(card.id);
};

UA_CINEMA.resume.render = function(){
    let saved = UA_CINEMA.resume.get();
    if(!saved || !saved.stream || !UA_CINEMA.modalContent) return;

    let html = `<div class="ua-cinema-resume">
                    <div class="ua-cinema-resume__title">▶ Продовжити перегляд</div>
                    <div class="ua-cinema-resume__site">Джерело: ${saved.site}</div>
                </div>`;
    UA_CINEMA.modalContent.insertAdjacentHTML('afterbegin', html);
    UA_CINEMA.modalContent.querySelector('.ua-cinema-resume').onclick = function(){
        UA_CINEMA.showLoader();
        UA_CINEMA.play({ url: saved.stream, type: 'hls' }, saved.site, saved.sourceUrl);
        
        setTimeout(function(){
            try{ if(saved.time) Lampa.Player.seek(saved.time); }catch(e){}
        }, 1500);
    };
};

/* ФІКС: Очищення старого таймера щоб не було витоку пам'яті */
UA_CINEMA.resume.startTracking = function(streamUrl, site, sourceUrl){
    let card = UA_CINEMA.getCardData();
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
UA_CINEMA.series.isSeries = function(){
    let card = UA_CINEMA.getCardData();
    return card && (card.card.media_type === 'tv' || card.card.name);
};

UA_CINEMA.series.load = async function(){
    let card = UA_CINEMA.getCardData();
    if(!card) return;
    let seasons = card.card.seasons || [];
    
    if(!seasons.length){
        seasons = await new Promise((resolve) => {
            Lampa.TMDB.api('tv/' + card.card.id, {}, (data) => resolve(data.seasons || []), () => resolve([]));
        });
    }
    UA_CINEMA.series.renderSeasons(seasons);
};

UA_CINEMA.series.renderSeasons = function(seasons){
    if(!UA_CINEMA.modalContent) return;
    let html = '<div class="ua-cinema-seasons">';
    seasons.forEach(s => {
        if(s.season_number > 0) html += `<div class="ua-cinema-season" data-season="${s.season_number}">Сезон ${s.season_number}</div>`;
    });
    html += '</div>';
    UA_CINEMA.modalContent.innerHTML = html;
    
    UA_CINEMA.modalContent.querySelectorAll('.ua-cinema-season').forEach(el => {
        el.onclick = async function(){
            UA_CINEMA.showLoader();
            let season = parseInt(el.dataset.season);
            let episodes = await new Promise((resolve) => {
                Lampa.TMDB.api('tv/' + UA_CINEMA.getCardData().card.id + '/season/' + season, {}, (data) => resolve(data.episodes || []), () => resolve([]));
            });
            UA_CINEMA.hideLoader();
            UA_CINEMA.series.renderEpisodes(season, episodes);
        };
    });
};

UA_CINEMA.series.renderEpisodes = function(season, episodes){
    if(!UA_CINEMA.modalContent) return;
    let html = '<div class="ua-cinema-episodes"><div class="ua-cinema-season" style="background:#444;" onclick="UA_CINEMA.series.load()">🔙 Назад до сезонів</div>';
    episodes.forEach(ep => {
        html += `<div class="ua-cinema-episode" data-ep="${ep.episode_number}">Серія ${ep.episode_number} — ${ep.name || ''}</div>`;
    });
    html += '</div>';
    UA_CINEMA.modalContent.innerHTML = html;
    
    UA_CINEMA.modalContent.querySelectorAll('.ua-cinema-episode').forEach(el => {
        el.onclick = function(){
            UA_CINEMA.showLoader();
            UA_CINEMA.search.start(UA_CINEMA.getCardData());
        };
    });
};

/* --- Утиліта для парсингу сайтів --- */
function extractYearMatch(text){
    let match = text.match(/\b(19|20)\d{2}\b/);
    return match ? parseInt(match[0]) : 0;
}

/* --- Вбудовані парсери (БЕЗ CORS-помилок) --- */
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

// Реєстрація всіх ресурсів:
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
        .ua-cinema-modal__close {font-size:28px; cursor:pointer;}
        .ua-cinema-modal__content {margin-top:40px;}
        .ua-cinema-loader {text-align:center; margin-top:100px;}
        .ua-cinema-loader__spinner {width:60px; height:60px; border:5px solid rgba(255,255,255,0.2); border-top:5px solid #ffd700; border-radius:50%; animation: ua-cinema-spin 1s linear infinite; margin:0 auto;}
        .ua-cinema-loader__text {margin-top:20px; font-size:20px;}
        @keyframes ua-cinema-spin {from {transform:rotate(0deg);} to {transform:rotate(360deg);}}
        .ua-cinema-item, .ua-cinema-season, .ua-cinema-episode, .ua-cinema-resume {padding:15px; margin:10px 0; background:rgba(255,255,255,0.05); border-radius:10px; cursor:pointer;}
        .ua-cinema-item:hover, .ua-cinema-season:hover, .ua-cinema-episode:hover, .ua-cinema-resume:hover {background:rgba(255,255,255,0.1);}
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

if(window.Lampa){
    UA_CINEMA.init();
}else{
    window.addEventListener('lampa', function(){ UA_CINEMA.init(); });
}

})();
