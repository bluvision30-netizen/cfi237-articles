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
    console.log('📥 Début création article...');
    
    const articleData = JSON.parse(event.body);
    
    // Validation stricte
    if (!articleData.titre || !articleData.categorie || !articleData.image) {
      console.error('❌ Données manquantes:', { titre: !!articleData.titre, categorie: !!articleData.categorie, image: !!articleData.image });
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
    
    console.log(`🆔 ID: ${articleId}`);
    console.log(`🔗 Slug: ${slug}`);
    
    // 1. Sauvegarder dans articles.json
    console.log('💾 Sauvegarde articles.json...');
    await saveToGitHub(articleData, articleId, slug);
    console.log('✅ articles.json sauvegardé');
    
    // 2. Créer page article statique SEO
    console.log('📄 Création page SEO...');
    await createArticlePage(articleData, articleId, slug);
    console.log('✅ Page SEO créée');

    const articleUrl = `https://cfiupload.netlify.app/article/${slug}.html`;
    
    console.log('🎉 Article publié avec succès!');
    
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
    console.error('❌ ERREUR GLOBALE:', error);
    console.error('Stack:', error.stack);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false,
        error: error.message || 'Erreur serveur',
        details: error.stack
      })
    };
  }
};

// ==========================================
// GÉNÉRER SLUG SEO
// ==========================================
function generateSlug(titre) {
  if (!titre) return 'article-' + Date.now();
  
  return titre
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Enlever accents
    .replace(/[^a-z0-9 -]/g, '') // Enlever caractères spéciaux
    .replace(/\s+/g, '-') // Espaces -> tirets
    .replace(/-+/g, '-') // Tirets multiples -> simple
    .replace(/^-+|-+$/g, '') // Enlever tirets début/fin
    .substring(0, 60); // Longueur max
}

// ==========================================
// SAUVEGARDER DANS GITHUB
// ==========================================
async function saveToGitHub(articleData, articleId, slug) {
  try {
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    
    if (!GITHUB_TOKEN) {
      console.warn('⚠️ GITHUB_TOKEN manquant - Mode simulation');
      return { success: true, simulated: true };
    }

    const REPO = 'bluvision30-netizen/cfi237-articles';
    const articlesUrl = `https://api.github.com/repos/${REPO}/contents/articles.json`;
    
    // Lire articles.json existant
    let existingData = { articles: {} };
    let sha = '';

    try {
      console.log('📖 Lecture articles.json...');
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
        console.log(`📚 ${Object.keys(existingData.articles).length} articles existants`);
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
      contentType: articleData.contentType || 'article',
      video_url: articleData.video_url || null,
      date: new Date().toISOString(),
      vues: 0,
      likes: 0
    };

    // Ajouter article
    existingData.articles[articleId] = completeArticle;
    existingData.lastUpdate = new Date().toISOString();
    existingData.totalArticles = Object.keys(existingData.articles).length;

    // Sauvegarder
    console.log('💾 Sauvegarde sur GitHub...');
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
      const errorText = await updateResponse.text();
      throw new Error(`GitHub API error: ${updateResponse.status} - ${errorText}`);
    }

    console.log('✅ articles.json mis à jour');
    return { success: true };

  } catch (error) {
    console.error('❌ Erreur GitHub save:', error);
    throw error;
  }
}

// ==========================================
// CRÉER PAGE ARTICLE STATIQUE
// ==========================================
async function createArticlePage(articleData, articleId, slug) {
  try {
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    
    if (!GITHUB_TOKEN) {
      console.warn('⚠️ GITHUB_TOKEN manquant - Page non créée');
      return { success: true, simulated: true };
    }

    const REPO = 'bluvision30-netizen/cfi237-articles';
    const images = JSON.parse(articleData.images || '[]');
    
    // Générer HTML moderne
    console.log('🎨 Génération HTML...');
    const articleHTML = generateModernArticleHTML(articleData, articleId, slug, images);
    
    // Sauvegarder page
    const articleUrl = `https://api.github.com/repos/${REPO}/contents/article/${slug}.html`;
    
    console.log(`📤 Upload vers /article/${slug}.html...`);
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
      const errorText = await response.text();
      throw new Error(`GitHub API error: ${response.status} - ${errorText}`);
    }

    console.log(`✅ Page créée: /article/${slug}.html`);
    return { success: true };

  } catch (error) {
    console.error('❌ Erreur création page:', error);
    throw error;
  }
}

// ==========================================
// GÉNÉRER HTML MODERNE (VERSION SIMPLIFIÉE)
// ==========================================
// ==========================================
// GÉNÉRER HTML MODERNE AVEC SUPPORT VIDÉO
// ==========================================
function generateModernArticleHTML(articleData, articleId, slug, images) {
  const firstImage = images[0] || articleData.image;
  const articleUrl = `https://cfiupload.netlify.app/article/${slug}.html`;
  const currentDate = new Date().toISOString();
  
  // Détecter si c'est une vidéo
  const isVideo = articleData.contentType === 'video' && articleData.video_url;
  const videoId = isVideo ? extractYouTubeId(articleData.video_url) : null;
  
  // Générer le contenu vidéo ou image
  let mediaContent = '';
  
  if (isVideo && videoId) {
    mediaContent = `
    <div class="video-container">
        <div class="video-wrapper">
            <iframe 
                src="https://www.youtube.com/embed/${videoId}" 
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen
                loading="lazy">
            </iframe>
        </div>
        <div class="video-meta">
            <a href="${articleData.video_url}" target="_blank" class="video-source">
                <i class="fab fa-youtube"></i> Voir sur YouTube
            </a>
        </div>
    </div>`;
  } else {
    // Contenu image normal
    mediaContent = `
    <div class="article-hero" style="background-image: url('${firstImage}')">
        <div class="hero-overlay">
            <span class="category">${articleData.categorie}</span>
            <h1>${articleData.titre}</h1>
            <div class="meta">
                <span><i class="fas fa-user"></i> ${articleData.auteur}</span>
                <span><i class="fas fa-calendar"></i> ${new Date().toLocaleDateString('fr-FR')}</span>
                ${isVideo ? '<span><i class="fas fa-video"></i> Vidéo</span>' : ''}
            </div>
        </div>
    </div>`;
  }

  // Générer galerie seulement pour les articles (pas les vidéos)
  let galleryContent = '';
  if (!isVideo && images.length > 1) {
    galleryContent = `
    <div class="gallery">
        ${images.slice(1).map(img => `<img src="${img}" alt="Photo" loading="lazy">`).join('')}
    </div>`;
  }

  return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${articleData.titre} - Abu Media Group</title>
    <meta name="description" content="${articleData.extrait}">
    <link rel="canonical" href="${articleUrl}">
    
    <!-- Open Graph -->
    <meta property="og:type" content="article">
    <meta property="og:title" content="${articleData.titre}">
    <meta property="og:description" content="${articleData.extrait}">
    <meta property="og:image" content="${firstImage}">
    <meta property="og:url" content="${articleUrl}">
    ${isVideo ? `<meta property="og:video" content="${articleData.video_url}">` : ''}
    
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="/styles/article-modern.css">
    <style>
        .video-container {
            margin: 20px 0;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 8px 32px rgba(0,0,0,0.2);
        }
        .video-wrapper {
            position: relative;
            padding-bottom: 56.25%; /* 16:9 */
            height: 0;
            background: #000;
        }
        .video-wrapper iframe {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border: none;
        }
        .video-meta {
            padding: 16px;
            background: #1e293b;
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .video-source {
            color: #ff0000;
            text-decoration: none;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: opacity 0.3s;
        }
        .video-source:hover {
            opacity: 0.8;
        }
        .video-badge {
            background: #ff0000;
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="top-bar">
        <div class="container">
            <a href="/" class="logo"><i class="fas fa-newspaper"></i> Abu Media</a>
            <a href="/" class="back-btn"><i class="fas fa-arrow-left"></i> Retour</a>
        </div>
    </div>
    
    <article class="article-container">
        ${isVideo ? `
        <header>
            <div style="padding: 20px 0;">
                <span class="category">${articleData.categorie}</span>
                ${isVideo ? '<span class="video-badge"><i class="fas fa-video"></i> VIDÉO</span>' : ''}
            </div>
            <h1>${articleData.titre}</h1>
            <div class="meta">
                <span><i class="fas fa-user"></i> ${articleData.auteur}</span>
                <span><i class="fas fa-calendar"></i> ${new Date().toLocaleDateString('fr-FR')}</span>
            </div>
        </header>
        ${mediaContent}
        ` : mediaContent}
        
        <div class="article-content">
            <div class="excerpt">${articleData.extrait}</div>
            
            ${isVideo ? `
            <div class="body">
                ${articleData.contenu.split('\n\n').map(p => `<p>${p}</p>`).join('')}
            </div>
            ` : `
            <div class="body">
                ${articleData.contenu.split('\n\n').map(p => `<p>${p}</p>`).join('')}
            </div>
            ${galleryContent}
            `}
            
            <div class="share">
                <a href="https://wa.me/?text=${encodeURIComponent(articleData.titre + ' - ' + articleUrl)}" class="share-btn whatsapp">
                    <i class="fab fa-whatsapp"></i> WhatsApp
                </a>
                <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}" class="share-btn facebook">
                    <i class="fab fa-facebook"></i> Facebook
                </a>
            </div>
            
            <div class="comments">
                <h3>Commentaires</h3>
                <div id="comments-list"></div>
            </div>
        </div>
        
        <aside class="sidebar">
            <div class="sidebar-card">
                <h4>Articles Similaires</h4>
                <div id="related"></div>
            </div>
        </aside>
    </article>
    
    <script src="/js/article-interactions.js"></script>
</body>
</html>`;
}

// ==========================================
// EXTRACT YOUTUBE ID
// ==========================================
function extractYouTubeId(url) {
  if (!url) return null;
  
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/,
    /youtube\.com\/embed\/([^?]+)/,
    /youtube\.com\/v\/([^?]+)/
  ];
  
  for (let pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

console.log('✅ Fonction create-article chargée');
