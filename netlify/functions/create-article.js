// netlify/functions/create-article.js
const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS, GET'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, error: 'Méthode non autorisée' })
    };
  }

  try {
    console.log('📥 Début traitement article...');
    
    const articleData = JSON.parse(event.body);
    
    // Validation
    const requiredFields = ['titre', 'categorie', 'image', 'extrait', 'contenu', 'auteur'];
    const missingFields = requiredFields.filter(field => !articleData[field]);
    
    if (missingFields.length > 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: `Champs manquants: ${missingFields.join(', ')}` })
      };
    }

    // Générer ID unique
    const articleId = 'art_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // Construire l'article complet
    const completeArticle = {
      id: articleId,
      titre: articleData.titre.trim(),
      categorie: articleData.categorie,
      sections: articleData.sections || ['main'],
      contentType: articleData.contentType || 'article',
      image: articleData.image,
      images: articleData.images || JSON.stringify([articleData.image]),
      extrait: articleData.extrait.trim(),
      contenu: articleData.contenu.trim(),
      auteur: articleData.auteur.trim(),
      video_url: articleData.video_url || '',
      date: new Date().toISOString(),
      vues: 0,
      likes: 0,
      share_url: `/share/${articleId}.html`,
      statut: 'publié'
    };

    console.log('📝 Article créé:', completeArticle.id);

    // 1. SAUVEGARDER DANS GITHUB
    const saveResult = await saveArticleToGitHub(completeArticle);
    if (!saveResult.success) {
      throw new Error('Erreur sauvegarde GitHub: ' + saveResult.error);
    }

    // 2. GÉNÉRER LA PAGE DE PARTAGE
    const pageResult = await generateSharePage(completeArticle);
    if (!pageResult.success) {
      console.warn('⚠️ Page share non générée:', pageResult.error);
    }

    const baseUrl = 'https://cfiupload.netlify.app';
    const shareUrl = `${baseUrl}/share/${articleId}.html`;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        articleId: articleId,
        shareUrl: shareUrl,
        shareUrls: {
          whatsapp: `https://wa.me/?text=${encodeURIComponent(completeArticle.titre + ' - ' + shareUrl)}`,
          facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
          direct: shareUrl
        },
        message: 'Article publié et page share générée!'
      })
    };

  } catch (error) {
    console.error('❌ Erreur fonction:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
};

// Sauvegarder l'article dans GitHub
async function saveArticleToGitHub(article) {
  try {
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const REPO = 'bluvision30-netizen/cfi237-articles';
    
    if (!GITHUB_TOKEN) {
      console.warn('⚠️ GITHUB_TOKEN manquant, simulation sauvegarde');
      return { success: true, simulated: true };
    }

    // Récupérer les articles existants
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
      console.log('📁 Création nouveau fichier articles.json');
    }

    // Ajouter le nouvel article
    existingData.articles[article.id] = article;
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
        message: `➕ Ajout article: ${article.titre}`,
        content: Buffer.from(JSON.stringify(existingData, null, 2)).toString('base64'),
        sha: sha
      })
    });

    if (!updateResponse.ok) {
      throw new Error(`GitHub API: ${updateResponse.status}`);
    }

    console.log('✅ Article sauvegardé dans GitHub');
    return { success: true };

  } catch (error) {
    console.error('❌ Erreur sauvegarde GitHub:', error);
    return { success: false, error: error.message };
  }
}

// Générer la page de partage
async function generateSharePage(article) {
  try {
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const REPO = 'bluvision30-netizen/cfi237-articles';
    
    if (!GITHUB_TOKEN) {
      return { success: true, simulated: true };
    }

    const images = JSON.parse(article.images || '[]');
    const firstImage = images[0] || article.image;
    const baseUrl = 'https://cfiupload.netlify.app';

    const shareHTML = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${article.titre} - Abu Media Group</title>
    
    <!-- Meta Tags Optimisés -->
    <meta property="og:title" content="${article.titre}">
    <meta property="og:description" content="${article.extrait}">
    <meta property="og:image" content="${firstImage}">
    <meta property="og:url" content="${baseUrl}/share/${article.id}.html">
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="Abu Media Group">
    
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${article.titre}">
    <meta name="twitter:description" content="${article.extrait}">
    <meta name="twitter:image" content="${firstImage}">
    
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; text-align: center; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        img { max-width: 100%; height: auto; border-radius: 8px; margin-bottom: 20px; }
        h1 { color: #333; margin-bottom: 15px; }
        .extrait { color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 25px; }
        .share-buttons { margin: 30px 0; }
        .share-btn { display: inline-block; padding: 12px 24px; margin: 8px; border-radius: 6px; color: white; text-decoration: none; font-weight: bold; transition: transform 0.2s; }
        .share-btn:hover { transform: translateY(-2px); }
        .whatsapp { background: #25D366; }
        .facebook { background: #3b5998; }
        .view-article { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <img src="${firstImage}" alt="${article.titre}">
        <h1>${article.titre}</h1>
        <div class="extrait">${article.extrait}</div>
        
        <div class="share-buttons">
            <a href="https://wa.me/?text=${encodeURIComponent(article.titre + ' - ' + baseUrl + '/share/' + article.id + '.html')}" class="share-btn whatsapp">
                📱 Partager sur WhatsApp
            </a>
            <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(baseUrl + '/share/' + article.id + '.html')}" class="share-btn facebook">
                📘 Partager sur Facebook
            </a>
        </div>
        
        <a href="${baseUrl}/article-detail.html?id=${article.id}" class="view-article">
            📖 Lire l'article complet
        </a>
    </div>
</body>
</html>`;

    const shareFilePath = `share/${article.id}.html`;
    const shareUrl = `https://api.github.com/repos/${REPO}/contents/${shareFilePath}`;

    const response = await fetch(shareUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `🌐 Page share: ${article.titre}`,
        content: Buffer.from(shareHTML).toString('base64')
      })
    });

    if (!response.ok) {
      throw new Error(`GitHub API: ${response.status}`);
    }

    console.log('✅ Page share générée:', `${baseUrl}/share/${article.id}.html`);
    return { success: true };

  } catch (error) {
    console.error('❌ Erreur génération page share:', error);
    return { success: false, error: error.message };
  }
}
