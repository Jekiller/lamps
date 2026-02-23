
/*
#########################################################
Block 1
#########################################################
*/

(function(){

'use strict';

/*
#########################################################
UA Cinema Plugin for Lampa
Core Block 1

Version: 20
Author: Vitalik + ChatGPT

This block initializes:

- global namespace
- config
- storage engine
- card data engine
- button injection

#########################################################
*/


/*
#########################################################
GLOBAL NAMESPACE (CRITICAL)
#########################################################
*/

if(!window.UA_CINEMA){
    window.UA_CINEMA = {};
}

const UA_CINEMA = window.UA_CINEMA;


/*
#########################################################
CONFIG
#########################################################
*/

UA_CINEMA.VERSION = '20';

UA_CINEMA.NAME = 'ua_cinema';

UA_CINEMA.STORAGE_KEY = 'ua_cinema_progress';

UA_CINEMA.DEBUG = false;

UA_CINEMA.SITES_PRIORITY = [

    'uakinogo',
    'uaserial',
    'uaserials',
    'uakino',
    'uafix',
    'kinotron',
    'lavakino',
    'hdrezka',
    'filmix'

];

UA_CINEMA.SITES = UA_CINEMA.SITES || {};


/*
#########################################################
LOGGER
#########################################################
*/

UA_CINEMA.log = function(){

    if(!UA_CINEMA.DEBUG) return;

    console.log('[UA_CINEMA]', ...arguments);

};


/*
#########################################################
UTILS
#########################################################
*/

UA_CINEMA.normalizeTitle = function(title){

    if(!title) return '';

    return title
        .toString()
        .toLowerCase()
        .replace(/[^a-zа-яіїє0-9]/gi,'')
        .trim();

};


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

    if(card.release_date)
        return UA_CINEMA.getYearFromDate(card.release_date);

    if(card.first_air_date)
        return UA_CINEMA.getYearFromDate(card.first_air_date);

    if(card.year)
        return UA_CINEMA.getYearFromDate(card.year);

    return 0;

};


/*
#########################################################
STORAGE ENGINE
#########################################################
*/

UA_CINEMA.storage = UA_CINEMA.storage || {};

UA_CINEMA.storage.getAll = function(){

    let data = Lampa.Storage.get(UA_CINEMA.STORAGE_KEY, {});

    if(!data || typeof data !== 'object')
        data = {};

    return data;

};


UA_CINEMA.storage.get = function(id){

    if(!id) return null;

    let all = UA_CINEMA.storage.getAll();

    return all[id] || null;

};


UA_CINEMA.storage.set = function(id,data){

    if(!id) return;

    let all = UA_CINEMA.storage.getAll();

    all[id] = data;

    Lampa.Storage.set(UA_CINEMA.STORAGE_KEY, all);

};


UA_CINEMA.storage.remove = function(id){

    let all = UA_CINEMA.storage.getAll();

    delete all[id];

    Lampa.Storage.set(UA_CINEMA.STORAGE_KEY, all);

};


/*
#########################################################
CARD ENGINE
#########################################################
*/

UA_CINEMA.getActiveCard = function(){

    let activity = Lampa.Activity.active();

    if(!activity) return null;

    return activity.card || null;

};


UA_CINEMA.getCardData = function(){

    let card = UA_CINEMA.getActiveCard();

    if(!card) return null;

    let poster = '';
    let backdrop = '';

    if(card.poster_path)
        poster = Lampa.TMDB.image('w500', card.poster_path);

    if(card.backdrop_path)
        backdrop = Lampa.TMDB.image('w1280', card.backdrop_path);

    return {

        id: card.id,

        title: card.title || '',

        name: card.name || '',

        original_title: card.original_title || '',

        original_name: card.original_name || '',

        year: UA_CINEMA.getCardYear(card),

        poster: poster,

        backdrop: backdrop,

        card: card

    };

};


/*
#########################################################
BUTTON ENGINE
#########################################################
*/

UA_CINEMA.buttonObserver = null;


UA_CINEMA.initButtonObserver = function(){

    if(UA_CINEMA.buttonObserver) return;

    UA_CINEMA.buttonObserver = new MutationObserver(function(){

        let container = document.querySelector('.full-start-new__buttons');

        if(!container) return;

        if(container.querySelector('.ua-cinema-btn')) return;

        UA_CINEMA.createButton(container);

    });

    UA_CINEMA.buttonObserver.observe(document.body, {

        childList: true,
        subtree: true

    });

};


UA_CINEMA.createButton = function(container){

    UA_CINEMA.log('create button');

    let btn = document.createElement('div');

    btn.className =
        'full-start__button selector ua-cinema-btn';

    btn.innerHTML = '🇺🇦 Дивись UA';

    btn.onclick = function(){

        UA_CINEMA.open();

    };

    container.prepend(btn);

};


/*
#########################################################
OPEN HANDLER (EMPTY — BLOCK 2 WILL IMPLEMENT)
#########################################################
*/

UA_CINEMA.open = function(){

    let card = UA_CINEMA.getCardData();

    if(!card) return;

    UA_CINEMA.log('open UA modal', card);

};


/*
#########################################################
PLUGIN INIT
#########################################################
*/

UA_CINEMA.init = function(){

    UA_CINEMA.log('init plugin v'+UA_CINEMA.VERSION);

    UA_CINEMA.initButtonObserver();

};


/*
#########################################################
START SAFE INIT
#########################################################
*/

if(window.Lampa){
    UA_CINEMA.init();
}
else{
    window.addEventListener('lampa', function(){
        UA_CINEMA.init();
    });
}


})();


/*
#########################################################
Block 2
#########################################################
*/

(function(){

'use strict';

if(!window.UA_CINEMA) return;

const UA_CINEMA = window.UA_CINEMA;


/*
#########################################################
MODAL ENGINE
#########################################################
*/


UA_CINEMA.modal = null;
UA_CINEMA.modalContent = null;
UA_CINEMA.modalLoader = null;


/*
#########################################################
OPEN MODAL
#########################################################
*/

UA_CINEMA.open = function(){

    let card = UA_CINEMA.getCardData();

    if(!card) return;

    UA_CINEMA.log('OPEN MODAL', card);

    UA_CINEMA.createModal(card);

    UA_CINEMA.showLoader();

    // BLOCK 3 буде тут запускати search engine

};


/*
#########################################################
CREATE MODAL
#########################################################
*/

UA_CINEMA.createModal = function(card){

    UA_CINEMA.destroyModal();

    let modal = document.createElement('div');

    modal.className = 'ua-cinema-modal';

    modal.innerHTML = `

    <div class="ua-cinema-modal__bg"></div>

    <div class="ua-cinema-modal__overlay"></div>

    <div class="ua-cinema-modal__body">

        <div class="ua-cinema-modal__header">

            <div class="ua-cinema-modal__title">
                🇺🇦 Дивись українською
            </div>

            <div class="ua-cinema-modal__close">
                ✕
            </div>

        </div>

        <div class="ua-cinema-modal__content">

        </div>

    </div>

    `;

    document.body.appendChild(modal);

    UA_CINEMA.modal = modal;

    UA_CINEMA.modalContent =
        modal.querySelector('.ua-cinema-modal__content');


    modal.querySelector('.ua-cinema-modal__close')
        .onclick = UA_CINEMA.destroyModal;


    UA_CINEMA.setBackground(card);

    UA_CINEMA.injectStyles();

};


/*
#########################################################
DESTROY MODAL
#########################################################
*/

UA_CINEMA.destroyModal = function(){

    if(!UA_CINEMA.modal) return;

    UA_CINEMA.modal.remove();

    UA_CINEMA.modal = null;

};


/*
#########################################################
BACKGROUND
#########################################################
*/

UA_CINEMA.setBackground = function(card){

    let bg = '';

    if(card.backdrop)
        bg = card.backdrop;
    else if(card.poster)
        bg = card.poster;

    let el = UA_CINEMA.modal.querySelector('.ua-cinema-modal__bg');

    el.style.backgroundImage =
        'url('+bg+')';

};


/*
#########################################################
LOADER
#########################################################
*/

UA_CINEMA.showLoader = function(){

    if(!UA_CINEMA.modalContent) return;

    UA_CINEMA.modalContent.innerHTML = `

        <div class="ua-cinema-loader">

            <div class="ua-cinema-loader__spinner"></div>

            <div class="ua-cinema-loader__text">
                Пошук українських озвучок...
            </div>

        </div>

    `;

};


UA_CINEMA.hideLoader = function(){

    if(!UA_CINEMA.modalContent) return;

    UA_CINEMA.modalContent.innerHTML = '';

};


/*
#########################################################
STYLES
#########################################################
*/

UA_CINEMA.stylesInjected = false;

UA_CINEMA.injectStyles = function(){

    if(UA_CINEMA.stylesInjected) return;

    UA_CINEMA.stylesInjected = true;

    let style = document.createElement('style');

    style.innerHTML = `


.ua-cinema-modal {

    position: fixed;
    z-index: 999999;

    left:0;
    top:0;
    right:0;
    bottom:0;

}


.ua-cinema-modal__bg {

    position:absolute;

    left:0;
    top:0;
    right:0;
    bottom:0;

    background-size:cover;
    background-position:center;

    filter: blur(20px);
    opacity:0.3;

}


.ua-cinema-modal__overlay {

    position:absolute;

    left:0;
    top:0;
    right:0;
    bottom:0;

    background: linear-gradient(
        to bottom,
        rgba(0,0,0,0.9),
        rgba(0,0,0,0.95)
    );

}


.ua-cinema-modal__body {

    position:absolute;

    left:0;
    top:0;
    right:0;
    bottom:0;

    padding:60px;

    overflow:auto;

}


.ua-cinema-modal__header {

    display:flex;
    justify-content:space-between;
    align-items:center;

}


.ua-cinema-modal__title {

    font-size:32px;
    font-weight:600;

}


.ua-cinema-modal__close {

    font-size:28px;
    cursor:pointer;

}


.ua-cinema-modal__content {

    margin-top:40px;

}


.ua-cinema-loader {

    text-align:center;
    margin-top:100px;

}


.ua-cinema-loader__spinner {

    width:60px;
    height:60px;

    border:5px solid rgba(255,255,255,0.2);
    border-top:5px solid #ffd700;

    border-radius:50%;

    animation: ua-cinema-spin 1s linear infinite;

    margin:0 auto;

}


.ua-cinema-loader__text {

    margin-top:20px;
    font-size:20px;

}


@keyframes ua-cinema-spin {

    from { transform:rotate(0deg); }
    to { transform:rotate(360deg); }

}


    `;

    document.head.appendChild(style);

};


})();


/*
#########################################################
Block 3
#########################################################
*/

(function(){

'use strict';

if(!window.UA_CINEMA) return;

const UA_CINEMA = window.UA_CINEMA;


/*
#########################################################
SEARCH ENGINE CORE
#########################################################
*/


UA_CINEMA.search = {};

UA_CINEMA.search.results = [];

UA_CINEMA.search.running = false;


/*
#########################################################
GET ALL POSSIBLE TITLES
#########################################################
*/

UA_CINEMA.search.getTitles = function(card){

    let titles = [];

    if(card.title)
        titles.push(card.title);

    if(card.name)
        titles.push(card.name);

    if(card.original_title)
        titles.push(card.original_title);

    if(card.original_name)
        titles.push(card.original_name);

    // remove duplicates

    titles = titles.filter(function(v,i,a){
        return a.indexOf(v) === i;
    });

    UA_CINEMA.log('TITLES', titles);

    return titles;

};


/*
#########################################################
START SEARCH
#########################################################
*/

UA_CINEMA.search.start = async function(card){

    if(UA_CINEMA.search.running)
        return;

    UA_CINEMA.search.running = true;

    UA_CINEMA.search.results = [];

    UA_CINEMA.log('START SEARCH', card);


    let titles = UA_CINEMA.search.getTitles(card);

    let year = card.year;


    for(let site of UA_CINEMA.SITES_PRIORITY){

        try{

            await UA_CINEMA.search.searchSite(
                site,
                titles,
                year
            );

        }
        catch(e){

            UA_CINEMA.log('SEARCH ERROR', site, e);

        }

    }


    UA_CINEMA.search.running = false;

    UA_CINEMA.log('SEARCH DONE', UA_CINEMA.search.results);

    UA_CINEMA.renderResults();

};


/*
#########################################################
SEARCH SINGLE SITE
#########################################################
*/

UA_CINEMA.search.searchSite =
async function(site, titles, year){

    if(!UA_CINEMA.SITES[site]){
        UA_CINEMA.log('SITE NOT IMPLEMENTED', site);
        return;
    }

    let engine = UA_CINEMA.SITES[site];

    for(let title of titles){

        let results =
            await engine.search(title, year);

        if(results && results.length){

            for(let r of results){

                UA_CINEMA.search.results.push({

                    site: site,
                    title: r.title,
                    year: r.year,
                    url: r.url,
                    data: r

                });

            }

        }

    }

};


/*
#########################################################
RENDER RESULTS
#########################################################
*/

UA_CINEMA.renderResults = function(){

    UA_CINEMA.hideLoader();

    let container =
        UA_CINEMA.modalContent;

    if(!container) return;


    if(!UA_CINEMA.search.results.length){

        container.innerHTML = `

            <div class="ua-cinema-empty">

                Не знайдено українських озвучок

            </div>

        `;

        return;

    }


    let html = '';

    for(let item of UA_CINEMA.search.results){

        html += `

            <div class="ua-cinema-item"
                data-site="${item.site}"
                data-url="${item.url}">

                <div class="ua-cinema-item__site">

                    ${item.site.toUpperCase()}

                </div>

                <div class="ua-cinema-item__title">

                    ${item.title}
                    (${item.year})

                </div>

            </div>

        `;

    }


    container.innerHTML = html;


    container.querySelectorAll('.ua-cinema-item')
    .forEach(function(el){

        el.onclick = function(){

            let site = el.dataset.site;
            let url = el.dataset.url;

            UA_CINEMA.openSource(site, url);

        };

    });

};


/*
#########################################################
OPEN SOURCE (BLOCK 5 WILL IMPLEMENT PLAYER)
#########################################################
*/

UA_CINEMA.openSource =
async function(site, url){

    UA_CINEMA.log('OPEN SOURCE', site, url);

};


})();


/*
#########################################################
Block 4
#########################################################
*/

(function(){

'use strict';

if(!window.UA_CINEMA) return;

const UA_CINEMA = window.UA_CINEMA;


/*
#########################################################
UASERIAL.TV SOURCE ENGINE
#########################################################
*/


UA_CINEMA.SITES.uaserial = {};


/*
#########################################################
SEARCH
#########################################################
*/

UA_CINEMA.SITES.uaserial.search =
async function(query, year){

    UA_CINEMA.log('uaserial search', query, year);

    let url =
        'https://uaserial.tv/search?query=' +
        encodeURIComponent(query);

    let response =
        await fetch(url);

    let html =
        await response.text();

    let doc =
        new DOMParser()
        .parseFromString(html, 'text/html');


    let items =
        doc.querySelectorAll('a[href*="/movie-"], a[href*="/serial-"]');

    let results = [];


    items.forEach(function(el){

        let href =
            el.getAttribute('href');

        if(!href) return;

        let title =
            el.textContent.trim();

        let itemYear =
            extractYear(title);

        if(year && itemYear && year !== itemYear)
            return;

        results.push({

            title: title,
            year: itemYear,
            url: href

        });

    });


    UA_CINEMA.log('uaserial results', results);

    return results;

};


/*
#########################################################
EXTRACT YEAR
#########################################################
*/

function extractYear(title){

    let match =
        title.match(/\b(19|20)\d{2}\b/);

    if(match)
        return parseInt(match[0]);

    return 0;

}


})();

/*
#########################################################
Block 5
#########################################################
*/

(function(){

'use strict';

if(!window.UA_CINEMA) return;

const UA_CINEMA = window.UA_CINEMA;


/*
#########################################################
PLAYER ENGINE
#########################################################
*/


UA_CINEMA.openSource =
async function(site, url){

    UA_CINEMA.log('OPEN SOURCE', site, url);

    try{

        UA_CINEMA.showLoader();

        let stream =
            await UA_CINEMA.extractStream(site, url);

        UA_CINEMA.hideLoader();

        if(!stream){

            Lampa.Noty.show('Не вдалося отримати відео');

            return;

        }

        UA_CINEMA.play(stream, site, url);

    }
    catch(e){

        console.error(e);

        Lampa.Noty.show('Помилка відтворення');

    }

};



/*
#########################################################
EXTRACT STREAM ROUTER
#########################################################
*/

UA_CINEMA.extractStream =
async function(site, url){

    if(site === 'uaserial')
        return await extractUASerialStream(url);

    return null;

};



/*
#########################################################
UASERIAL STREAM EXTRACTOR
#########################################################
*/

async function extractUASerialStream(url){

    UA_CINEMA.log('extract uaserial stream', url);

    let response =
        await fetch(url);

    let html =
        await response.text();

    let doc =
        new DOMParser()
        .parseFromString(html, 'text/html');


    let iframe =
        doc.querySelector('iframe');

    if(!iframe)
        return null;


    let iframeSrc =
        iframe.getAttribute('src');

    if(!iframeSrc)
        return null;


    if(iframeSrc.startsWith('//'))
        iframeSrc = 'https:' + iframeSrc;


    UA_CINEMA.log('iframe', iframeSrc);


    // open iframe page

    let iframeResp =
        await fetch(iframeSrc);

    let iframeHtml =
        await iframeResp.text();


    // extract m3u8

    let m3u8 =
        extractM3U8(iframeHtml);

    UA_CINEMA.log('m3u8', m3u8);

    return {

        url: m3u8,
        type: 'hls'

    };

}



/*
#########################################################
EXTRACT M3U8 FROM HTML
#########################################################
*/

function extractM3U8(html){

    let match =
        html.match(/https?:\/\/[^"]+\.m3u8[^"]*/);

    if(match)
        return match[0];

    return null;

}



/*
#########################################################
PLAY IN LAMPA PLAYER
#########################################################
*/

UA_CINEMA.play =
function(stream, site, url){

    UA_CINEMA.log('PLAY', stream);


    let card =
        UA_CINEMA.getCardData();


    let playerData = {

        title:
            card.title ||
            card.name ||
            card.original_title,

        url:
            stream.url,

        type:
            stream.type || 'hls',

        subtitles: [],

    };


    Lampa.Player.play(playerData);


    UA_CINEMA.saveProgress(site, url);

};



/*
#########################################################
SAVE LAST SOURCE
#########################################################
*/

UA_CINEMA.saveProgress =
function(site, url){

    let card =
        UA_CINEMA.getCardData();

    if(!card) return;

    UA_CINEMA.storage.set(card.id, {

        site: site,
        url: url,
        time: Date.now()

    });

};



})();

/*
#########################################################
Block 6
#########################################################
*/

(function(){

'use strict';

if(!window.UA_CINEMA) return;

const UA_CINEMA = window.UA_CINEMA;


/*
#########################################################
RESUME ENGINE
#########################################################
*/


UA_CINEMA.resume = {};

UA_CINEMA.resume.current = null;


/*
#########################################################
GET SAVED PROGRESS
#########################################################
*/

UA_CINEMA.resume.get =
function(){

    let card =
        UA_CINEMA.getCardData();

    if(!card) return null;

    return UA_CINEMA.storage.get(card.id);

};



/*
#########################################################
SHOW CONTINUE BUTTON IN MODAL
#########################################################
*/

UA_CINEMA.resume.render =
function(){

    let saved =
        UA_CINEMA.resume.get();

    if(!saved) return;

    if(!UA_CINEMA.modalContent) return;


    let html = `

        <div class="ua-cinema-resume">

            <div class="ua-cinema-resume__title">

                ▶ Продовжити перегляд

            </div>

            <div class="ua-cinema-resume__site">

                Джерело: ${saved.site}

            </div>

        </div>

    `;


    UA_CINEMA.modalContent.insertAdjacentHTML(
        'afterbegin',
        html
    );


    let el =
        UA_CINEMA.modalContent.querySelector(
            '.ua-cinema-resume'
        );


    el.onclick =
    function(){

        UA_CINEMA.resume.play(saved);

    };

};



/*
#########################################################
PLAY SAVED STREAM
#########################################################
*/

UA_CINEMA.resume.play =
async function(saved){

    UA_CINEMA.showLoader();

    let stream = {

        url: saved.stream,
        type: 'hls'

    };

    UA_CINEMA.hideLoader();

    UA_CINEMA.playWithResume(stream, saved);

};



/*
#########################################################
PLAY WITH RESUME TIME
#########################################################
*/

UA_CINEMA.playWithResume =
function(stream, saved){

    let card =
        UA_CINEMA.getCardData();

    let playerData = {

        title:
            card.title ||
            card.name,

        url:
            stream.url,

        type:
            'hls'

    };


    Lampa.Player.play(playerData);


    // wait player ready

    setTimeout(function(){

        try{

            if(saved.time){

                Lampa.Player.seek(
                    saved.time
                );

            }

        }
        catch(e){}

    }, 1500);


};



/*
#########################################################
SAVE TIME AUTOMATICALLY
#########################################################
*/

UA_CINEMA.resume.startTracking =
function(streamUrl, site, sourceUrl){

    let card =
        UA_CINEMA.getCardData();

    if(!card) return;

    UA_CINEMA.resume.current = {

        cardId: card.id,
        site: site,
        sourceUrl: sourceUrl,
        stream: streamUrl

    };


    UA_CINEMA.resume.timer =
        setInterval(function(){

            try{

                let time =
                    Lampa.Player.video().currentTime;

                UA_CINEMA.storage.set(

                    card.id,

                    {

                        site: site,

                        sourceUrl: sourceUrl,

                        stream: streamUrl,

                        time: time

                    }

                );

            }
            catch(e){}

        }, 5000);

};



/*
#########################################################
HOOK INTO PLAYER
#########################################################
*/

let originalPlay =
    UA_CINEMA.play;


UA_CINEMA.play =
function(stream, site, sourceUrl){

    originalPlay(stream, site, sourceUrl);

    UA_CINEMA.resume.startTracking(
        stream.url,
        site,
        sourceUrl
    );

};



/*
#########################################################
HOOK MODAL RENDER
#########################################################
*/

let originalRender =
    UA_CINEMA.renderResults;


UA_CINEMA.renderResults =
function(){

    originalRender();

    UA_CINEMA.resume.render();

};



})();

/*
#########################################################
Block 7
#########################################################
*/

(function(){

'use strict';

if(!window.UA_CINEMA) return;

const UA_CINEMA = window.UA_CINEMA;


/*
#########################################################
SERIES ENGINE
#########################################################
*/


UA_CINEMA.series = {};

UA_CINEMA.series.current = null;


/*
#########################################################
DETECT IF SERIES
#########################################################
*/

UA_CINEMA.series.isSeries =
function(){

    let card =
        UA_CINEMA.getCardData();

    if(!card) return false;

    if(card.card.media_type === 'tv')
        return true;

    if(card.card.name)
        return true;

    return false;

};



/*
#########################################################
LOAD SEASONS FROM TMDB
#########################################################
*/

UA_CINEMA.series.load =
async function(){

    let card =
        UA_CINEMA.getCardData();

    if(!card) return;


    let id =
        card.card.id;

    let seasons =
        card.card.seasons;


    if(!seasons){

        seasons =
            await loadSeasonsFromAPI(id);

    }


    UA_CINEMA.series.renderSeasons(seasons);

};



/*
#########################################################
LOAD SEASONS VIA TMDB API
#########################################################
*/

async function loadSeasonsFromAPI(id){

    return new Promise(function(resolve){

        Lampa.TMDB.api(
            'tv/' + id,
            {},
            function(data){

                resolve(data.seasons || []);

            },
            function(){

                resolve([]);

            }
        );

    });

}



/*
#########################################################
RENDER SEASONS
#########################################################
*/

UA_CINEMA.series.renderSeasons =
function(seasons){

    let container =
        UA_CINEMA.modalContent;

    if(!container) return;


    let html =
        '<div class="ua-cinema-seasons">';


    seasons.forEach(function(season){

        if(season.season_number === 0)
            return;

        html += `

            <div class="ua-cinema-season"
                data-season="${season.season_number}">

                Сезон ${season.season_number}

            </div>

        `;

    });


    html += '</div>';

    container.innerHTML = html;


    container.querySelectorAll(
        '.ua-cinema-season'
    ).forEach(function(el){

        el.onclick =
        function(){

            let season =
                parseInt(el.dataset.season);

            UA_CINEMA.series.openSeason(
                season
            );

        };

    });

};



/*
#########################################################
OPEN SEASON
#########################################################
*/

UA_CINEMA.series.openSeason =
async function(season){

    let card =
        UA_CINEMA.getCardData();

    let id =
        card.card.id;


    let episodes =
        await loadEpisodes(id, season);


    UA_CINEMA.series.renderEpisodes(
        season,
        episodes
    );

};



/*
#########################################################
LOAD EPISODES
#########################################################
*/

async function loadEpisodes(id, season){

    return new Promise(function(resolve){

        Lampa.TMDB.api(

            'tv/' + id + '/season/' + season,

            {},

            function(data){

                resolve(data.episodes || []);

            },

            function(){

                resolve([]);

            }

        );

    });

}



/*
#########################################################
RENDER EPISODES
#########################################################
*/

UA_CINEMA.series.renderEpisodes =
function(season, episodes){

    let container =
        UA_CINEMA.modalContent;

    if(!container) return;


    let html =
        '<div class="ua-cinema-episodes">';


    episodes.forEach(function(ep){

        html += `

            <div class="ua-cinema-episode"
                data-season="${season}"
                data-episode="${ep.episode_number}">

                Серія ${ep.episode_number}
                — ${ep.name || ''}

            </div>

        `;

    });


    html += '</div>';

    container.innerHTML = html;


    container.querySelectorAll(
        '.ua-cinema-episode'
    ).forEach(function(el){

        el.onclick =
        function(){

            let season =
                parseInt(el.dataset.season);

            let episode =
                parseInt(el.dataset.episode);

            UA_CINEMA.series.selectEpisode(
                season,
                episode
            );

        };

    });

};



/*
#########################################################
SELECT EPISODE → START SEARCH
#########################################################
*/

UA_CINEMA.series.selectEpisode =
function(season, episode){

    UA_CINEMA.series.current = {

        season: season,
        episode: episode

    };


    let card =
        UA_CINEMA.getCardData();

    UA_CINEMA.showLoader();

    UA_CINEMA.search.start(card);

};



/*
#########################################################
HOOK MODAL OPEN
#########################################################
*/

let originalOpen =
    UA_CINEMA.open;


UA_CINEMA.open =
function(){

    originalOpen();

    if(
        UA_CINEMA.series.isSeries()
    ){

        setTimeout(function(){

            UA_CINEMA.series.load();

        }, 300);

    }

};


})();

/*
#########################################################
Block 8
#########################################################
*/

(function(){

'use strict';

if(!window.UA_CINEMA) return;

const UA_CINEMA = window.UA_CINEMA;


/*
#########################################################
HELPER: EXTRACT YEAR
#########################################################
*/

function extractYear(text){

    if(!text) return 0;

    let match =
        text.match(/\b(19|20)\d{2}\b/);

    if(match)
        return parseInt(match[0]);

    return 0;

}


/*
#########################################################
UASERIALS.MY
#########################################################
*/

UA_CINEMA.SITES.uaserials = {

    search: async function(query, year){

        let url =
            'https://uaserials.my/index.php?do=search&subaction=search&story=' +
            encodeURIComponent(query);

        let resp =
            await fetch(url);

        let html =
            await resp.text();

        let doc =
            new DOMParser()
            .parseFromString(html,'text/html');

        let links =
            doc.querySelectorAll('a[href*=".html"]');

        let results = [];

        links.forEach(function(el){

            let href =
                el.href;

            let title =
                el.textContent.trim();

            let y =
                extractYear(title);

            if(year && y && year !== y)
                return;

            results.push({

                title: title,
                year: y,
                url: href

            });

        });

        return results;

    }

};



/*
#########################################################
UAKINO-BAY.NET
#########################################################
*/

UA_CINEMA.SITES.uakino = {

    search: async function(query, year){

        let url =
            'https://uakino-bay.net/search/' +
            encodeURIComponent(query);

        let resp =
            await fetch(url);

        let html =
            await resp.text();

        let doc =
            new DOMParser()
            .parseFromString(html,'text/html');

        let links =
            doc.querySelectorAll('a[href*=".html"]');

        let results = [];

        links.forEach(function(el){

            let href =
                el.href;

            let title =
                el.textContent.trim();

            let y =
                extractYear(title);

            if(year && y && year !== y)
                return;

            results.push({

                title: title,
                year: y,
                url: href

            });

        });

        return results;

    }

};



/*
#########################################################
UAFIX.NET
#########################################################
*/

UA_CINEMA.SITES.uafix = {

    search: async function(query, year){

        let url =
            'https://uafix.net/index.php?do=search&subaction=search&story=' +
            encodeURIComponent(query);

        let resp =
            await fetch(url);

        let html =
            await resp.text();

        let doc =
            new DOMParser()
            .parseFromString(html,'text/html');

        let links =
            doc.querySelectorAll('a[href*="/"]');

        let results = [];

        links.forEach(function(el){

            let href =
                el.href;

            let title =
                el.textContent.trim();

            let y =
                extractYear(title);

            if(year && y && year !== y)
                return;

            results.push({

                title: title,
                year: y,
                url: href

            });

        });

        return results;

    }

};



/*
#########################################################
EXTEND STREAM EXTRACTOR ROUTER
#########################################################
*/

let originalExtract =
    UA_CINEMA.extractStream;

UA_CINEMA.extractStream =
async function(site, url){

    if(
        site === 'uaserials' ||
        site === 'uakino' ||
        site === 'uafix'
    ){

        return await extractIframeStream(url);

    }

    return await originalExtract(site, url);

};



/*
#########################################################
GENERIC IFRAME STREAM EXTRACTOR
#########################################################
*/

async function extractIframeStream(url){

    let resp =
        await fetch(url);

    let html =
        await resp.text();

    let doc =
        new DOMParser()
        .parseFromString(html,'text/html');

    let iframe =
        doc.querySelector('iframe');

    if(!iframe) return null;

    let src =
        iframe.src;

    if(src.startsWith('//'))
        src = 'https:' + src;

    let iframeResp =
        await fetch(src);

    let iframeHtml =
        await iframeResp.text();

    let m3u8 =
        iframeHtml.match(
            /https?:\/\/[^"]+\.m3u8[^"]*/
        );

    if(!m3u8) return null;

    return {

        url: m3u8[0],
        type: 'hls'

    };

}


})();

/*
#########################################################
Block 9
#########################################################
*/

(function(){

'use strict';

if(!window.UA_CINEMA) return;

const UA_CINEMA = window.UA_CINEMA;


/*
#########################################################
HELPER YEAR EXTRACT
#########################################################
*/

function extractYear(text){

    if(!text) return 0;

    let match =
        text.match(/\b(19|20)\d{2}\b/);

    if(match)
        return parseInt(match[0]);

    return 0;

}



/*
#########################################################
KINOTRON.TV
#########################################################
*/

UA_CINEMA.SITES.kinotron = {

    search: async function(query, year){

        let url =
            'https://kinotron.tv/index.php?do=search&subaction=search&story=' +
            encodeURIComponent(query);

        let resp =
            await fetch(url);

        let html =
            await resp.text();

        let doc =
            new DOMParser()
            .parseFromString(html,'text/html');

        let links =
            doc.querySelectorAll('a[href*=".html"]');

        let results = [];

        links.forEach(function(el){

            let href =
                el.href;

            let title =
                el.textContent.trim();

            let y =
                extractYear(title);

            if(year && y && year !== y)
                return;

            results.push({

                title: title,
                year: y,
                url: href

            });

        });

        return results;

    }

};



/*
#########################################################
LAVAKINO.CC
#########################################################
*/

UA_CINEMA.SITES.lavakino = {

    search: async function(query, year){

        let url =
            'https://lavakino.cc/index.php?do=search&subaction=search&story=' +
            encodeURIComponent(query);

        let resp =
            await fetch(url);

        let html =
            await resp.text();

        let doc =
            new DOMParser()
            .parseFromString(html,'text/html');

        let links =
            doc.querySelectorAll('a[href*=".html"]');

        let results = [];

        links.forEach(function(el){

            let href =
                el.href;

            let title =
                el.textContent.trim();

            let y =
                extractYear(title);

            if(year && y && year !== y)
                return;

            results.push({

                title: title,
                year: y,
                url: href

            });

        });

        return results;

    }

};



/*
#########################################################
UAKINOGO.IO
#########################################################
*/

UA_CINEMA.SITES.uakinogo = {

    search: async function(query, year){

        let url =
            'https://uakinogo.io/index.php?do=search&subaction=search&story=' +
            encodeURIComponent(query);

        let resp =
            await fetch(url);

        let html =
            await resp.text();

        let doc =
            new DOMParser()
            .parseFromString(html,'text/html');

        let links =
            doc.querySelectorAll('a[href*=".html"]');

        let results = [];

        links.forEach(function(el){

            let href =
                el.href;

            let title =
                el.textContent.trim();

            let y =
                extractYear(title);

            if(year && y && year !== y)
                return;

            results.push({

                title: title,
                year: y,
                url: href

            });

        });

        return results;

    }

};



/*
#########################################################
EXTEND STREAM ROUTER
#########################################################
*/

let prevExtract =
    UA_CINEMA.extractStream;

UA_CINEMA.extractStream =
async function(site, url){

    if(
        site === 'kinotron' ||
        site === 'lavakino' ||
        site === 'uakinogo'
    ){

        return await genericIframeExtractor(url);

    }

    return await prevExtract(site, url);

};



/*
#########################################################
GENERIC IFRAME EXTRACTOR
#########################################################
*/

async function genericIframeExtractor(url){

    let resp =
        await fetch(url);

    let html =
        await resp.text();

    let doc =
        new DOMParser()
        .parseFromString(html,'text/html');


    let iframe =
        doc.querySelector('iframe');

    if(!iframe)
        return null;


    let src =
        iframe.src;

    if(src.startsWith('//'))
        src = 'https:' + src;


    let iframeResp =
        await fetch(src);

    let iframeHtml =
        await iframeResp.text();


    let m3u8 =
        iframeHtml.match(
            /https?:\/\/[^"]+\.m3u8[^"]*/
        );

    if(!m3u8)
        return null;


    return {

        url: m3u8[0],
        type: 'hls'

    };

}


})();

/*
#########################################################
Block 10
#########################################################
*/

(function(){

'use strict';

if(!window.UA_CINEMA) return;

const UA_CINEMA = window.UA_CINEMA;


/*
#########################################################
HELPER YEAR
#########################################################
*/

function extractYear(text){

    if(!text) return 0;

    let match =
        text.match(/\b(19|20)\d{2}\b/);

    if(match)
        return parseInt(match[0]);

    return 0;

}



/*
#########################################################
HDREZKA.INC
#########################################################
*/

UA_CINEMA.SITES.hdrezka = {

    search: async function(query, year){

        let url =
            'https://hdrezka.inc/search/?do=search&subaction=search&q=' +
            encodeURIComponent(query);

        let resp =
            await fetch(url);

        let html =
            await resp.text();

        let doc =
            new DOMParser()
            .parseFromString(html,'text/html');

        let links =
            doc.querySelectorAll('a[href*=".html"]');

        let results = [];

        links.forEach(function(el){

            let href =
                el.href;

            let title =
                el.textContent.trim();

            let y =
                extractYear(title);

            if(year && y && year !== y)
                return;

            results.push({

                title: title,
                year: y,
                url: href

            });

        });

        return results;

    }

};



/*
#########################################################
FILMIX.MY
#########################################################
*/

UA_CINEMA.SITES.filmix = {

    search: async function(query, year){

        let url =
            'https://filmix.my/search/' +
            encodeURIComponent(query);

        let resp =
            await fetch(url);

        let html =
            await resp.text();

        let doc =
            new DOMParser()
            .parseFromString(html,'text/html');

        let links =
            doc.querySelectorAll('a[href*=".html"]');

        let results = [];

        links.forEach(function(el){

            let href =
                el.href;

            let title =
                el.textContent.trim();

            let y =
                extractYear(title);

            if(year && y && year !== y)
                return;

            results.push({

                title: title,
                year: y,
                url: href

            });

        });

        return results;

    }

};



/*
#########################################################
EXTEND STREAM ROUTER FINAL
#########################################################
*/

let prevExtractor =
    UA_CINEMA.extractStream;

UA_CINEMA.extractStream =
async function(site, url){

    if(
        site === 'hdrezka' ||
        site === 'filmix'
    ){

        return await finalIframeExtractor(url);

    }

    return await prevExtractor(site, url);

};



/*
#########################################################
FINAL IFRAME EXTRACTOR
#########################################################
*/

async function finalIframeExtractor(url){

    try{

        let resp =
            await fetch(url);

        let html =
            await resp.text();

        let doc =
            new DOMParser()
            .parseFromString(html,'text/html');


        let iframe =
            doc.querySelector('iframe');

        if(!iframe)
            return null;


        let src =
            iframe.src;

        if(src.startsWith('//'))
            src = 'https:' + src;


        let iframeResp =
            await fetch(src);

        let iframeHtml =
            await iframeResp.text();


        let m3u8 =
            iframeHtml.match(
                /https?:\/\/[^"]+\.m3u8[^"]*/
            );

        if(!m3u8)
            return null;


        return {

            url: m3u8[0],
            type: 'hls'

        };

    }
    catch(e){

        console.error(e);

        return null;

    }

}



/*
#########################################################
FINAL UI EMPTY STYLE
#########################################################
*/

let style =
document.createElement('style');

style.innerHTML = `

.ua-cinema-item{

    padding:15px;
    margin:10px 0;

    background:rgba(255,255,255,0.05);

    border-radius:10px;

    cursor:pointer;

}

.ua-cinema-item:hover{

    background:rgba(255,255,255,0.1);

}

.ua-cinema-item__site{

    font-weight:bold;
    color:#ffd700;

}

.ua-cinema-empty{

    padding:40px;
    text-align:center;
    font-size:20px;

}

.ua-cinema-season,
.ua-cinema-episode{

    padding:15px;
    margin:5px;

    background:rgba(255,255,255,0.05);

    border-radius:8px;

    cursor:pointer;

}

.ua-cinema-resume{

    padding:20px;
    margin-bottom:20px;

    background:rgba(255,215,0,0.1);

    border-radius:10px;

    cursor:pointer;

}

`;

document.head.appendChild(style);



/*
#########################################################
PLUGIN READY
#########################################################
*/

UA_CINEMA.log('UA CINEMA PLUGIN READY');


})();

