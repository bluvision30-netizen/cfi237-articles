// netlify/functions/create-share.js
// SUPPRIMEZ cette ligne : const fetch = require('node-fetch');
// Netlify a déjà fetch de manière native !

exports.handler = async (event) => {
  // Vérifier la méthode HTTP
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    // Parse les données de l'article
    const articleData = JSON.parse(event.body);
    
    console.log('🆕 Création page share pour:', articleData.titre);
    console.log('🖼️ Image:', articleData.image);

    // Générer un ID unique et un slug
    const articleId = Date.now();
    const slug = generateSlug(articleData.titre) + '-' + articleId;
    const shareUrl = process.env.SITE_URL + '/share/' + slug + '.html';

    console.log('🔗 Slug généré:', slug);

    // Contenu HTML de la page share
    const htmlContent = `<!DOCTYPE html>
<html prefix="og: https://ogp.me/ns#" lang="fr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(articleData.titre)} - CFI 237</title>
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="article">
    <meta property="og:url" content="${shareUrl}">
    <meta property="og:title" content="${escapeHtml(articleData.titre)} - CFI 237">
    <meta property="og:description" content="${escapeHtml(articleData.extrait)}">
    <meta property="og:image" content="${articleData.image}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:site_name" content="CFI 237">
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(articleData.titre)} - CFI 237">
    <meta name="twitter:description" content="${escapeHtml(articleData.extrait)}">
    <meta name="twitter:image" content="${articleData.image}">
    
    <!-- Redirection -->
    <meta http-equiv="refresh" content="0;url=${process.env.SITE_URL}/article-detail.html">
    
    <script>
        try {
            localStorage.setItem('articleActuel', '${articleId}');
        } catch(e) {
            console.log('LocalStorage error:', e);
        }
        window.location.href = '${process.env.SITE_URL}/article-detail.html';
    </script>
</head>
<body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; min-height: 100vh; display: flex; align-items: center; justify-content: center; text-align: center;">
    <div style="max-width: 600px;">
        <h1 style="font-size: 2.5rem; margin-bottom: 20px;">📰 CFI 237</h1>
        <p>Redirection vers l'article...</p>
        <div style="border: 4px solid rgba(255,255,255,0.3); border-top: 4px solid white; border-radius: 50%; width: 50px; height: 50px; margin: 30px auto; animation: spin 1s linear infinite;"></div>
        <p><a href="${process.env.SITE_URL}/article-detail.html" style="color: white; text-decoration: underline;">Cliquer ici si la redirection échoue</a></p>
    </div>
    
    <style>
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</body>
</html>`;

    // Upload vers GitHub
    const githubResponse = await fetch(
      `https://api.github.com/repos/bluvision30-netizen/cfi237-articles/contents/share/${slug}.html`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `token ${process.env.GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({
          message: `Création page share: ${articleData.titre}`,
          content: Buffer.from(htmlContent).toString('base64'),
          branch: 'main'
        })
      }
    );

    if (!githubResponse.ok) {
      const errorText = await githubResponse.text();
      console.error('❌ Erreur GitHub:', errorText);
      throw new Error(`GitHub API error: ${githubResponse.status}`);
    }

    console.log('✅ Page share créée:', shareUrl);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        shareUrl: shareUrl,
        articleId: articleId,
        message: 'Page de partage créée avec succès'
      })
    };

  } catch (error) {
    console.error('❌ Erreur fonction:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};

// Fonction utilitaire pour générer un slug
function generateSlug(text) {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
    .substring(0, 50);
}

// Fonction utilitaire pour échapper le HTML
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}
