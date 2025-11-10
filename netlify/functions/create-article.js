// netlify/functions/create-article.js
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const articleData = JSON.parse(event.body);
    
    // Générer ID unique
    const articleId = Date.now().toString();
    const slug = generateSlug(articleData.titre) + '-' + articleId;
    const shareUrl = process.env.SITE_URL + '/share/' + slug + '.html';

    console.log('🆕 Création article:', articleData.titre);
    console.log('📍 Sections:', articleData.sections);
    console.log('🏷️ Catégorie:', articleData.categorie);

    // 1. CRÉER LA PAGE SHARE
    const htmlContent = `<!DOCTYPE html>
<html prefix="og: https://ogp.me/ns#" lang="fr">
<head>
    <meta charset="utf-8">
    <title>${escapeHtml(articleData.titre)} - CFI 237</title>
    <meta property="og:title" content="${escapeHtml(articleData.titre)} - CFI 237">
    <meta property="og:image" content="${articleData.image}">
    <meta property="og:description" content="${escapeHtml(articleData.extrait)}">
    <meta property="og:url" content="${shareUrl}">
    <meta http-equiv="refresh" content="0;url=${process.env.SITE_URL}/article-detail.html?id=${articleId}">
    <script>localStorage.setItem('articleActuel', '${articleId}');</script>
</head>
<body style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
    <h1>📰 CFI 237</h1>
    <p>Redirection vers l'article...</p>
    <a href="${process.env.SITE_URL}/article-detail.html?id=${articleId}">Cliquer ici si la redirection échoue</a>
</body>
</html>`;

    // Upload page share
    await fetch(`https://api.github.com/repos/bluvision30-netizen/cfi237-articles/contents/share/${slug}.html`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Création page: ${articleData.titre}`,
        content: Buffer.from(htmlContent).toString('base64'),
        branch: 'main'
      })
    });

    // 2. AJOUTER AU FICHIER ARTICLES.JSON
    const articlesResponse = await fetch(
      'https://api.github.com/repos/bluvision30-netizen/cfi237-articles/contents/articles.json',
      {
        headers: {
          'Authorization': `token ${process.env.GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );

    const articlesData = await articlesResponse.json();
    const currentContent = JSON.parse(Buffer.from(articlesData.content, 'base64').toString());
    
    // Ajouter le nouvel article
    currentContent.articles[articleId] = {
      id: articleId,
      titre: articleData.titre,
      categorie: articleData.categorie,
      sections: articleData.sections,
      image: articleData.image,
      images: articleData.images,
      extrait: articleData.extrait,
      contenu: articleData.contenu,
      auteur: articleData.auteur,
      contentType: articleData.contentType,
      video_url: articleData.video_url || '',
      date: new Date().toISOString(),
      vue: 0,
      likes: 0
    };

    // Mettre à jour articles.json
    await fetch(
      'https://api.github.com/repos/bluvision30-netizen/cfi237-articles/contents/articles.json',
      {
        method: 'PUT',
        headers: {
          'Authorization': `token ${process.env.GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Ajout article: ${articleData.titre}`,
          content: Buffer.from(JSON.stringify(currentContent, null, 2)).toString('base64'),
          branch: 'main',
          sha: articlesData.sha
        })
      }
    );

    console.log('✅ Article créé:', articleId);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        articleId: articleId,
        shareUrl: shareUrl,
        message: 'Article créé avec succès'
      })
    };

  } catch (error) {
    console.error('❌ Erreur:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};

function generateSlug(text) {
  return text.toString().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 -]/g, '').replace(/\s+/g, '-')
    .replace(/-+/g, '-').replace(/^-+/, '').replace(/-+$/, '')
    .substring(0, 50);
}

function escapeHtml(text) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, m => map[m]);
}