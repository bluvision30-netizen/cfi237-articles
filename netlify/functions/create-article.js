// netlify/functions/create-article.js
const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: 'Method Not Allowed' };
  }

  try {
    const articleData = JSON.parse(event.body);
    
    // Validation des données
    if (!articleData.titre || !articleData.categorie || !articleData.image) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'Données manquantes: titre, categorie ou image requis' 
        })
      };
    }

    // Générer un ID unique
    const articleId = 'art_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // Article complet avec toutes les données
    const completeArticle = {
      id: articleId,
      titre: articleData.titre,
      categorie: articleData.categorie,
      sections: articleData.sections || ['main'],
      contentType: articleData.contentType || 'article',
      image: articleData.image, // Première image = couverture
      images: articleData.images || JSON.stringify([articleData.image]), // Toutes les images
      extrait: articleData.extrait,
      contenu: articleData.contenu,
      auteur: articleData.auteur,
      video_url: articleData.video_url || '',
      date: new Date().toISOString(),
      vues: 0,
      likes: 0,
      share_url: `/share/${articleId}.html`
    };

    // URLs de partage
    const shareUrls = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(completeArticle.titre + ' - ' + window.location.origin + completeArticle.share_url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin + completeArticle.share_url)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(completeArticle.titre)}&url=${encodeURIComponent(window.location.origin + completeArticle.share_url)}`
    };

    // Sauvegarder dans GitHub
    const saveResult = await saveToGitHub(completeArticle);
    
    if (!saveResult.success) {
      throw new Error('Erreur sauvegarde GitHub: ' + saveResult.error);
    }

    // Générer la page de partage
    await generateSharePage(completeArticle);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        articleId: articleId,
        shareUrl: window.location.origin + completeArticle.share_url,
        shareUrls: shareUrls,
        message: 'Article publié avec succès!'
      })
    };

  } catch (error) {
    console.error('❌ Erreur fonction create-article:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: 'Erreur interne: ' + error.message 
      })
    };
  }
};

// Sauvegarde vers GitHub
async function saveToGitHub(article) {
  try {
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const REPO = 'bluvision30-netizen/cfi237-articles';
    const ARTICLES_FILE = 'articles.json';

    // Récupérer les articles existants
    const articlesUrl = `https://raw.githubusercontent.com/${REPO}/main/${ARTICLES_FILE}`;
    const articlesResponse = await fetch(articlesUrl);
    
    let existingArticles = {};
    if (articlesResponse.ok) {
      const content = await articlesResponse.json();
      existingArticles = content.articles || {};
    }

    // Ajouter le nouvel article
    existingArticles[article.id] = article;

    // Mettre à jour le fichier
    const updateUrl = `https://api.github.com/repos/${REPO}/contents/${ARTICLES_FILE}`;
    
    // Récupérer le SHA du fichier existant
    const fileInfoResponse = await fetch(updateUrl, {
      headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
    });
    
    let sha = '';
    if (fileInfoResponse.ok) {
      const fileInfo = await fileInfoResponse.json();
      sha = fileInfo.sha;
    }

    const updateResponse = await fetch(updateUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `Ajout article: ${article.titre}`,
        content: Buffer.from(JSON.stringify({ articles: existingArticles }, null, 2)).toString('base64'),
        sha: sha
      })
    });

    return await updateResponse.json();

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
    
    const sharePageContent = generateShareHTML(article);
    const shareFilePath = `share/${article.id}.html`;

    const updateUrl = `https://api.github.com/repos/${REPO}/contents/${shareFilePath}`;

    const response = await fetch(updateUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `Page share: ${article.titre}`,
        content: Buffer.from(sharePageContent).toString('base64')
      })
    });

    return await response.json();

  } catch (error) {
    console.error('❌ Erreur génération page share:', error);
    return { success: false, error: error.message };
  }
}

// Générer le HTML de partage avec meta tags optimisés
function generateShareHTML(article) {
  const images = JSON.parse(article.images || '[]');
  const firstImage = images[0] || article.image;
  
  return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${article.titre} - Abu Media Group</title>
    
    <!-- Meta Tags WhatsApp/Facebook -->
    <meta property="og:title" content="${article.titre}">
    <meta property="og:description" content="${article.extrait}">
    <meta property="og:image" content="${firstImage}">
    <meta property="og:url" content="${window.location.origin}/share/${article.id}.html">
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="Abu Media Group">
    
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${article.titre}">
    <meta name="twitter:description" content="${article.extrait}">
    <meta name="twitter:image" content="${firstImage}">
    
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: #f5f5f5;
            text-align: center;
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: white; 
            padding: 20px; 
            border-radius: 10px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        img { 
            max-width: 100%; 
            height: auto; 
            border-radius: 8px;
            margin-bottom: 20px;
        }
        h1 { color: #333; margin-bottom: 15px; }
        .extrait { color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 20px; }
        .share-buttons { margin: 30px 0; }
        .share-btn { 
            display: inline-block; 
            padding: 12px 24px; 
            margin: 5px; 
            border-radius: 6px; 
            color: white; 
            text-decoration: none; 
            font-weight: bold;
            transition: transform 0.2s;
        }
        .share-btn:hover { transform: translateY(-2px); }
        .whatsapp { background: #25D366; }
        .facebook { background: #3b5998; }
        .twitter { background: #1DA1F2; }
        .view-article { 
            display: inline-block; 
            padding: 15px 30px; 
            background: #667eea; 
            color: white; 
            text-decoration: none; 
            border-radius: 6px; 
            font-weight: bold;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <img src="${firstImage}" alt="${article.titre}">
        <h1>${article.titre}</h1>
        <div class="extrait">${article.extrait}</div>
        
        <div class="share-buttons">
            <a href="https://wa.me/?text=${encodeURIComponent(article.titre + ' - ' + window.location.origin + '/share/' + article.id + '.html')}" 
               class="share-btn whatsapp" target="_blank">
                📱 Partager sur WhatsApp
            </a>
            <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin + '/share/' + article.id + '.html')}" 
               class="share-btn facebook" target="_blank">
                📘 Partager sur Facebook
            </a>
            <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(article.titre)}&url=${encodeURIComponent(window.location.origin + '/share/' + article.id + '.html')}" 
               class="share-btn twitter" target="_blank">
                🐦 Partager sur Twitter
            </a>
        </div>
        
        <a href="/article-detail.html?id=${article.id}" class="view-article">
            📖 Lire l'article complet
        </a>
    </div>

    <script>
        // Redirection automatique après 3 secondes
        setTimeout(() => {
            window.location.href = '/article-detail.html?id=${article.id}';
        }, 3000);
    </script>
</body>
</html>`;
}
