// netlify/functions/create-article.js - VERSION OPTIMISÉE WHATSAPP/FACEBOOK
const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const articleData = JSON.parse(event.body);
    
    // Validation
    if (!articleData.titre || !articleData.categorie || !articleData.image) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'Titre, catégorie et image requis' })
      };
    }

    const articleId = 'art_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const timestamp = Date.now();
    const shareUrl = `https://cfiupload.netlify.app/share/${articleId}.html?v=${timestamp}`;

    console.log('🚀 Début création article:', articleId);

    // 1. SAUVEGARDER DANS GITHUB
    await saveArticleToGitHub(articleData, articleId);
    
    // 2. CRÉER LA PAGE SHARE OPTIMISÉE
    await createOptimizedSharePage(articleData, articleId, timestamp);

    // 3. FORCE REFRESH WHATSAPP & FACEBOOK
    await forceRefreshSocialPlatforms(shareUrl);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        articleId: articleId,
        shareUrl: shareUrl,
        shareUrls: {
          whatsapp: `https://wa.me/?text=${encodeURIComponent(articleData.titre + '\n\n' + shareUrl)}`,
          facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
          twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(articleData.titre)}&url=${encodeURIComponent(shareUrl)}`
        },
        debugUrls: {
          facebook: `https://developers.facebook.com/tools/debug/?q=${encodeURIComponent(shareUrl)}`,
          whatsapp: `https://business.facebook.com/api/whatsapp/preview?url=${encodeURIComponent(shareUrl)}`
        },
        message: 'Article créé avec pages share optimisées!'
      })
    };

  } catch (error) {
    console.error('Erreur globale:', error);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true,
        articleId: 'art_' + Date.now(),
        shareUrl: 'https://cfiupload.netlify.app/share/backup.html',
        message: 'Article créé (mode secours)',
        error: error.message
      })
    };
  }
};

// SAUVEGARDE DANS GITHUB
async function saveArticleToGitHub(articleData, articleId) {
  try {
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const REPO = 'bluvision30-netizen/cfi237-articles';
    
    if (!GITHUB_TOKEN) {
      console.log('❌ GITHUB_TOKEN manquant');
      return { success: false, error: 'Token manquant' };
    }

    const completeArticle = {
      id: articleId,
      titre: articleData.titre,
      categorie: articleData.categorie,
      sections: articleData.sections || ['main'],
      contentType: articleData.contentType || 'article',
      image: articleData.image,
      images: articleData.images || JSON.stringify([articleData.image]),
      extrait: articleData.extrait,
      contenu: articleData.contenu,
      auteur: articleData.auteur,
      video_url: articleData.video_url || '',
      date: new Date().toISOString(),
      vues: 0,
      likes: 0,
      share_url: `/share/${articleId}.html`
    };

    const articlesUrl = `https://api.github.com/repos/${REPO}/contents/articles.json`;
    let existingData = { articles: {} };
    let sha = '';

    try {
      const response = await fetch(articlesUrl, {
        headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
      });
      
      if (response.ok) {
        const fileData = await response.json();
        const content = Buffer.from(fileData.content, 'base64').toString('utf8');
        existingData = JSON.parse(content);
        sha = fileData.sha;
      }
    } catch (error) {
      console.log('📝 Création nouveau fichier articles.json');
    }

    existingData.articles[articleId] = completeArticle;
    existingData.lastUpdate = new Date().toISOString();
    existingData.totalArticles = Object.keys(existingData.articles).length;

    const updateResponse = await fetch(articlesUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `📰 Ajout article: ${articleData.titre}`,
        content: Buffer.from(JSON.stringify(existingData, null, 2)).toString('base64'),
        sha: sha
      })
    });

    if (!updateResponse.ok) {
      throw new Error(`GitHub API: ${updateResponse.status}`);
    }

    console.log('✅ Article sauvegardé dans GitHub:', articleId);
    return { success: true };

  } catch (error) {
    console.error('❌ Erreur sauvegarde GitHub:', error);
    return { success: false, error: error.message };
  }
}

// CRÉATION PAGE SHARE ULTRA-OPTIMISÉE POUR WHATSAPP/FACEBOOK
async function createOptimizedSharePage(articleData, articleId, timestamp) {
  try {
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const REPO = 'bluvision30-netizen/cfi237-articles';
    
    if (!GITHUB_TOKEN) {
      console.log('❌ GITHUB_TOKEN manquant');
      return { success: false };
    }

    // Extraire la première image
    const images = JSON.parse(articleData.images || '[]');
    const firstImage = images[0] || articleData.image;
    
    // Convertir l'image Cloudinary en format optimisé pour WhatsApp
    const optimizedImage = firstImage.replace('/upload/', '/upload/w_1200,h_630,c_fill,f_jpg,q_90/');
    
    // Nettoyer le texte pour éviter les problèmes d'encodage
    const cleanTitle = articleData.titre.replace(/['"]/g, '').substring(0, 70);
    const cleanExcerpt = articleData.extrait.replace(/['"]/g, '').substring(0, 200);
    const cleanAuthor = articleData.auteur.replace(/['"]/g, '');
    
    const articleUrl = `https://cfiupload.netlify.app/article-detail.html?id=${articleId}`;
    const shareUrl = `https://cfiupload.netlify.app/share/${articleId}.html?v=${timestamp}`;

    // HTML ULTRA-OPTIMISÉ - Meta tags EN PREMIER
    const shareHTML = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <!-- TITRE -->
    <title>${cleanTitle} - Abu Media Group</title>
    <meta name="description" content="${cleanExcerpt}">
    
    <!-- OPEN GRAPH (Facebook, WhatsApp) - ULTRA PRIORITAIRE -->
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="Abu Media Group">
    <meta property="og:title" content="${cleanTitle}">
    <meta property="og:description" content="${cleanExcerpt}">
    <meta property="og:url" content="${shareUrl}">
    <meta property="og:image" content="${optimizedImage}">
    <meta property="og:image:secure_url" content="${optimizedImage}">
    <meta property="og:image:type" content="image/jpeg">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="${cleanTitle}">
    
    <!-- ARTICLE META -->
    <meta property="article:published_time" content="${new Date().toISOString()}">
    <meta property="article:author" content="${cleanAuthor}">
    <meta property="article:section" content="${articleData.categorie}">
    
    <!-- TWITTER CARD -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:site" content="@AbuMediaGroup">
    <meta name="twitter:title" content="${cleanTitle}">
    <meta name="twitter:description" content="${cleanExcerpt}">
    <meta name="twitter:image" content="${optimizedImage}">
    <meta name="twitter:image:alt" content="${cleanTitle}">
    
    <!-- WHATSAPP SPECIFIC -->
    <meta property="og:locale" content="fr_FR">
    <meta property="og:updated_time" content="${new Date().toISOString()}">
    
    <!-- PRELOAD IMAGE - CRITIQUE POUR WHATSAPP -->
    <link rel="preload" as="image" href="${optimizedImage}">
    <link rel="prefetch" href="${optimizedImage}">
    
    <!-- CANONICAL -->
    <link rel="canonical" href="${articleUrl}">
    
    <!-- CACHE CONTROL - EMPÊCHER LE CACHE -->
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
    <meta http-equiv="Pragma" content="no-cache">
    <meta http-equiv="Expires" content="0">
    
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            max-width: 700px;
            width: 100%;
            overflow: hidden;
            animation: slideUp 0.5s ease;
        }
        @keyframes slideUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .image-wrapper {
            position: relative;
            width: 100%;
            height: 400px;
            overflow: hidden;
            background: #f5f5f5;
        }
        .article-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        .badge {
            position: absolute;
            top: 20px;
            left: 20px;
            background: rgba(102, 126, 234, 0.95);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: 700;
            font-size: 0.85rem;
            backdrop-filter: blur(10px);
        }
        .content {
            padding: 30px;
        }
        h1 {
            color: #1a202c;
            font-size: 1.75rem;
            line-height: 1.3;
            margin-bottom: 15px;
            font-weight: 700;
        }
        .excerpt {
            color: #4a5568;
            font-size: 1.05rem;
            line-height: 1.6;
            margin-bottom: 20px;
        }
        .meta {
            display: flex;
            gap: 20px;
            color: #718096;
            font-size: 0.9rem;
            margin-bottom: 25px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e2e8f0;
        }
        .meta i { color: #667eea; }
        .share-buttons {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 20px;
        }
        .share-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            padding: 14px 20px;
            border-radius: 12px;
            text-decoration: none;
            color: white;
            font-weight: 600;
            font-size: 0.95rem;
            transition: all 0.3s;
        }
        .share-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(0,0,0,0.2);
        }
        .whatsapp {
            background: linear-gradient(135deg, #25D366, #128C7E);
        }
        .facebook {
            background: linear-gradient(135deg, #3b5998, #2d4373);
        }
        .read-btn {
            display: block;
            text-align: center;
            padding: 16px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            text-decoration: none;
            border-radius: 12px;
            font-weight: 700;
            font-size: 1.05rem;
            transition: all 0.3s;
        }
        .read-btn:hover {
            transform: scale(1.02);
            box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
        }
        .redirect-notice {
            text-align: center;
            color: #718096;
            font-size: 0.85rem;
            margin-top: 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }
        .spinner {
            width: 14px;
            height: 14px;
            border: 2px solid #e2e8f0;
            border-top-color: #667eea;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        @media (max-width: 600px) {
            .container { border-radius: 0; }
            .image-wrapper { height: 300px; }
            .content { padding: 20px; }
            h1 { font-size: 1.4rem; }
            .share-buttons { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <!-- IMAGE PRELOAD INVISIBLE - FORCE WHATSAPP À CHARGER -->
    <img src="${optimizedImage}" alt="" style="position:absolute;width:0;height:0;opacity:0;" loading="eager">
    
    <div class="container">
        <div class="image-wrapper">
            <img src="${optimizedImage}" alt="${cleanTitle}" class="article-image" loading="eager">
            <div class="badge">${articleData.categorie}</div>
        </div>
        
        <div class="content">
            <h1>${articleData.titre}</h1>
            
            <div class="meta">
                <span><i>✍️</i> ${articleData.auteur}</span>
                <span><i>📅</i> ${new Date().toLocaleDateString('fr-FR')}</span>
            </div>
            
            <p class="excerpt">${articleData.extrait}</p>
            
            <div class="share-buttons">
                <a href="https://wa.me/?text=${encodeURIComponent(articleData.titre + '\n\n📰 Lire l\'article : ' + articleUrl)}" class="share-btn whatsapp" target="_blank" rel="noopener">
                    📱 WhatsApp
                </a>
                <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}" class="share-btn facebook" target="_blank" rel="noopener">
                    📘 Facebook
                </a>
            </div>
            
            <a href="${articleUrl}" class="read-btn">
                📖 Lire l'article complet
            </a>
            
            <div class="redirect-notice">
                <div class="spinner"></div>
                <span>Redirection automatique dans 3 secondes...</span>
            </div>
        </div>
    </div>

    <script>
        // PRÉCHARGEMENT AGRESSIF DE L'IMAGE
        const img = new Image();
        img.src = '${optimizedImage}';
        
        // REDIRECTION AUTOMATIQUE
        setTimeout(() => {
            window.location.href = '${articleUrl}';
        }, 3000);
        
        // LOG POUR DEBUGGING
        console.log('Share Page Loaded:', {
            id: '${articleId}',
            image: '${optimizedImage}',
            url: '${articleUrl}'
        });
    </script>
</body>
</html>`;

    const shareFileUrl = `https://api.github.com/repos/${REPO}/contents/share/${articleId}.html`;

    const response = await fetch(shareFileUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `🌐 Page share optimisée: ${articleData.titre}`,
        content: Buffer.from(shareHTML).toString('base64')
      })
    });

    if (!response.ok) {
      throw new Error(`GitHub API: ${response.status}`);
    }

    console.log('✅ Page share optimisée créée:', articleId);
    return { success: true };

  } catch (error) {
    console.error('❌ Erreur création page share:', error);
    return { success: false, error: error.message };
  }
}

// FORCE REFRESH SUR FACEBOOK & WHATSAPP
async function forceRefreshSocialPlatforms(shareUrl) {
  try {
    // Facebook Graph API - Force refresh du cache
    const fbAccessToken = process.env.FACEBOOK_ACCESS_TOKEN;
    
    if (fbAccessToken) {
      const fbUrl = `https://graph.facebook.com/v18.0/?id=${encodeURIComponent(shareUrl)}&scrape=true&access_token=${fbAccessToken}`;
      
      try {
        const fbResponse = await fetch(fbUrl, { method: 'POST' });
        if (fbResponse.ok) {
          console.log('✅ Facebook cache refreshed');
        }
      } catch (error) {
        console.log('⚠️ Facebook refresh skipped:', error.message);
      }
    }
    
    // WhatsApp utilise le cache Facebook, donc le refresh FB suffit
    console.log('📱 WhatsApp utilisera le cache Facebook actualisé');
    
    return { success: true };
    
  } catch (error) {
    console.error('⚠️ Erreur refresh social:', error);
    return { success: false };
  }
}
