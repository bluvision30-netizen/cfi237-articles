// netlify/functions/create-article.js
exports.handler = async function(event, context) {
  // Headers CORS essentiels
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS, GET'
  };

  // Gérer les requêtes OPTIONS (pre-flight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Vérifier que c'est une requête POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: 'Méthode non autorisée. Utilisez POST.' 
      })
    };
  }

  try {
    console.log('📥 Requête reçue:', event.body);

    // Vérifier si le body existe
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'Body de requête manquant' 
        })
      };
    }

    let articleData;
    try {
      articleData = JSON.parse(event.body);
    } catch (parseError) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'JSON invalide: ' + parseError.message 
        })
      };
    }

    // Validation des données requises
    const requiredFields = ['titre', 'categorie', 'image', 'extrait', 'contenu', 'auteur'];
    const missingFields = requiredFields.filter(field => !articleData[field]);

    if (missingFields.length > 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: `Champs manquants: ${missingFields.join(', ')}` 
        })
      };
    }

    // Générer un ID unique pour l'article
    const articleId = 'art_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // Construire l'objet article complet
    const completeArticle = {
      id: articleId,
      titre: articleData.titre.trim(),
      categorie: articleData.categorie,
      sections: articleData.sections || ['main'],
      contentType: articleData.contentType || 'article',
      image: articleData.image, // Première image = couverture
      images: articleData.images || JSON.stringify([articleData.image]), // Toutes les images
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

    // URLs de partage sociales
    const baseUrl = 'https://cfiupload.netlify.app';
    const shareUrls = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(completeArticle.titre + ' - ' + baseUrl + completeArticle.share_url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(baseUrl + completeArticle.share_url)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(completeArticle.titre)}&url=${encodeURIComponent(baseUrl + completeArticle.share_url)}`,
      direct: baseUrl + completeArticle.share_url
    };

    console.log('✅ Article créé:', {
      id: completeArticle.id,
      titre: completeArticle.titre,
      categorie: completeArticle.categorie,
      sections: completeArticle.sections,
      images: JSON.parse(completeArticle.images).length
    });

    // Réponse de succès
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        articleId: completeArticle.id,
        shareUrl: shareUrls.direct,
        shareUrls: shareUrls,
        article: completeArticle,
        message: 'Article publié avec succès!'
      })
    };

  } catch (error) {
    console.error('❌ Erreur dans create-article:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: 'Erreur serveur: ' + error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
};
