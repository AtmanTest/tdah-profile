/**
 * News Ticker — Simple top-3 display (no scrolling)
 * Fetches news.json, shows latest 3 articles in a clean strip
 */
(function(){
  'use strict';
  const BANNER = document.getElementById('news-ticker');
  const LIST_EL = document.getElementById('news-list');
  const FILTERS = document.getElementById('news-filters');
  var cachedArticles = [];

  function esc(s){
    return String(s).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }

  function fmtDate(d){
    if(!d) return '';
    try{var dt=new Date(d);return dt.toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}catch(e){return d}
  }

  function getActiveFilter(){
    if(!FILTERS) return 'all';
    var active = FILTERS.querySelector('.news-filter-btn.active');
    return active ? active.getAttribute('data-filter') : 'all';
  }

  function renderNews(){
    var articles = cachedArticles;
    var filter = getActiveFilter();

    // ── Banner: top 3 clean strip (always show top 3 regardless of filter) ──
    if(BANNER){
      var top = articles.slice(0,3);
      BANNER.innerHTML = '<span style="display:flex;align-items:center;gap:.8rem;overflow-x:auto;padding:.1rem 0;white-space:nowrap">' +
        top.map(function(a){
          var t = esc(a.title).replace(/<[^>]*>/g,'');
          return '<a href="'+esc(a.link)+'" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:.3rem;text-decoration:none;color:var(--text);font-size:.72rem;font-weight:500;opacity:.85;flex-shrink:0;max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="'+t+'">'+
            '<span>'+(a.icon||'📰')+'</span>'+
            '<span style="overflow:hidden;text-overflow:ellipsis">'+t+'</span>'+
            '</a>';
        }).join('<span style="color:var(--text-light);opacity:.3;flex-shrink:0">|</span>') +
        '</span>';
    }

    // ── Full list with filter ──
    if(LIST_EL){
      var filtered = (filter === 'all') ? articles : articles.filter(function(a){ return a.lang === filter; });
      LIST_EL.innerHTML = filtered.map(function(a){
        var t = esc(a.title).replace(/<[^>]*>/g,'');
        var d = a.description ? esc(a.description).replace(/<[^>]*>/g,'').substring(0,200) : '';
        return '<div class="news-card">'+
          '<div class="news-card-top">'+
            '<span class="news-source-badge '+(a.lang==='FR'?'fr':'en')+'">'+(a.icon||'📰')+' '+esc(a.source||(a.lang==='FR'?'TDAH France':'ADHD'))+'</span>'+
            (a.date ? '<span class="news-date">'+fmtDate(a.date)+'</span>' : '')+
            (a.lang==='FR' ? '<span style="font-size:.6rem;color:#3d7a3d">FR</span>' : '<span style="font-size:.6rem;color:var(--accent)">EN</span>')+
          '</div>'+
          '<div class="news-card-title"><a href="'+esc(a.link)+'" target="_blank" rel="noopener">'+t+'</a></div>'+
          (d ? '<div class="news-card-desc">'+d+'</div>' : '')+
        '</div>';
      }).join('');
    }
  }

  async function loadNews(){
    try {
      const r = await fetch('news.json?_=' + Date.now());
      if(!r.ok) throw new Error('HTTP '+r.status);
      const d = await r.json();
      cachedArticles = d.articles || [];
      renderNews();
    } catch(e){
      if(BANNER) BANNER.innerHTML = '<span style="color:var(--text-light);font-size:.75rem">Actualités indisponibles</span>';
      if(LIST_EL) LIST_EL.innerHTML = '<div class="news-error">Erreur : '+esc(e.message)+'</div>';
    }
  }

  // ── Filters ──
  if(FILTERS){
    FILTERS.addEventListener('click', function(e){
      var btn = e.target.closest('.news-filter-btn');
      if(!btn) return;
      FILTERS.querySelectorAll('.news-filter-btn').forEach(function(b){ b.classList.remove('active'); });
      btn.classList.add('active');
      renderNews();  // re-render with new filter (no re-fetch)
    });
  }

  // ── Boot ──
  if(document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', loadNews);
  else
    loadNews();
})();
