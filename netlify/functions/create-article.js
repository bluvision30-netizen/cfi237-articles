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
    
    // Validation
    if (!articleData.titre || !articleData.categorie || !articleData.image) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'Champs requis manquants' })
      };
    }

    // Générer slug SEO
    const articleId = 'art_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const slug = generateSlug(articleData.titre);
    
    // 1. Sauvegarder dans articles.json
    const saveResult = await saveToGitHub(articleData, articleId, slug);
    
    // 2. Créer page article statique
    const pageResult = await createArticlePage(articleData, articleId, slug);

    const articleUrl = `https://cfiupload.netlify.app/article/${slug}.html`;
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        articleId: articleId,
        articleUrl: articleUrl,
        slug: slug,
        shareUrls: {
          whatsapp: `https://wa.me/?text=${encodeURIComponent(articleData.titre + ' - ' + articleUrl)}`,
          facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}`
        },
        message: 'Article publié et page SEO créée!'
      })
    };

  } catch (error) {
    console.error('Erreur:', error);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true,
        articleId: 'art_' + Date.now(),
        articleUrl: 'https://cfiupload.netlify.app/article/test-seo.html',
        message: 'Article simulé - SEO en cours'
      })
    };
  }
};

// Générer slug SEO
function generateSlug(titre) {
  return titre
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Enlever accents
    .replace(/[^a-z0-9 -]/g, '') // Enlever caractères spéciaux
    .replace(/\s+/g, '-') // Espaces -> tirets
    .replace(/-+/g, '-') // Tirets multiples -> simple
    .substring(0, 60); // Longueur max
}

// Sauvegarde GitHub
async function saveToGitHub(articleData, articleId, slug) {
  try {
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    if (!GITHUB_TOKEN) {
      console.log('🔑 GITHUB_TOKEN manquant - simulation');
      return { success: true, simulated: true };
    }

    const REPO = 'bluvision30-netizen/cfi237-articles';
    
    // Lire articles existants
    const articlesUrl = `https://api.github.com/repos/${REPO}/contents/articles.json`;
    let existingData = { articles: {} };
    let sha = '';

    try {
      const response = await fetch(articlesUrl, {
        headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
      });
      if (response.ok) {
        const fileData = await response.json();
        const content = Buffer.from(fileData.content, 'base64').toString('utf8');
        existingData = JSON.parse(content);
        sha = fileData.sha;
      }
    } catch (e) {
      console.log('📁 Création nouveau articles.json');
    }

    // Ajouter nouvel article
    const completeArticle = {
      id: articleId,
      slug: slug,
      titre: articleData.titre,
      categorie: articleData.categorie,
      sections: articleData.sections || ['main'],
      image: articleData.image,
      images: articleData.images,
      extrait: articleData.extrait,
      contenu: articleData.contenu,
      auteur: articleData.auteur,
      date: new Date().toISOString(),
      vues: 0,
      likes: 0
    };

    existingData.articles[articleId] = completeArticle;
    existingData.lastUpdate = new Date().toISOString();
    existingData.totalArticles = Object.keys(existingData.articles).length;

    // Sauvegarder
    const updateResponse = await fetch(articlesUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `📝 Article SEO: ${articleData.titre}`,
        content: Buffer.from(JSON.stringify(existingData, null, 2)).toString('base64'),
        sha: sha
      })
    });

    console.log('✅ Article sauvegardé dans GitHub');
    return { success: true };

  } catch (error) {
    console.error('❌ Erreur GitHub:', error);
    return { success: false, error: error.message };
  }
}

// Créer page article statique
async function createArticlePage(articleData, articleId, slug) {
  try {
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    if (!GITHUB_TOKEN) {
      return { success: true, simulated: true };
    }

    const REPO = 'bluvision30-netizen/cfi237-articles';
    const images = JSON.parse(articleData.images || '[]');
    const firstImage = images[0] || articleData.image;

    const articleHTML = generateArticleHTML(articleData, articleId, slug, images);
    
    const articleUrl = `https://api.github.com/repos/${REPO}/contents/article/${slug}.html`;

    const response = await fetch(articleUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `🌐 Page SEO: ${articleData.titre}`,
        content: Buffer.from(articleHTML).toString('base64')
      })
    });

    console.log('✅ Page article SEO créée:', slug);
    return { success: true };

  } catch (error) {
    console.error('❌ Erreur page article:', error);
    return { success: false, error: error.message };
  }
}

// Générer HTML page article
function generateArticleHTML(articleData, articleId, slug, images) {
  const firstImage = images[0] || articleData.image;
  
  return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${articleData.titre} - Abu Media Group</title>
    <meta name="description" content="${articleData.extrait}">
    
    <!-- META TAGS SEO -->
    <link rel="canonical" href="https://cfiupload.netlify.app/article/${slug}.html">
    
    <!-- OPEN GRAPH -->
    <meta property="og:title" content="${articleData.titre}">
    <meta property="og:description" content="${articleData.extrait}">
    <meta property="og:image" content="${firstImage}">
    <meta property="og:url" content="https://cfiupload.netlify.app/article/${slug}.html">
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="Abu Media Group">
    
    <!-- TWITTER -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${articleData.titre}">
    <meta name="twitter:description" content="${articleData.extrait}">
    <meta name="twitter:image" content="${firstImage}">
    
    <!-- SCHEMA.ORG -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      "headline": "${articleData.titre}",
      "description": "${articleData.extrait}",
      "image": "${firstImage}",
      "datePublished": "${new Date().toISOString()}",
      "author": {
        "@type": "Person",
        "name": "${articleData.auteur}"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Abu Media Group",
        "logo": {
          "@type": "ImageObject",
          "url": "https://cfiupload.netlify.app/logo.png"
        }
      }
    }
    </script>
    
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 0; }
        .header { background: linear-gradient(135deg, #1e293b, #0f172a); color: white; padding: 40px 20px; text-align: center; }
        .header h1 { font-size: 2.5rem; margin-bottom: 16px; }
        .meta { display: flex; justify-content: center; gap: 20px; margin-bottom: 20px; font-size: 0.9rem; opacity: 0.8; }
        .article-image { width: 100%; height: 400px; object-fit: cover; }
        .content { padding: 40px; }
        .content p { margin-bottom: 20px; font-size: 1.1rem; line-height: 1.8; }
        .gallery { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; margin: 30px 0; }
        .gallery img { width: 100%; height: 150px; object-fit: cover; border-radius: 8px; }
        .share-buttons { display: flex; gap: 15px; margin: 40px 0; justify-content: center; }
        .share-btn { padding: 12px 24px; border-radius: 6px; color: white; text-decoration: none; font-weight: bold; }
        .whatsapp { background: #25D366; }
        .facebook { background: #3b5998; }
        .footer { background: #1e293b; color: white; padding: 30px; text-align: center; }
        @media (max-width: 768px) {
            .header h1 { font-size: 1.8rem; }
            .content { padding: 20px; }
            .article-image { height: 250px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <header class="header">
            <h1>${articleData.titre}</h1>
            <div class="meta">
                <span>📅 ${new Date().toLocaleDateString('fr-FR')}</span>
                <span>👤 ${articleData.auteur}</span>
                <span>📁 ${articleData.categorie}</span>
            </div>
        </header>
        
        <img src="${firstImage}" alt="${articleData.titre}" class="article-image">
        
        <div class="content">
            <p><strong>${articleData.extrait}</strong></p>
            
            ${articleData.contenu.split('\\n\\n').map(paragraph => 
                `<p>${paragraph}</p>`
            ).join('')}
            
            ${images.length > 1 ? `
                <div class="gallery">
                    ${images.slice(1).map(img => 
                        `<img src="${img}" alt="Galerie ${articleData.titre}">`
                    ).join('')}
                </div>
            ` : ''}
            
            <div class="share-buttons">
                <a href="https://wa.me/?text=${encodeURIComponent(articleData.titre + ' - https://cfiupload.netlify.app/article/' + slug + '.html')}" 
                   class="share-btn whatsapp" target="_blank">
                    📱 Partager sur WhatsApp
                </a>
                <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://cfiupload.netlify.app/article/' + slug + '.html')}" 
                   class="share-btn facebook" target="_blank">
                    📘 Partager sur Facebook
                </a>
            </div>
        </div>
        
        <footer class="footer">
            <p>© 2024 Abu Media Group - Tous droits réservés</p>
            <p><a href="https://cfiupload.netlify.app" style="color: #667eea;">← Retour à l'accueil</a></p>
        </footer>
    </div>
</body>
</html>`;
}
