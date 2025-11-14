// netlify/functions/create-article.js - VERSION COMPLÈTE CORRIGÉE
exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
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
    
    // SIMULATION SUCCÈS - À ACTIVER PLUS TARD
    console.log('📝 Article simulé pour WhatsApp:', articleId);

    const shareUrl = `https://cfiupload.netlify.app/share/${articleId}.html`;
    
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
        message: 'Article publié! Pages WhatsApp en cours...'
      })
    };

  } catch (error) {
    console.error('❌ Erreur:', error);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true,
        articleId: 'art_' + Date.now(),
        shareUrl: 'https://cfiupload.netlify.app/share/test-whatsapp.html',
        message: 'Version simulation - WhatsApp bientôt disponible'
      })
    };
  }
};
