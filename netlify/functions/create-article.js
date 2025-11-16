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
        body: JSON.stringify({ 
          success: false, 
          error: 'Champs requis manquants: titre, catégorie, image' 
        })
      };
    }

    // Générer ID et slug SEO
    const articleId = 'art_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const slug = generateSlug(articleData.titre);
    
    console.log(`📝 Création article: ${articleId} - Slug: ${slug}`);
    
    // 1. Sauvegarder dans articles.json
    const saveResult = await saveToGitHub(articleData, articleId, slug);
    
    // 2. Créer page article statique SEO
    const pageResult = await createArticlePage(articleData, articleId, slug);

    const articleUrl = `https://cfiupload.netlify.app/article/${slug}.html`;
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        articleId: articleId,
        slug: slug,
        articleUrl: articleUrl,
        shareUrls: {
          whatsapp: `https://wa.me/?text=${encodeURIComponent(articleData.titre + ' - ' + articleUrl)}`,
          facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}`,
          twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(articleData.titre)}&url=${encodeURIComponent(articleUrl)}`
        },
        message: '✅ Article publié avec page SEO optimisée!'
      })
    };

  } catch (error) {
    console.error('❌ Erreur création article:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false,
        error: error.message || 'Erreur serveur'
      })
    };
  }
};

// Générer slug SEO optimisé
function generateSlug(titre) {
  return titre
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Enlever accents
    .replace(/[^a-z0-9 -]/g, '') // Enlever caractères spéciaux
    .replace(/\s+/g, '-') // Espaces -> tirets
    .replace(/-+/g, '-') // Tirets multiples -> simple
    .replace(/^-+|-+$/g, '') // Enlever tirets début/fin
    .substring(0, 60); // Longueur max pour SEO
}

// Sauvegarder article dans GitHub
async function saveToGitHub(articleData, articleId, slug) {
  try {
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    if (!GITHUB_TOKEN) {
      console.log('⚠️ GITHUB_TOKEN manquant - Mode simulation');
      return { success: true, simulated: true };
    }

    const REPO = 'bluvision30-netizen/cfi237-articles';
    
    // Lire articles.json existant
    const articlesUrl = `https://api.github.com/repos/${REPO}/contents/articles.json`;
    let existingData = { articles: {} };
    let sha = '';

    try {
      const response = await fetch(articlesUrl, {
        headers: { 
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (response.ok) {
        const fileData = await response.json();
        const content = Buffer.from(fileData.content, 'base64').toString('utf8');
        existingData = JSON.parse(content);
        sha = fileData.sha;
        console.log(`📖 Articles existants: ${Object.keys(existingData.articles).length}`);
      }
    } catch (e) {
      console.log('📝 Création nouveau articles.json');
    }

    // Créer objet article complet
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

    // Ajouter article
    existingData.articles[articleId] = completeArticle;
    existingData.lastUpdate = new Date().toISOString();
    existingData.totalArticles = Object.keys(existingData.articles).length;

    // Sauvegarder dans GitHub
    const updateResponse = await fetch(articlesUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json'
      },
      body: JSON.stringify({
        message: `📰 Article: ${articleData.titre}`,
        content: Buffer.from(JSON.stringify(existingData, null, 2)).toString('base64'),
        sha: sha
      })
    });

    if (!updateResponse.ok) {
      throw new Error(`GitHub API error: ${updateResponse.statusText}`);
    }

    console.log('✅ Article sauvegardé dans articles.json');
    return { success: true };

  } catch (error) {
    console.error('❌ Erreur GitHub save:', error);
    throw error;
  }
}

// Créer page article statique
async function createArticlePage(articleData, articleId, slug) {
  try {
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    if (!GITHUB_TOKEN) {
      console.log('⚠️ GITHUB_TOKEN manquant - Page non créée');
      return { success: true, simulated: true };
    }

    const REPO = 'bluvision30-netizen/cfi237-articles';
    const images = JSON.parse(articleData.images || '[]');
    
    // Générer HTML complet
    const articleHTML = generateArticleHTML(articleData, articleId, slug, images);
    
    // Sauvegarder page sur GitHub
    const articleUrl = `https://api.github.com/repos/${REPO}/contents/article/${slug}.html`;

    const response = await fetch(articleUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json'
      },
      body: JSON.stringify({
        message: `🌐 Page SEO: ${articleData.titre}`,
        content: Buffer.from(articleHTML).toString('base64')
      })
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    console.log(`✅ Page article créée: /article/${slug}.html`);
    return { success: true };

  } catch (error) {
    console.error('❌ Erreur création page:', error);
    throw error;
  }
}

// Générer HTML page article avec SEO complet
function generateArticleHTML(articleData, articleId, slug, images) {
  const firstImage = images[0] || articleData.image;
  const articleUrl = `https://cfiupload.netlify.app/article/${slug}.html`;
  const currentDate = new Date().toISOString();
  
  // Échapper les guillemets pour JSON-LD
  const escapeJson = (str) => str.replace(/"/g, '\\"').replace(/\n/g, ' ');
  
  return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${articleData.titre} - Abu Media Group</title>
    <meta name="description" content="${articleData.extrait}">
    <meta name="keywords" content="${articleData.categorie}, ${articleData.auteur}, actualités Cameroun, Abu Media">
    <meta name="author" content="${articleData.auteur}">
    <meta name="robots" content="index, follow">
    
    <!-- CANONICAL URL -->
    <link rel="canonical" href="${articleUrl}">
    
    <!-- OPEN GRAPH (Facebook, LinkedIn) -->
    <meta property="og:type" content="article">
    <meta property="og:title" content="${articleData.titre}">
    <meta property="og:description" content="${articleData.extrait}">
    <meta property="og:image" content="${firstImage}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:url" content="${articleUrl}">
    <meta property="og:site_name" content="Abu Media Group">
    <meta property="article:published_time" content="${currentDate}">
    <meta property="article:author" content="${articleData.auteur}">
    <meta property="article:section" content="${articleData.categorie}">
    
    <!-- TWITTER CARD -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${articleData.titre}">
    <meta name="twitter:description" content="${articleData.extrait}">
    <meta name="twitter:image" content="${firstImage}">
    <meta name="twitter:site" content="@AbuMediaGroup">
    
    <!-- WHATSAPP -->
    <meta property="og:image:alt" content="${articleData.titre}">
    
    <!-- SCHEMA.ORG (Google Rich Results) -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      "headline": "${escapeJson(articleData.titre)}",
      "description": "${escapeJson(articleData.extrait)}",
      "image": [
        "${firstImage}"
      ],
      "datePublished": "${currentDate}",
      "dateModified": "${currentDate}",
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
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": "${articleUrl}"
      },
      "articleSection": "${articleData.categorie}",
      "inLanguage": "fr-FR"
    }
    </script>
    
    <!-- FAVICON -->
    <link rel="icon" type="image/png" href="https://cfiupload.netlify.app/favicon.png">
    
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        :root {
            --primary: #2563eb;
            --dark: #0f172a;
            --gray: #64748b;
            --light: #f1f5f9;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f5f5f5;
        }
        
        .container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            box-shadow: 0 2px 20px rgba(0,0,0,0.1);
        }
        
        /* HEADER */
        .header {
            background: linear-gradient(135deg, var(--dark) 0%, #1e293b 100%);
            color: white;
            padding: 60px 30px 40px;
        }
        
        .category-badge {
            display: inline-block;
            background: var(--primary);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 0.875rem;
            font-weight: 600;
            margin-bottom: 20px;
        }
        
        .header h1 {
            font-size: 2.5rem;
            line-height: 1.2;
            margin-bottom: 24px;
            font-weight: 700;
        }
        
        .meta {
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
            font-size: 0.9rem;
            opacity: 0.9;
        }
        
        .meta span {
            display: flex;
            align-items: center;
            gap: 6px;
        }
        
        /* IMAGE PRINCIPALE */
        .featured-image {
            width: 100%;
            height: 500px;
            object-fit: cover;
            display: block;
        }
        
        /* CONTENU */
        .content {
            padding: 50px 30px;
        }
        
        .excerpt {
            font-size: 1.25rem;
            font-weight: 500;
            color: var(--gray);
            margin-bottom: 30px;
            padding-left: 20px;
            border-left: 4px solid var(--primary);
            line-height: 1.6;
        }
        
        .article-body {
            font-size: 1.125rem;
            line-height: 1.8;
            color: #1a1a1a;
        }
        
        .article-body p {
            margin-bottom: 24px;
        }
        
        /* GALERIE */
        .gallery {
            margin: 40px 0;
        }
        
        .gallery-title {
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 20px;
            color: var(--dark);
        }
        
        .gallery-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
        }
        
        .gallery-item {
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            transition: transform 0.3s;
        }
        
        .gallery-item:hover {
            transform: scale(1.03);
        }
        
        .gallery-item img {
            width: 100%;
            height: 200px;
            object-fit: cover;
            display: block;
        }
        
        /* BOUTONS PARTAGE */
        .share-section {
            background: var(--light);
            border-radius: 12px;
            padding: 30px;
            margin: 40px 0;
        }
        
        .share-title {
            font-size: 1.25rem;
            font-weight: 700;
            margin-bottom: 20px;
            color: var(--dark);
        }
        
        .share-buttons {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
        }
        
        .share-btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 12px 24px;
            border-radius: 8px;
            color: white;
            text-decoration: none;
            font-weight: 600;
            transition: all 0.3s;
        }
        
        .share-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        .whatsapp { background: #25D366; }
        .facebook { background: #3b5998; }
        .twitter { background: #1DA1F2; }
        
        /* FOOTER */
        .footer {
            background: var(--dark);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        
        .footer-logo {
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 20px;
        }
        
        .footer-links {
            display: flex;
            justify-content: center;
            gap: 30px;
            margin: 20px 0;
            flex-wrap: wrap;
        }
        
        .footer-links a {
            color: rgba(255,255,255,0.8);
            text-decoration: none;
            transition: color 0.3s;
        }
        
        .footer-links a:hover {
            color: white;
        }
        
        .copyright {
            margin-top: 20px;
            opacity: 0.6;
            font-size: 0.9rem;
        }
        
        /* RESPONSIVE */
        @media (max-width: 768px) {
            .header {
                padding: 40px 20px 30px;
            }
            
            .header h1 {
                font-size: 1.75rem;
            }
            
            .featured-image {
                height: 300px;
            }
            
            .content {
                padding: 30px 20px;
            }
            
            .article-body {
                font-size: 1rem;
            }
            
            .meta {
                flex-direction: column;
                gap: 10px;
            }
            
            .share-buttons {
                flex-direction: column;
            }
            
            .share-btn {
                width: 100%;
                justify-content: center;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- HEADER -->
        <header class="header">
            <span class="category-badge">📰 ${articleData.categorie}</span>
            <h1>${articleData.titre}</h1>
            <div class="meta">
                <span>👤 ${articleData.auteur}</span>
                <span>📅 ${new Date().toLocaleDateString('fr-FR', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                })}</span>
                <span>⏱️ ${Math.ceil(articleData.contenu.split(' ').length / 200)} min de lecture</span>
            </div>
        </header>
        
        <!-- IMAGE PRINCIPALE -->
        <img src="${firstImage}" alt="${articleData.titre}" class="featured-image" loading="eager">
        
        <!-- CONTENU -->
        <article class="content">
            <div class="excerpt">${articleData.extrait}</div>
            
            <div class="article-body">
                ${articleData.contenu.split('\n\n').map(paragraph => {
                    const trimmed = paragraph.trim();
                    return trimmed ? `<p>${trimmed}</p>` : '';
                }).join('')}
            </div>
            
            ${images.length > 1 ? `
                <div class="gallery">
                    <h3 class="gallery-title">📸 Galerie Photos</h3>
                    <div class="gallery-grid">
                        ${images.slice(1).map((img, index) => `
                            <div class="gallery-item">
                                <img src="${img}" alt="Photo ${index + 2} - ${articleData.titre}" loading="lazy">
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            <!-- PARTAGE -->
            <div class="share-section">
                <h3 class="share-title">📢 Partager cet article</h3>
                <div class="share-buttons">
                    <a href="https://wa.me/?text=${encodeURIComponent(articleData.titre + ' - ' + articleUrl)}" 
                       class="share-btn whatsapp" 
                       target="_blank"
                       rel="noopener noreferrer">
                        📱 WhatsApp
                    </a>
                    <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}" 
                       class="share-btn facebook" 
                       target="_blank"
                       rel="noopener noreferrer">
                        📘 Facebook
                    </a>
                    <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(articleData.titre)}&url=${encodeURIComponent(articleUrl)}" 
                       class="share-btn twitter" 
                       target="_blank"
                       rel="noopener noreferrer">
                        🐦 Twitter
                    </a>
                </div>
            </div>
        </article>
        
        <!-- FOOTER -->
        <footer class="footer">
            <div class="footer-logo">📰 Abu Media Group</div>
            <p>Votre source d'information fiable au Cameroun</p>
            <nav class="footer-links">
                <a href="https://cfiupload.netlify.app">Accueil</a>
                <a href="https://cfiupload.netlify.app#actualites">Actualités</a>
                <a href="https://cfiupload.netlify.app#videos">Vidéos</a>
                <a href="https://cfiupload.netlify.app#contact">Contact</a>
            </nav>
            <p class="copyright">© 2025 Abu Media Group - Tous droits réservés</p>
        </footer>
    </div>
    
    <!-- ANALYTICS (à ajouter si besoin) -->
    <script>
        // Tracking vues article
        console.log('Article viewed:', '${articleId}');
    </script>
</body>
</html>`;
}
