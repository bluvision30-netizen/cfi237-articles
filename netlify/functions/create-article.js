// REMPLACE UNIQUEMENT la fonction createSharePage
async function createSharePage(articleData, articleId) {
  try {
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const REPO = 'bluvision30-netizen/cfi237-articles';
    
    if (!GITHUB_TOKEN) {
      console.log('❌ GITHUB_TOKEN manquant pour page share');
      return { success: false, error: 'Token manquant' };
    }

    const images = JSON.parse(articleData.images || '[]');
    let firstImage = images[0] || articleData.image;

    // ✅ FORMAT SPÉCIAL FACEBOOK
    if (firstImage.includes('cloudinary')) {
      firstImage = firstImage.replace(/\.(webp|png)/, '.jpg') + '?fm=jpg&q=80&face=true';
    }

    const shareHTML = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${articleData.titre} - Abu Media Group</title>
    
    <!-- ✅ META TAGS FACEBOOK RENFORCÉS -->
    <meta property="og:title" content="${articleData.titre}">
    <meta property="og:description" content="${articleData.extrait}">
    <meta property="og:image" content="${firstImage}">
    <meta property="og:url" content="https://cfiupload.netlify.app/article-detail.html?id=${articleId}">
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="Abu Media Group">
    <meta property="og:locale" content="fr_FR">
    
    <!-- ✅ FACEBOOK SPECIFIC -->
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:type" content="image/jpeg">
    <meta property="og:image:alt" content="${articleData.titre}">
    
    <!-- ✅ TWITTER -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${articleData.titre}">
    <meta name="twitter:description" content="${articleData.extrait}">
    <meta name="twitter:image" content="${firstImage}">
    <meta name="twitter:site" content="@AbuMediaGroup">
    
    <!-- ✅ AUTRES META -->
    <meta name="description" content="${articleData.extrait}">
    <meta name="author" content="${articleData.auteur}">
    
    <style>body{margin:0;padding:20px;background:#f5f5f5;text-align:center;font-family:Arial,sans-serif}.container{max-width:600px;margin:0 auto;background:white;padding:30px;border-radius:10px}img{max-width:100%;height:auto;border-radius:8px;margin-bottom:20px}h1{color:#333}.extrait{color:#666;line-height:1.5}.share-btn{display:inline-block;padding:12px 24px;margin:8px;border-radius:6px;color:white;text-decoration:none}.whatsapp{background:#25D366}.facebook{background:#3b5998}.read-article{display:inline-block;padding:15px 30px;background:#667eea;color:white;text-decoration:none;border-radius:6px;margin-top:20px}</style>
</head>
<body>
    <div class="container">
        <img src="${firstImage}" alt="${articleData.titre}">
        <h1>${articleData.titre}</h1>
        <div class="extrait">${articleData.extrait}</div>
        
        <div>
            <a href="https://wa.me/?text=${encodeURIComponent(articleData.titre + ' - https://cfiupload.netlify.app/article-detail.html?id=' + articleId)}" class="share-btn whatsapp">📱 WhatsApp</a>
            <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://cfiupload.netlify.app/article-detail.html?id=' + articleId + '&fb_ref=share&fbclid=' + Date.now())}" class="share-btn facebook">📘 Facebook</a>
        </div>
        
        <a href="https://cfiupload.netlify.app/article-detail.html?id=${articleId}" class="read-article">📖 Lire l'article</a>
    </div>

    <!-- ✅ SCRIPT FACEBOOK ULTIME -->
    <script>
        // Détection Facebook
        const isFacebook = /Facebot|facebook|FBAN|FBAV/i.test(navigator.userAgent);
        
        if (isFacebook) {
            console.log('📘 Facebook détecté - Meta tags activés');
            
            // Forcer le rafraîchissement des images pour Facebook
            setTimeout(() => {
                const metaImage = document.querySelector('meta[property="og:image"]');
                const newSrc = metaImage.getAttribute('content').split('?')[0] + '?t=' + Date.now() + '&fb=true';
                metaImage.setAttribute('content', newSrc);
                console.log('🔄 Meta image rafraîchie pour Facebook');
            }, 500);
        } else {
            // Redirection pour les utilisateurs normaux
            setTimeout(() => {
                window.location.href = 'https://cfiupload.netlify.app/article-detail.html?id=${articleId}';
            }, 3000);
        }
        
        // Forcer le cache Facebook
        if (window.location.search.includes('fb=true')) {
            document.title = '📘 ' + document.title;
        }
    </script>
</body>
</html>`;

    const shareUrl = `https://api.github.com/repos/${REPO}/contents/share/${articleId}.html`;

    const response = await fetch(shareUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `🌐 Page share FB: ${articleData.titre}`,
        content: Buffer.from(shareHTML).toString('base64')
      })
    });

    if (!response.ok) {
      throw new Error(`GitHub API: ${response.status}`);
    }

    console.log('✅ Page share FACEBOOK créée:', articleId);
    return { success: true };

  } catch (error) {
    console.error('❌ Erreur page share Facebook:', error);
    return { success: false, error: error.message };
  }
}
