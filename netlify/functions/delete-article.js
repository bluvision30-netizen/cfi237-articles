// netlify/functions/delete-article.js - VERSION CORRIGÉE
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

    console.log('🗑️ Suppression article:', id);

    // Lire articles.json
    const articlesUrl = `https://api.github.com/repos/${REPO}/contents/articles.json`;
    const getResponse = await fetch(articlesUrl, {
      headers: { 
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!getResponse.ok) {
      throw new Error('Impossible de lire articles.json');
    }

    const fileData = await getResponse.json();
    const content = Buffer.from(fileData.content, 'base64').toString('utf8');
    const articlesData = JSON.parse(content);

    // Vérifier que l'article existe
    if (!articlesData.articles[id]) {
      throw new Error('Article introuvable dans la base');
    }

    const articleTitre = articlesData.articles[id].titre;
    console.log('📄 Article trouvé:', articleTitre);

    // Supprimer l'article
    delete articlesData.articles[id];
    articlesData.lastUpdate = new Date().toISOString();
    articlesData.totalArticles = Object.keys(articlesData.articles).length;

    console.log('💾 Sauvegarde dans GitHub...');

    // Sauvegarder dans GitHub
    const updateResponse = await fetch(articlesUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json'
      },
      body: JSON.stringify({
        message: `🗑️ Suppression: ${articleTitre}`,
        content: Buffer.from(JSON.stringify(articlesData, null, 2)).toString('base64'),
        sha: fileData.sha
      })
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error('Erreur GitHub:', errorText);
      throw new Error('Erreur sauvegarde GitHub: ' + errorText);
    }

    console.log('✅ Article supprimé avec succès');

    // Supprimer la page share (optionnel, ne pas bloquer si erreur)
    try {
      const shareUrl = `https://api.github.com/repos/${REPO}/contents/share/${id}.html`;
      const shareResponse = await fetch(shareUrl, {
        headers: { 
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (shareResponse.ok) {
        const shareData = await shareResponse.json();
        await fetch(shareUrl, {
          method: 'DELETE',
          headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github.v3+json'
          },
          body: JSON.stringify({
            message: `🗑️ Suppression page share: ${id}`,
            sha: shareData.sha
          })
        });
        console.log('✅ Page share supprimée');
      }
    } catch (err) {
      console.log('⚠️ Page share non trouvée ou déjà supprimée');
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
    console.error('❌ Erreur delete:', error);
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
