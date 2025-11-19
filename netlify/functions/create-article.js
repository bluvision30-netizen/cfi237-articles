

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
// GÉNÉRER HTML MODERNE (VERSION CORRIGÉE)
// ==========================================
function generateModernArticleHTML(articleData, articleId, slug, images) {
    const firstImage = images[0] || articleData.image;
    const articleUrl = `https://cfiupload.netlify.app/article/${slug}.html`;
    const currentDate = new Date().toISOString();
    
    // Déterminer si c'est une vidéo ou un article
    const isVideo = articleData.contentType === 'video' && articleData.video_url;
    const videoId = isVideo ? extractYouTubeId(articleData.video_url) : null;
    const videoThumbnail = isVideo ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;
    
    // Générer le contenu principal selon le type
    let mainContent = '';
    
    if (isVideo) {
        // STRUCTURE POUR VIDÉO
        mainContent = `
            <div class="video-container">
                <div class="video-wrapper">
                    <iframe 
                        src="https://www.youtube.com/embed/${videoId}" 
                        frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen>
                    </iframe>
                </div>
                <div class="video-meta">
                    <div class="meta-item">
                        <i class="fas fa-user"></i>
                        <span>${articleData.auteur || 'Auteur'}</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-calendar"></i>
                        <span>${new Date().toLocaleDateString('fr-FR')}</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-eye"></i>
                        <span id="viewCount">0 vues</span>
                    </div>
                </div>
            </div>
            
            <div class="article-description">
                <div class="excerpt">${articleData.extrait}</div>
                <div class="body">
                    ${articleData.contenu.split('\n\n').map(p => `<p>${p}</p>`).join('')}
                </div>
            </div>
        `;
    } else {
        // STRUCTURE POUR ARTICLE
        mainContent = `
            <div class="article-content">
                <div class="excerpt">${articleData.extrait}</div>
                <div class="body">
                    ${articleData.contenu.split('\n\n').map(p => `<p>${p}</p>`).join('')}
                </div>
                
                ${images.length > 1 ? `
                    <div class="gallery">
                        <h3>Galerie photos</h3>
                        <div class="gallery-grid">
                            ${images.slice(1).map(img => `
                                <div class="gallery-item">
                                    <img src="${img}" alt="Photo" loading="lazy">
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
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
    <meta property="og:type" content="${isVideo ? 'video.other' : 'article'}">
    <meta property="og:title" content="${articleData.titre}">
    <meta property="og:description" content="${articleData.extrait}">
    <meta property="og:image" content="${isVideo ? videoThumbnail : firstImage}">
    <meta property="og:url" content="${articleUrl}">
    ${isVideo ? `<meta property="og:video" content="${articleData.video_url}">` : ''}
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="${isVideo ? 'player' : 'summary_large_image'}">
    <meta name="twitter:title" content="${articleData.titre}">
    <meta name="twitter:description" content="${articleData.extrait}">
    <meta name="twitter:image" content="${isVideo ? videoThumbnail : firstImage}">
    
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: #0f172a;
            color: #f1f5f9;
            line-height: 1.6;
        }
        
        .top-bar {
            background: #1e293b;
            padding: 1rem 0;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .logo {
            color: #fff;
            font-size: 1.5rem;
            font-weight: 700;
            text-decoration: none;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .back-btn {
            background: #667eea;
            color: white;
            padding: 10px 20px;
            border-radius: 8px;
            text-decoration: none;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.3s ease;
        }
        
        .back-btn:hover {
            background: #5a6fd8;
            transform: translateY(-2px);
        }
        
        .article-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
            display: grid;
            grid-template-columns: 1fr 350px;
            gap: 40px;
            margin-top: 30px;
        }
        
        .article-hero {
            grid-column: 1 / -1;
            height: 400px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 20px;
            overflow: hidden;
            position: relative;
            margin-bottom: 30px;
            ${!isVideo ? `background-image: url('${firstImage}'); background-size: cover; background-position: center;` : ''}
        }
        
        .hero-overlay {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background: linear-gradient(transparent, rgba(0,0,0,0.8));
            padding: 40px;
            color: white;
        }
        
        .category {
            background: #667eea;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 0.9rem;
            font-weight: 600;
            margin-bottom: 15px;
            display: inline-block;
        }
        
        .article-hero h1 {
            font-size: 2.5rem;
            margin-bottom: 15px;
            line-height: 1.2;
        }
        
        .meta {
            display: flex;
            gap: 20px;
            font-size: 0.9rem;
            opacity: 0.9;
        }
        
        .meta span {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        /* STYLES VIDÉO */
        .video-container {
            background: #1e293b;
            border-radius: 15px;
            overflow: hidden;
            margin-bottom: 30px;
        }
        
        .video-wrapper {
            position: relative;
            padding-bottom: 56.25%; /* 16:9 Aspect Ratio */
            height: 0;
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
            padding: 20px;
            display: flex;
            gap: 25px;
            background: rgba(255,255,255,0.05);
            border-top: 1px solid rgba(255,255,255,0.1);
        }
        
        .meta-item {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #cbd5e1;
        }
        
        .meta-item i {
            color: #667eea;
        }
        
        .article-description {
            padding: 0 10px;
        }
        
        /* STYLES ARTICLES */
        .article-content {
            background: #1e293b;
            padding: 30px;
            border-radius: 15px;
        }
        
        .excerpt {
            font-size: 1.2rem;
            color: #e2e8f0;
            margin-bottom: 25px;
            padding-bottom: 25px;
            border-bottom: 1px solid rgba(255,255,255,0.1);
            line-height: 1.7;
        }
        
        .body {
            font-size: 1.1rem;
            line-height: 1.8;
        }
        
        .body p {
            margin-bottom: 20px;
            color: #cbd5e1;
        }
        
        /* GALERIE */
        .gallery {
            margin-top: 40px;
        }
        
        .gallery h3 {
            color: #fff;
            margin-bottom: 20px;
            font-size: 1.3rem;
        }
        
        .gallery-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
        }
        
        .gallery-item {
            border-radius: 10px;
            overflow: hidden;
            aspect-ratio: 4/3;
        }
        
        .gallery-item img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.3s ease;
        }
        
        .gallery-item:hover img {
            transform: scale(1.05);
        }
        
        /* SIDEBAR */
        .sidebar {
            position: sticky;
            top: 20px;
            height: fit-content;
        }
        
        .sidebar-card {
            background: #1e293b;
            padding: 25px;
            border-radius: 15px;
            margin-bottom: 25px;
            border: 1px solid rgba(255,255,255,0.1);
        }
        
        .sidebar-card h4 {
            color: #fff;
            margin-bottom: 20px;
            font-size: 1.2rem;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .related-item {
            padding: 15px;
            background: rgba(255,255,255,0.05);
            border-radius: 10px;
            margin-bottom: 12px;
            transition: all 0.3s ease;
            cursor: pointer;
        }
        
        .related-item:hover {
            background: rgba(102, 126, 234, 0.2);
            transform: translateX(5px);
        }
        
        .related-item h5 {
            color: #fff;
            margin-bottom: 8px;
            font-size: 0.95rem;
            line-height: 1.4;
        }
        
        .related-meta {
            display: flex;
            justify-content: space-between;
            font-size: 0.8rem;
            color: #64748b;
        }
        
        /* PARTAGE */
        .share {
            margin-top: 40px;
            padding-top: 30px;
            border-top: 1px solid rgba(255,255,255,0.1);
        }
        
        .share h3 {
            color: #fff;
            margin-bottom: 20px;
        }
        
        .share-buttons {
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
        }
        
        .share-btn {
            padding: 12px 25px;
            border-radius: 10px;
            text-decoration: none;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 10px;
            transition: all 0.3s ease;
        }
        
        .share-btn.whatsapp {
            background: #25D366;
            color: white;
        }
        
        .share-btn.facebook {
            background: #3b5998;
            color: white;
        }
        
        .share-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        }
        
        /* COMMENTAIRES */
        .comments {
            margin-top: 50px;
            background: #1e293b;
            padding: 30px;
            border-radius: 15px;
        }
        
        .comments h3 {
            color: #fff;
            margin-bottom: 25px;
            font-size: 1.3rem;
        }
        
        .comment-form {
            margin-bottom: 30px;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        .form-input {
            width: 100%;
            padding: 15px;
            background: #0f172a;
            border: 2px solid rgba(255,255,255,0.1);
            border-radius: 10px;
            color: #fff;
            font-size: 1rem;
            font-family: inherit;
        }
        
        .form-input:focus {
            outline: none;
            border-color: #667eea;
        }
        
        textarea.form-input {
            min-height: 120px;
            resize: vertical;
        }
        
        .submit-btn {
            background: #667eea;
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 10px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .submit-btn:hover {
            background: #5a6fd8;
            transform: translateY(-2px);
        }
        
        .comment {
            background: rgba(255,255,255,0.05);
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 15px;
        }
        
        .comment-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
        }
        
        .comment-author {
            font-weight: 600;
            color: #fff;
        }
        
        .comment-date {
            color: #64748b;
            font-size: 0.9rem;
        }
        
        .comment-text {
            color: #cbd5e1;
            line-height: 1.6;
        }
        
        /* RESPONSIVE */
        @media (max-width: 1024px) {
            .article-container {
                grid-template-columns: 1fr;
                gap: 20px;
            }
            
            .sidebar {
                position: static;
            }
            
            .article-hero h1 {
                font-size: 2rem;
            }
        }
        
        @media (max-width: 768px) {
            .container {
                flex-direction: column;
                gap: 15px;
            }
            
            .video-meta {
                flex-direction: column;
                gap: 15px;
            }
            
            .share-buttons {
                flex-direction: column;
            }
            
            .article-hero {
                height: 300px;
            }
            
            .article-hero h1 {
                font-size: 1.5rem;
            }
        }
    </style>
</head>
<body>
    <div class="top-bar">
        <div class="container">
            <a href="/" class="logo"><i class="fas fa-newspaper"></i> Abu Media</a>
            <a href="/" class="back-btn"><i class="fas fa-arrow-left"></i> Retour à l'accueil</a>
        </div>
    </div>
    
    <article class="article-container">
        <header class="article-hero">
            <div class="hero-overlay">
                <span class="category">${articleData.categorie}</span>
                <h1>${articleData.titre}</h1>
                ${!isVideo ? `
                    <div class="meta">
                        <span><i class="fas fa-user"></i> ${articleData.auteur}</span>
                        <span><i class="fas fa-calendar"></i> ${new Date().toLocaleDateString('fr-FR')}</span>
                    </div>
                ` : ''}
            </div>
        </header>
        
        <main class="article-main">
            ${mainContent}
            
            <div class="share">
                <h3>Partager cet ${isVideo ? 'vidéo' : 'article'}</h3>
                <div class="share-buttons">
                    <a href="https://wa.me/?text=${encodeURIComponent(articleData.titre + ' - ' + articleUrl)}" class="share-btn whatsapp">
                        <i class="fab fa-whatsapp"></i> WhatsApp
                    </a>
                    <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}" class="share-btn facebook">
                        <i class="fab fa-facebook-f"></i> Facebook
                    </a>
                </div>
            </div>
            
            <div class="comments">
                <h3><i class="fas fa-comments"></i> Commentaires</h3>
                
                <form class="comment-form" id="commentForm">
                    <div class="form-group">
                        <input type="text" class="form-input" placeholder="Votre nom" required id="commentAuthor">
                    </div>
                    <div class="form-group">
                        <textarea class="form-input" placeholder="Votre commentaire..." required id="commentText"></textarea>
                    </div>
                    <button type="submit" class="submit-btn">
                        <i class="fas fa-paper-plane"></i> Publier le commentaire
                    </button>
                </form>
                
                <div id="commentsList">
                    <div class="comment">
                        <div class="comment-header">
                            <span class="comment-author">Admin</span>
                            <span class="comment-date">${new Date().toLocaleDateString('fr-FR')}</span>
                        </div>
                        <p class="comment-text">Soyez le premier à commenter cet ${isVideo ? 'vidéo' : 'article'} !</p>
                    </div>
                </div>
            </div>
        </main>
        
        <aside class="sidebar">
            <div class="sidebar-card">
                <h4><i class="fas fa-fire"></i> Articles Similaires</h4>
                <div id="relatedArticles">
                    <div class="related-item" onclick="window.location.href='/'">
                        <h5>Découvrez nos derniers articles</h5>
                        <div class="related-meta">
                            <span>Abu Media</span>
                            <span>${new Date().getFullYear()}</span>
                        </div>
                    </div>
                    <div class="related-item" onclick="window.location.href='/'">
                        <h5>Actualités en continu</h5>
                        <div class="related-meta">
                            <span>Abu Media</span>
                            <span>${new Date().getFullYear()}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="sidebar-card">
                <h4><i class="fas fa-info-circle"></i> À propos</h4>
                <p style="color: #cbd5e1; line-height: 1.6; font-size: 0.9rem;">
                    Abu Media Group - Votre source d'information fiable et actualisée. 
                    ${isVideo ? 'Retrouvez nos meilleures vidéos et reportages.' : 'Découvrez nos articles exclusifs et analyses.'}
                </p>
            </div>
        </aside>
    </article>
    
    <script>
        // Gestion des commentaires
        document.getElementById('commentForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const author = document.getElementById('commentAuthor').value;
            const text = document.getElementById('commentText').value;
            
            if (author && text) {
                const commentsList = document.getElementById('commentsList');
                const newComment = document.createElement('div');
                newComment.className = 'comment';
                newComment.innerHTML = \`
                    <div class="comment-header">
                        <span class="comment-author">\${author}</span>
                        <span class="comment-date">\${new Date().toLocaleDateString('fr-FR')}</span>
                    </div>
                    <p class="comment-text">\${text}</p>
                \`;
                
                // Ajouter au début de la liste
                commentsList.insertBefore(newComment, commentsList.firstChild);
                
                // Réinitialiser le formulaire
                this.reset();
                
                // Mettre à jour le compteur de vues (simulation)
                const viewCount = document.getElementById('viewCount');
                if (viewCount) {
                    const currentViews = parseInt(viewCount.textContent) || 0;
                    viewCount.textContent = (currentViews + 1) + ' vues';
                }
            }
        });
        
        // Simulation du chargement d'articles similaires
        setTimeout(() => {
            const relatedContainer = document.getElementById('relatedArticles');
            // Ici, vous pourriez faire un appel API pour les articles similaires
            console.log('Chargement des articles similaires...');
        }, 1000);
        
        // Fonction pour extraire l'ID YouTube
        function extractYouTubeId(url) {
            const regExp = /^.*((youtu.be\\/)|(v\\/)|(\\/.+\\/))([^#\\&\\?]*).*/;
            const match = url.match(regExp);
            return (match && match[5].length === 11) ? match[5] : null;
        }
        
        console.log('✅ Page ${isVideo ? 'vidéo' : 'article'} chargée avec succès');
    </script>
</body>
</html>`;
}

// Fonction utilitaire pour extraire l'ID YouTube
function extractYouTubeId(url) {
    if (!url) return null;
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/.+\/))([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[5].length === 11) ? match[5] : null;
}
