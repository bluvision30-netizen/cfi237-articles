async function createSharePage(articleData, articleId) {
  try {
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    if (!GITHUB_TOKEN) {
      return { success: true, simulated: true };
    }

    const REPO = 'bluvision30-netizen/cfi237-articles';
    const images = JSON.parse(articleData.images || '[]');
    let firstImage = images[0] || articleData.image;

    // ✅ FORCER JPG POUR WHATSAPP
    if (firstImage.includes('cloudinary')) {
      firstImage = firstImage.replace(/\.(webp|png)/, '.jpg') + '?fm=jpg&q=80';
    }

    const shareHTML = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${articleData.titre}</title>
    
    <!-- ✅ META TAGS ULTIME WHATSAPP -->
    <meta property="og:title" content="${articleData.titre}">
    <meta property="og:description" content="${articleData.extrait}">
    <meta property="og:image" content="${firstImage}">
    <meta property="og:url" content="https://cfiupload.netlify.app/article-detail.html?id=${articleId}">
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="Abu Media Group">
    
    <!-- ✅ WHATSAPP SPECIFIC -->
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:type" content="image/jpeg">
    <meta property="og:image:alt" content="${articleData.titre}">
    
    <!-- ✅ TWITTER -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${articleData.titre}">
    <meta name="twitter:description" content="${articleData.extrait}">
    <meta name="twitter:image" content="${firstImage}">
    
    <!-- ✅ FAVICON -->
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📰</text></svg>">
    
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, sans-serif; 
            margin: 0; 
            padding: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container { 
            max-width: 500px; 
            background: white; 
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
            margin: 20px;
        }
        .hero-image {
            width: 100%;
            height: 250px;
            object-fit: cover;
        }
        .content {
            padding: 30px;
        }
        h1 {
            color: #1a202c;
            font-size: 1.5rem;
            margin: 0 0 15px 0;
            line-height: 1.4;
        }
        .extrait {
            color: #4a5568;
            font-size: 1rem;
            line-height: 1.6;
            margin-bottom: 25px;
        }
        .buttons {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
        }
        .btn {
            flex: 1;
            padding: 14px 20px;
            border-radius: 12px;
            text-decoration: none;
            font-weight: 600;
            text-align: center;
            transition: all 0.3s ease;
            min-width: 140px;
        }
        .btn-primary {
            background: #667eea;
            color: white;
        }
        .btn-primary:hover {
            background: #5a6fd8;
            transform: translateY(-2px);
        }
        .btn-whatsapp {
            background: #25D366;
            color: white;
        }
        .btn-facebook {
            background: #3b5998;
            color: white;
        }
        .redirect-info {
            background: #f7fafc;
            border-radius: 10px;
            padding: 15px;
            margin-top: 20px;
            text-align: center;
            color: #4a5568;
            font-size: 0.9rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <img src="${firstImage}" alt="${articleData.titre}" class="hero-image">
        <div class="content">
            <h1>${articleData.titre}</h1>
            <div class="extrait">${articleData.extrait}</div>
            
            <div class="buttons">
                <a href="https://cfiupload.netlify.app/article-detail.html?id=${articleId}" class="btn btn-primary">
                    📖 Lire l'article
                </a>
                <a href="https://wa.me/?text=${encodeURIComponent(articleData.titre + ' - https://cfiupload.netlify.app/article-detail.html?id=' + articleId)}" 
                   class="btn btn-whatsapp" target="_blank">
                    📱 WhatsApp
                </a>
                <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://cfiupload.netlify.app/article-detail.html?id=' + articleId)}" 
                   class="btn btn-facebook" target="_blank">
                    📘 Facebook
                </a>
            </div>
            
            <div class="redirect-info">
                <p>🔄 Redirection automatique dans <strong id="countdown">3</strong>s</p>
            </div>
        </div>
    </div>

    <script>
        // ✅ DÉTECTION WHATSAPP ULTIME
        const isWhatsApp = /WhatsApp|whatsapp/.test(navigator.userAgent);
        const isFacebook = /Facebot|facebook/.test(navigator.userAgent);
        
        console.log('🔍 User Agent:', navigator.userAgent);
        console.log('📱 WhatsApp détecté:', isWhatsApp);
        console.log('📘 Facebook détecté:', isFacebook);
        
        if (isWhatsApp || isFacebook) {
            // ✅ FORCER LE RAFRAÎCHISSEMENT DES META TAGS
            setTimeout(() => {
                const metaImage = document.querySelector('meta[property="og:image"]');
                const currentSrc = metaImage.getAttribute('content');
                const newSrc = currentSrc.split('?')[0] + '?t=' + Date.now() + '&fm=jpg&q=80&whatsapp=true';
                metaImage.setAttribute('content', newSrc);
                console.log('🔄 Meta tags rafraîchis pour WhatsApp');
            }, 100);
        } else {
            // ✅ REDIRECTION AUTOMATIQUE POUR UTILISATEURS NORMAUX
            let seconds = 3;
            const countdownElement = document.getElementById('countdown');
            const countdownInterval = setInterval(() => {
                seconds--;
                countdownElement.textContent = seconds;
                
                if (seconds <= 0) {
                    clearInterval(countdownInterval);
                    window.location.href = 'https://cfiupload.netlify.app/article-detail.html?id=${articleId}';
                }
            }, 1000);
        }
        
        // ✅ FORÇAGE SUPPLÉMENTAIRE POUR WHATSAPP WEB
        if (window.location.hash === '#whatsapp') {
            document.title = '📱 ' + document.title;
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
        message: `🌐 Page share: ${articleData.titre}`,
        content: Buffer.from(shareHTML).toString('base64')
      })
    });

    console.log('✅ Page share ULTIME créée');
    return { success: true };

  } catch (error) {
    console.error('❌ Erreur page share:', error);
    return { success: false, error: error.message };
  }
}
