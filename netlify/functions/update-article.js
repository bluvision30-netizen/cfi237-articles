// netlify/functions/update-article.js
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
    const updatedArticle = JSON.parse(event.body);
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const REPO = 'bluvision30-netizen/cfi237-articles';

    if (!GITHUB_TOKEN) {
      throw new Error('GITHUB_TOKEN manquant');
    }

    // Lire articles.json
    const articlesUrl = `https://api.github.com/repos/${REPO}/contents/articles.json`;
    const getResponse = await fetch(articlesUrl, {
      headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
    });

    if (!getResponse.ok) {
      throw new Error('Impossible de lire articles.json');
    }

    const fileData = await getResponse.json();
    const content = Buffer.from(fileData.content, 'base64').toString('utf8');
    const articlesData = JSON.parse(content);

    // Mettre à jour l'article
    if (articlesData.articles[updatedArticle.id]) {
      articlesData.articles[updatedArticle.id] = {
        ...articlesData.articles[updatedArticle.id],
        ...updatedArticle,
        date: articlesData.articles[updatedArticle.id].date // Garder date originale
      };
      articlesData.lastUpdate = new Date().toISOString();
    } else {
      throw new Error('Article introuvable');
    }

    // Sauvegarder dans GitHub
    const updateResponse = await fetch(articlesUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `✏️ Modification: ${updatedArticle.titre}`,
        content: Buffer.from(JSON.stringify(articlesData, null, 2)).toString('base64'),
        sha: fileData.sha
      })
    });

    if (!updateResponse.ok) {
      throw new Error('Erreur sauvegarde GitHub');
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Article modifié avec succès',
        articleId: updatedArticle.id
      })
    };

  } catch (error) {
    console.error('Erreur update:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};