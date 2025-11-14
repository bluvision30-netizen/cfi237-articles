// netlify/functions/delete-article.js
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
    const { id } = JSON.parse(event.body);
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const REPO = 'bluvision30-netizen/cfi237-articles';

    if (!GITHUB_TOKEN) {
      throw new Error('GITHUB_TOKEN manquant');
    }

    if (!id) {
      throw new Error('ID article manquant');
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

    // Vérifier que l'article existe
    if (!articlesData.articles[id]) {
      throw new Error('Article introuvable');
    }

    const articleTitre = articlesData.articles[id].titre;

    // Supprimer l'article
    delete articlesData.articles[id];
    articlesData.lastUpdate = new.toISOString();
    articlesData.totalArticles = Object.keys(articlesData.articles).length;

    // Sauvegarder dans GitHub
    const updateResponse = await fetch(articlesUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `🗑️ Suppression: ${articleTitre}`,
        content: Buffer.from(JSON.stringify(articlesData, null, 2)).toString('base64'),
        sha: fileData.sha
      })
    });

    if (!updateResponse.ok) {
      throw new Error('Erreur sauvegarde GitHub');
    }

    // Supprimer la page share (optionnel)
    try {
      const shareUrl = `https://api.github.com/repos/${REPO}/contents/share/${id}.html`;
      const shareResponse = await fetch(shareUrl, {
        headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
      });
      
      if (shareResponse.ok) {
        const shareData = await shareResponse.json();
        await fetch(shareUrl, {
          method: 'DELETE',
          headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: `🗑️ Suppression page share: ${id}`,
            sha: shareData.sha
          })
        });
      }
    } catch (err) {
      console.log('Page share non trouvée ou déjà supprimée');
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Article supprimé avec succès',
        articleId: id
      })
    };

  } catch (error) {
    console.error('Erreur delete:', error);
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