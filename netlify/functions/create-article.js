// netlify/functions/create-article.js
exports.handler = async function(event, context) {
  // Headers CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Pré-flight request
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Seulement POST autorisé
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: 'Method Not Allowed' };
  }

  try {
    const articleData = JSON.parse(event.body);
    
    // Validation des données requises
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
    
    // Article complet
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

    // URLs de partage
    const shareUrls = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(completeArticle.titre + ' - ' + completeArticle.share_url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(completeArticle.share_url)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(completeArticle.titre)}&url=${encodeURIComponent(completeArticle.share_url)}`
    };

    // SIMULATION SUCCÈS - À REMPLACER PAR LA LOGIQUE GITHUB RÉELLE
    console.log('📝 Article simulé:', completeArticle);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        articleId: articleId,
        shareUrl: completeArticle.share_url,
        shareUrls: shareUrls,
        message: 'Article publié avec succès! (Mode simulation)'
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
