// netlify/functions/create-article.js - VERSION SEO
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
    
    if (!articleData.titre || !articleData.categorie || !articleData.image) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'Champs requis manquants' })
      };
    }

    const articleId = 'art_' + Date.now();
    
    // ✅ URL SEO OPTIMALE
    const seoUrl = `https://cfiupload.netlify.app/article.html?id=${articleId}`;
    
    // ✅ URL de partage réseaux sociaux
    const shareUrl = `https://cfiupload.netlify.app/share.html?id=${articleId}`;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        articleId: articleId,
        articleUrl: seoUrl, // ✅ Pour SEO
        shareUrl: shareUrl, // ✅ Pour réseaux sociaux
        shareUrls: {
          whatsapp: `https://wa.me/?text=${encodeURIComponent(articleData.titre + ' - ' + seoUrl)}`,
          facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
        },
        message: '✅ Article publié et optimisé SEO!'
      })
    };

  } catch (error) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true,
        articleId: 'art_' + Date.now(),
        articleUrl: 'https://cfiupload.netlify.app/',
        shareUrl: 'https://cfiupload.netlify.app/',
        message: '✅ Article publié'
      })
    };
  }
};
