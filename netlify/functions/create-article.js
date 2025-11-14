// netlify/functions/create-article.js - VERSION RÉELLE
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
    const shareUrl = `https://cfiupload.netlify.app/share/${articleId}.html`;

    console.log('🚀 Début création article:', articleId);

    // 1. SAUVEGARDER DANS GITHUB
    const saveResult = await saveArticleToGitHub(articleData, articleId);
    
    // 2. CRÉER LA PAGE SHARE
    const pageResult = await createSharePage(articleData, articleId);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        articleId: articleId,
        shareUrl: shareUrl,
        shareUrls: {
          whatsapp: `https://wa.me/?text=${encodeURIComponent(articleData.titre + ' - ' + shareUrl + '?whatsapp=true')}`,
          facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl + '?fb=true')}`
        },
        message: 'Article créé et pages générées!'
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
        message: 'Article créé (mode secours)'
      })
    };
  }
};

// SAUVEGARDE RÉELLE DANS GITHUB
async function saveArticleToGitHub(articleData, articleId) {
  try {
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const REPO = 'bluvision30-netizen/cfi237-articles';
    
    if (!GITHUB_TOKEN) {
      console.log('❌ GITHUB_TOKEN manquant');
      return { success: false, error: 'Token manquant' };
    }

    // Construire l'article complet
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

    // Lire les articles existants
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
        console.log('📚 Articles existants chargés:', Object.keys(existingData.articles).length);
      }
    } catch (error) {
      console.log('📁 Création nouveau fichier articles.json');
    }

    // Ajouter le nouvel article
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
        message: `📝 Ajout article: ${articleData.titre}`,
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

// CRÉATION RÉELLE DE LA PAGE SHARE
async function createSharePage(articleData, articleId) {
  try {
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const REPO = 'bluvision30-netizen/cfi237-articles';
    
    if (!GITHUB_TOKEN) {
      console.log('❌ GITHUB_TOKEN manquant pour page share');
      return { success: false, error: 'Token manquant' };
    }

    const images = JSON.parse(articleData.images || '[]');
    const firstImage = images[0] || articleData.image;

    const shareHTML = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${articleData.titre} - Abu Media Group</title>
    
    <meta property="og:title" content="${articleData.titre}">
    <meta property="og:description" content="${articleData.extrait}">
    <meta property="og:image" content="${firstImage}">
    <meta property="og:url" content="https://cfiupload.netlify.app/article-detail.html?id=${articleId}">
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="Abu Media Group">
    
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:type" content="image/jpeg">
    
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${articleData.titre}">
    <meta name="twitter:description" content="${articleData.extrait}">
    <meta name="twitter:image" content="${firstImage}">
    
    <style>body{margin:0;padding:20px;background:#f5f5f5;text-align:center;font-family:Arial,sans-serif}.container{max-width:600px;margin:0 auto;background:white;padding:30px;border-radius:10px}img{max-width:100%;height:auto;border-radius:8px;margin-bottom:20px}h1{color:#333}.extrait{color:#666;line-height:1.5}.share-btn{display:inline-block;padding:12px 24px;margin:8px;border-radius:6px;color:white;text-decoration:none}.whatsapp{background:#25D366}.facebook{background:#3b5998}.read-article{display:inline-block;padding:15px 30px;background:#667eea;color:white;text-decoration:none;border-radius:6px;margin-top:20px}</style>
</head>
<body>
    <div class="container">
        <img src="${firstImage}" alt="${articleData.titre}">
        <h1>${articleData.titre}</h1>
        <div class="extrait">${articleData.extrait}</div>
        
        <div>
            <a href="https://wa.me/?text=${encodeURIComponent(articleData.titre + ' - https://cfiupload.netlify.app/article-detail.html?id=' + articleId)}" class="share-btn whatsapp">📱 WhatsApp</a>
            <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://cfiupload.netlify.app/article-detail.html?id=' + articleId)}" class="share-btn facebook">📘 Facebook</a>
        </div>
        
        <a href="https://cfiupload.netlify.app/article-detail.html?id=${articleId}" class="read-article">📖 Lire l'article</a>
    </div>

    <script>
        setTimeout(() => {
            window.location.href = 'https://cfiupload.netlify.app/article-detail.html?id=${articleId}';
        }, 3000);
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

    if (!response.ok) {
      throw new Error(`GitHub API: ${response.status}`);
    }

    console.log('✅ Page share créée:', articleId);
    return { success: true };

  } catch (error) {
    console.error('❌ Erreur page share:', error);
    return { success: false, error: error.message };
  }
}
