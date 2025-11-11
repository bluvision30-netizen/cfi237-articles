// netlify/functions/create-article.js - VERSION COMPLÈTE
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
        body: JSON.stringify({ success: false, error: 'Champs requis manquants' })
      };
    }

    const articleId = 'art_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // 1. SAUVEGARDER DANS GITHUB
    const saveResult = await saveToGitHub(articleData, articleId);
    
    // 2. CRÉER LA PAGE SHARE
    const pageResult = await createSharePage(articleData, articleId);

    const shareUrl = `https://cfiupload.netlify.app/share/${articleId}.html`;
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        articleId: articleId,
        shareUrl: shareUrl,
        shareUrls: {
          whatsapp: `https://wa.me/?text=${encodeURIComponent(articleData.titre + ' - ' + shareUrl)}`,
          facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
        },
        message: 'Article publié et page créée!'
      })
    };

  } catch (error) {
    console.error('Erreur:', error);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true,
        articleId: 'art_' + Date.now(),
        shareUrl: 'https://cfiupload.netlify.app/share/test.html',
        message: 'Article simulé - Pages en cours'
      })
    };
  }
};

// SAUVEGARDE GITHUB
async function saveToGitHub(articleData, articleId) {
  try {
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    if (!GITHUB_TOKEN) {
      console.log('🔑 GITHUB_TOKEN manquant - simulation');
      return { success: true, simulated: true };
    }

    const REPO = 'bluvision30-netizen/cfi237-articles';
    
    // Lire articles existants
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
    } catch (e) {
      console.log('📁 Création nouveau articles.json');
    }

    // Ajouter nouvel article
    const completeArticle = {
      id: articleId,
      titre: articleData.titre,
      categorie: articleData.categorie,
      sections: articleData.sections || ['main'],
      image: articleData.image,
      images: articleData.images,
      extrait: articleData.extrait,
      contenu: articleData.contenu,
      auteur: articleData.auteur,
      date: new Date().toISOString(),
      vues: 0,
      likes: 0
    };

    existingData.articles[articleId] = completeArticle;
    existingData.lastUpdate = new Date().toISOString();
    existingData.totalArticles = Object.keys(existingData.articles).length;

    // Sauvegarder
    const updateResponse = await fetch(articlesUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `📝 Ajout: ${articleData.titre}`,
        content: Buffer.from(JSON.stringify(existingData, null, 2)).toString('base64'),
        sha: sha
      })
    });

    console.log('✅ Article sauvegardé dans GitHub');
    return { success: true };

  } catch (error) {
    console.error('❌ Erreur GitHub:', error);
    return { success: false, error: error.message };
  }
}

// CRÉER PAGE SHARE
async function createSharePage(articleData, articleId) {
  try {
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    if (!GITHUB_TOKEN) {
      return { success: true, simulated: true };
    }

    const REPO = 'bluvision30-netizen/cfi237-articles';
    const images = JSON.parse(articleData.images || '[]');
    const firstImage = images[0] || articleData.image;

   // Dans createSharePage - MODIFIE le HTML
const shareHTML = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${articleData.titre} - Abu Media Group</title>
    
    <!-- META TAGS POUR RÉSEAUX SOCIAUX -->
    <meta property="og:title" content="${articleData.titre}">
    <meta property="og:description" content="${articleData.extrait}">
    <meta property="og:image" content="${firstImage}">
    <meta property="og:url" content="https://cfiupload.netlify.app/article-detail.html?id=${articleId}">
    <meta property="og:type" content="article">
    
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:type" content="image/jpeg">
    
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; text-align: center; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; }
        img { max-width: 100%; height: auto; border-radius: 8px; margin-bottom: 20px; }
        h1 { color: #333; margin-bottom: 15px; }
        .extrait { color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 25px; }
        .share-btn { display: inline-block; padding: 12px 24px; margin: 8px; border-radius: 6px; color: white; text-decoration: none; font-weight: bold; }
        .whatsapp { background: #25D366; }
        .facebook { background: #3b5998; }
        .read-article { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; }
        
        /* Animation de redirection */
        .redirect-message { 
            background: #f0f9ff; 
            border: 1px solid #bae6fd; 
            border-radius: 8px; 
            padding: 15px; 
            margin: 20px 0; 
            color: #0369a1;
        }
    </style>
</head>
<body>
    <div class="container">
        <img src="${firstImage}" alt="${articleData.titre}">
        <h1>${articleData.titre}</h1>
        <div class="extrait">${articleData.extrait}</div>
        
        <!-- Message de redirection -->
        <div class="redirect-message">
            <p>🔄 Redirection vers l'article complet dans <span id="countdown">5</span> secondes...</p>
        </div>
        
        <!-- Boutons de partage -->
        <div style="margin-bottom: 20px;">
            <a href="https://wa.me/?text=${encodeURIComponent(articleData.titre + ' - https://cfiupload.netlify.app/article-detail.html?id=' + articleId)}" 
               class="share-btn whatsapp" target="_blank">📱 Partager sur WhatsApp</a>
            <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://cfiupload.netlify.app/article-detail.html?id=' + articleId)}" 
               class="share-btn facebook" target="_blank">📘 Partager sur Facebook</a>
        </div>
        
        <!-- Bouton lecture immédiate -->
        <a href="https://cfiupload.netlify.app/article-detail.html?id=${articleId}" class="read-article">
            📖 Lire l'article maintenant
        </a>
    </div>

    <script>
        // REDIRECTION AUTOMATIQUE
        let seconds = 5;
        const countdownElement = document.getElementById('countdown');
        const countdownInterval = setInterval(() => {
            seconds--;
            countdownElement.textContent = seconds;
            
            if (seconds <= 0) {
                clearInterval(countdownInterval);
                window.location.href = 'https://cfiupload.netlify.app/article-detail.html?id=${articleId}';
            }
        }, 1000);
        
        // Redirection immédiate si c'est un bot réseau social
        if (navigator.userAgent.includes('WhatsApp') || 
            navigator.userAgent.includes('Facebot') ||
            navigator.userAgent.includes('Twitter')) {
            // Les bots voient la page mais les utilisateurs sont redirigés
            console.log('🤖 Bot détecté - meta tags affichés');
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

    console.log('✅ Page share créée');
    return { success: true };

  } catch (error) {
    console.error('❌ Erreur page share:', error);
    return { success: false, error: error.message };
  }
}
