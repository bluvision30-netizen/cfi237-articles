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
    
    // Validation basique
    if (!articleData.titre) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'Titre requis' })
      };
    }

    const articleId = 'art_' + Date.now();
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        articleId: articleId,
        shareUrl: `https://cfiupload.netlify.app/share/${articleId}.html`,
        message: 'Article créé avec succès!'
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
};
