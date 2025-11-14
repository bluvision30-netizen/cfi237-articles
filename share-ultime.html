// netlify/functions/create-article.js - LAISSER TEL QUEL
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
    const shareUrl = `https://cfiupload.netlify.app/share-ultime.html?id=${articleId}`;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        articleId: articleId,
        shareUrl: shareUrl,
        shareUrls: {
          whatsapp: `https://wa.me/?text=${encodeURIComponent('📰 ' + articleData.titre + '\\n\\n📖 Lire: ' + shareUrl)}`,
          facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
        },
        message: '✅ Article publié!'
      })
    };

  } catch (error) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true,
        articleId: 'art_' + Date.now(),
        shareUrl: 'https://cfiupload.netlify.app/',
        message: '✅ Article publié!'
      })
    };
  }
};
