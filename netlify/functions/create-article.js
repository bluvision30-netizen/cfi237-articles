// Dans netlify/functions/create-article.js - AJOUTE cette partie
function generateUltimateShareHTML(article) {
    const images = JSON.parse(article.images || '[]');
    const firstImage = images[0] || article.image;
    
    return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${article.titre} - Abu Media Group</title>
    
    <!-- META TAGS ULTIME WHATSAPP -->
    <meta property="og:title" content="${article.titre}">
    <meta property="og:description" content="${article.extrait}">
    <meta property="og:image" content="${firstImage}?format=jpg&quality=80">
    <meta property="og:url" content="https://cfiupload.netlify.app/share/${article.id}.html">
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="Abu Media Group">
    
    <!-- WHATSAPP SPECIFIC -->
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:type" content="image/jpeg">
    <meta property="og:image:alt" content="${article.titre}">
    
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${article.titre}">
    <meta name="twitter:description" content="${article.extrait}">
    <meta name="twitter:image" content="${firstImage}?format=jpg&quality=80">
    
    <script>
        // FORÇAGE WHATSAPP ULTIME
        if (window.location.search.includes('whatsapp') || 
            window.location.search.includes('test') ||
            navigator.userAgent.includes('WhatsApp')) {
            
            // Recharger les meta tags pour WhatsApp
            setTimeout(() => {
                const metaImage = document.querySelector('meta[property="og:image"]');
                const currentSrc = metaImage.getAttribute('content');
                const newSrc = currentSrc.split('?')[0] + '?t=' + Date.now() + '&format=jpg&whatsapp=true';
                metaImage.setAttribute('content', newSrc);
                console.log('🔄 WhatsApp refresh ultime');
            }, 500);
        }
    </script>
    
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; text-align: center; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        img { max-width: 100%; height: auto; border-radius: 8px; margin-bottom: 20px; }
        h1 { color: #333; margin-bottom: 15px; }
        .extrait { color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 25px; }
        .share-buttons { margin: 30px 0; }
        .share-btn { display: inline-block; padding: 12px 24px; margin: 8px; border-radius: 6px; color: white; text-decoration: none; font-weight: bold; }
        .whatsapp { background: #25D366; }
        .facebook { background: #3b5998; }
    </style>
</head>
<body>
    <div class="container">
        <img src="${firstImage}" alt="${article.titre}" onerror="this.src='https://picsum.photos/600/400?jpg'">
        <h1>${article.titre}</h1>
        <div class="extrait">${article.extrait}</div>
        
        <div class="share-buttons">
            <a href="https://wa.me/?text=${encodeURIComponent(article.titre + ' - https://cfiupload.netlify.app/share/' + article.id + '.html')}" 
               class="share-btn whatsapp">
                📱 WhatsApp
            </a>
            <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://cfiupload.netlify.app/share/' + article.id + '.html')}" 
               class="share-btn facebook">
               📘 Facebook
            </a>
        </div>
        
        <script>
            // Redirection automatique pour WhatsApp
            if (navigator.userAgent.includes('WhatsApp')) {
                setTimeout(() => {
                    window.location.href = 'https://cfiupload.netlify.app/article-detail.html?id=${article.id}';
                }, 1000);
            }
        </script>
    </div>
</body>
</html>`;
}
