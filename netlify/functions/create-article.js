// ==========================================
// 🔧 FIX 502 - NETLIFY FUNCTION OPTIMISÉE
// ==========================================
// Fichier: netlify/functions/create-article.js

const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  // Augmenter timeout
  context.callbackWaitsForEmptyEventLoop = false;
  
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const startTime = Date.now();
  console.log('⏱️ Début traitement...');

  try {
    const articleData = JSON.parse(event.body);
    
    // ✅ VALIDATION STRICTE
    const requiredFields = ['titre', 'categorie', 'image', 'extrait', 'contenu', 'auteur'];
    const missingFields = requiredFields.filter(field => !articleData[field]);
    
    if (missingFields.length > 0) {
      console.error('❌ Champs manquants:', missingFields);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: `Champs manquants: ${missingFields.join(', ')}` 
        })
      };
    }

    // Vérifier taille contenu (éviter timeout)
    if (articleData.contenu.length > 10000) {
      console.warn('⚠️ Contenu très long:', articleData.contenu.length, 'caractères');
    }

    // Générer ID et slug
    const articleId = 'art_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const slug = generateSlug(articleData.titre);
    
    console.log(`🆔 ID: ${articleId}`);
    console.log(`🔗 Slug: ${slug}`);
    
    // ✅ SAUVEGARDER ARTICLES.JSON SEULEMENT (pas de page HTML)
    console.log('💾 Sauvegarde articles.json...');
    await saveToGitHub(articleData, articleId, slug);
    console.log('✅ articles.json sauvegardé');
    
    // ✅ NE PAS CRÉER LA PAGE HTML DANS LA FONCTION
    // (Trop lourd, cause 502)
    console.log('⏭️ Page HTML sera créée plus tard');

    const articleUrl = `https://cfiupload.netlify.app/article/${slug}.html`;
    
    const duration = Date.now() - startTime;
    console.log(`⏱️ Durée totale: ${duration}ms`);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        articleId: articleId,
        slug: slug,
        articleUrl: articleUrl,
        pageCreated: false, // ⚠️ Page non créée encore
        note: 'Article sauvegardé. Page HTML disponible après redéploiement.',
        shareUrls: {
          whatsapp: `https://wa.me/?text=${encodeURIComponent(articleData.titre + ' - ' + articleUrl)}`,
          facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}`,
          twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(articleData.titre)}&url=${encodeURIComponent(articleUrl)}`
        },
        message: '✅ Article publié ! Page HTML en cours de création...'
      })
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ ERREUR après ${duration}ms:`, error);
    console.error('Stack:', error.stack);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false,
        error: error.message || 'Erreur serveur',
        duration: duration + 'ms'
      })
    };
  }
};

// ==========================================
// FONCTIONS UTILITAIRES
// ==========================================

function generateSlug(titre) {
  if (!titre) return 'article-' + Date.now();
  
  return titre
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 60);
}

async function saveToGitHub(articleData, articleId, slug) {
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  
  if (!GITHUB_TOKEN) {
    throw new Error('GITHUB_TOKEN non configuré dans Netlify');
  }

  const REPO = 'bluvision30-netizen/cfi237-articles';
  const articlesUrl = `https://api.github.com/repos/${REPO}/contents/articles.json`;
  
  // Lire fichier existant
  let existingData = { articles: {} };
  let sha = '';

  try {
    console.log('📖 Lecture articles.json...');
    const response = await fetch(articlesUrl, {
      headers: { 
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Abu-Media-Bot'
      },
      timeout: 8000 // Timeout 8s
    });
    
    if (response.ok) {
      const fileData = await response.json();
      const content = Buffer.from(fileData.content, 'base64').toString('utf8');
      existingData = JSON.parse(content);
      sha = fileData.sha;
      console.log(`📚 ${Object.keys(existingData.articles).length} articles existants`);
    }
  } catch (e) {
    console.log('📝 Création nouveau articles.json');
  }

  // Créer article
  const completeArticle = {
    id: articleId,
    slug: slug,
    titre: articleData.titre,
    categorie: articleData.categorie,
    sections: articleData.sections || ['main'],
    image: articleData.image,
    images: articleData.images,
    extrait: articleData.extrait,
    contenu: articleData.contenu,
    auteur: articleData.auteur,
    contentType: articleData.contentType || 'article',
    video_url: articleData.video_url || null,
    date: new Date().toISOString(),
    vues: 0,
    likes: 0
  };

  // Ajouter
  existingData.articles[articleId] = completeArticle;
  existingData.lastUpdate = new Date().toISOString();
  existingData.totalArticles = Object.keys(existingData.articles).length;

  // Sauvegarder
  console.log('💾 Push vers GitHub...');
  const updateResponse = await fetch(articlesUrl, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Abu-Media-Bot'
    },
    body: JSON.stringify({
      message: `📰 Nouvel article: ${articleData.titre}`,
      content: Buffer.from(JSON.stringify(existingData, null, 2)).toString('base64'),
      sha: sha
    }),
    timeout: 10000 // Timeout 10s
  });

  if (!updateResponse.ok) {
    const errorText = await updateResponse.text();
    throw new Error(`GitHub API ${updateResponse.status}: ${errorText}`);
  }

  console.log('✅ GitHub mis à jour');
  return { success: true };
}

console.log('✅ Fonction create-article optimisée chargée');
