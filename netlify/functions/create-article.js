// ==========================================
// NETLIFY FUNCTION - CREATE ARTICLE
// Version corrigée complète (Erreur 500 fixée)
// ==========================================

exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // OPTIONS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    console.log('🔥 === DÉBUT CRÉATION ARTICLE ===');
    
    // ✅ 1. VALIDATION GITHUB_TOKEN
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    if (!GITHUB_TOKEN) {
        console.error('❌ GITHUB_TOKEN manquant');
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                success: false,
                error: 'Configuration serveur manquante',
                details: 'GITHUB_TOKEN non défini. Ajoutez-le dans Netlify Environment Variables.'
            })
        };
    }
    console.log('✅ GITHUB_TOKEN présent');
    
    // ✅ 2. VALIDATION BODY
    if (!event.body) {
        console.error('❌ Body vide');
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ 
                success: false, 
                error: 'Corps de requête vide' 
            })
        };
    }
    
    // ✅ 3. PARSING JSON
    let articleData;
    try {
        articleData = JSON.parse(event.body);
        console.log('✅ JSON parsé correctement');
    } catch (parseError) {
        console.error('❌ Erreur parsing JSON:', parseError.message);
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ 
                success: false, 
                error: 'JSON invalide',
                details: parseError.message
            })
        };
    }
    
    // ✅ 4. VALIDATION TYPE OBJET
    if (!articleData || typeof articleData !== 'object' || Array.isArray(articleData)) {
        console.error('❌ Type de données invalide:', typeof articleData);
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ 
                success: false, 
                error: 'Format invalide - Objet JSON attendu' 
            })
        };
    }
    
    // ✅ 5. VALIDATION CHAMPS REQUIS
    const requiredFields = {
        titre: 'string',
        categorie: 'string',
        image: 'string',
        extrait: 'string',
        contenu: 'string'
    };
    
    const missingFields = [];
    const invalidFields = [];
    
    for (const [field, expectedType] of Object.entries(requiredFields)) {
        if (!articleData[field]) {
            missingFields.push(field);
        } else if (typeof articleData[field] !== expectedType) {
            invalidFields.push(`${field} (attendu: ${expectedType}, reçu: ${typeof articleData[field]})`);
        }
    }
    
    if (missingFields.length > 0) {
        console.error('❌ Champs manquants:', missingFields);
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ 
                success: false, 
                error: `Champs requis manquants: ${missingFields.join(', ')}`,
                missingFields: missingFields
            })
        };
    }
    
    if (invalidFields.length > 0) {
        console.error('❌ Types invalides:', invalidFields);
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ 
                success: false, 
                error: `Types de champs invalides: ${invalidFields.join(', ')}`,
                invalidFields: invalidFields
            })
        };
    }
    
    console.log('✅ Tous les champs requis sont valides');
    console.log('📝 Titre:', articleData.titre);
    console.log('📂 Catégorie:', articleData.categorie);

    // ✅ 6. GÉNÉRATION ID ET SLUG
    const articleId = 'art_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const slug = generateSlug(articleData.titre);
    
    console.log('🆔 ID généré:', articleId);
    console.log('🔗 Slug généré:', slug);
    
    // ✅ 7. SAUVEGARDE GITHUB
    console.log('💾 === DÉBUT SAUVEGARDE GITHUB ===');
    const saveResult = await saveToGitHub(articleData, articleId, slug, GITHUB_TOKEN);
    
    if (!saveResult.success) {
        throw new Error('Échec sauvegarde GitHub: ' + saveResult.error);
    }
    console.log('✅ articles.json sauvegardé');
    
    // ✅ 8. CRÉATION PAGE SEO
    console.log('📄 === DÉBUT CRÉATION PAGE SEO ===');
    const pageResult = await createArticlePage(articleData, articleId, slug, GITHUB_TOKEN);
    
    if (!pageResult.success) {
        console.warn('⚠️ Page SEO non créée:', pageResult.error);
    } else {
        console.log('✅ Page SEO créée');
    }

    // ✅ 9. SUCCÈS
    const articleUrl = `https://cfiupload.netlify.app/article/${slug}.html`;
    
    console.log('🎉 === ARTICLE PUBLIÉ AVEC SUCCÈS ===');
    console.log('🔗 URL:', articleUrl);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        articleId: articleId,
        slug: slug,
        articleUrl: articleUrl,
        articleData: {
            titre: articleData.titre,
            categorie: articleData.categorie
        },
        shareUrls: {
          whatsapp: `https://wa.me/?text=${encodeURIComponent(articleData.titre + ' - ' + articleUrl)}`,
          facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}`,
          twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(articleData.titre)}&url=${encodeURIComponent(articleUrl)}`
        },
        message: '✅ Article publié avec page SEO optimisée!'
      })
    };

  } catch (error) {
    console.error('❌ === ERREUR GLOBALE ===');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false,
        error: error.message || 'Erreur serveur interne',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
};

// ==========================================
// GÉNÉRER SLUG SEO
// ==========================================
function generateSlug(titre) {
  if (!titre || typeof titre !== 'string') {
    return 'article-' + Date.now();
  }
  
  try {
    return titre
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Enlever accents
      .replace(/[^a-z0-9 -]/g, '') // Caractères spéciaux
      .replace(/\s+/g, '-') // Espaces -> tirets
      .replace(/-+/g, '-') // Tirets multiples
      .replace(/^-+|-+$/g, '') // Tirets début/fin
      .substring(0, 60) || 'article-' + Date.now();
  } catch (error) {
    console.error('❌ Erreur génération slug:', error);
    return 'article-' + Date.now();
  }
}

// ==========================================
// SAUVEGARDER DANS GITHUB
// ==========================================
async function saveToGitHub(articleData, articleId, slug, GITHUB_TOKEN) {
  try {
    const REPO = 'bluvision30-netizen/cfi237-articles';
    const articlesUrl = `https://api.github.com/repos/${REPO}/contents/articles.json`;
    
    console.log('📖 Lecture articles.json existant...');
    
    let existingData = { articles: {} };
    let sha = '';

    try {
      const response = await fetch(articlesUrl, {
        headers: { 
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Abu-Media-Dashboard'
        }
      });
      
      if (response.ok) {
        const fileData = await response.json();
        const content = Buffer.from(fileData.content, 'base64').toString('utf8');
        existingData = JSON.parse(content);
        sha = fileData.sha;
        console.log(`📚 ${Object.keys(existingData.articles || {}).length} articles existants`);
      } else if (response.status === 404) {
        console.log('📝 Création nouveau articles.json');
      } else {
        throw new Error(`GitHub API error: ${response.status} - ${await response.text()}`);
      }
    } catch (fetchError) {
      if (fetchError.message.includes('404')) {
        console.log('📝 Création nouveau articles.json');
      } else {
        throw fetchError;
      }
    }

    // Créer objet article complet
    const completeArticle = {
      id: articleId,
      slug: slug,
      titre: articleData.titre,
      categorie: articleData.categorie,
      sections: articleData.sections || ['main'],
      image: articleData.image,
      images: articleData.images || JSON.stringify([articleData.image]),
      extrait: articleData.extrait,
      contenu: articleData.contenu,
      auteur: articleData.auteur || 'Admin',
      contentType: articleData.contentType || 'article',
      video_url: articleData.video_url || null,
      date: new Date().toISOString(),
      vues: 0,
      likes: 0
    };

    // Ajouter article
    if (!existingData.articles) existingData.articles = {};
    existingData.articles[articleId] = completeArticle;
    existingData.lastUpdate = new Date().toISOString();
    existingData.totalArticles = Object.keys(existingData.articles).length;

    console.log('💾 Sauvegarde sur GitHub...');
    
    const updateResponse = await fetch(articlesUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Abu-Media-Dashboard'
      },
      body: JSON.stringify({
        message: `📰 Nouvel article: ${articleData.titre}`,
        content: Buffer.from(JSON.stringify(existingData, null, 2)).toString('base64'),
        sha: sha || undefined
      })
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      throw new Error(`GitHub API error: ${updateResponse.status} - ${errorText}`);
    }

    console.log('✅ articles.json mis à jour avec succès');
    return { success: true };

  } catch (error) {
    console.error('❌ Erreur saveToGitHub:', error.message);
    return { success: false, error: error.message };
  }
}

// ==========================================
// CRÉER PAGE ARTICLE STATIQUE
// ==========================================
async function createArticlePage(articleData, articleId, slug, GITHUB_TOKEN) {
  try {
    const REPO = 'bluvision30-netizen/cfi237-articles';
    
    // Parse images
    let images = [articleData.image];
    try {
      if (articleData.images) {
        const parsed = typeof articleData.images === 'string' 
          ? JSON.parse(articleData.images) 
          : articleData.images;
        
        if (Array.isArray(parsed) && parsed.length > 0) {
          images = parsed;
        }
      }
    } catch (e) {
      console.warn('⚠️ Erreur parsing images, utilisation image principale');
    }
    
    console.log('🎨 Génération HTML...');
    const articleHTML = generateModernArticleHTML(articleData, articleId, slug, images);
    
    const articleUrl = `https://api.github.com/repos/${REPO}/contents/article/${slug}.html`;
    
    console.log(`📤 Upload vers /article/${slug}.html...`);
    
    const response = await fetch(articleUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Abu-Media-Dashboard'
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
    console.error('❌ Erreur createArticlePage:', error.message);
    return { success: false, error: error.message };
  }
}

// ==========================================
// GÉNÉRER HTML MODERNE
// ==========================================
function generateModernArticleHTML(articleData, articleId, slug, images) {
    const firstImage = images[0] || articleData.image;
    const articleUrl = `https://cfiupload.netlify.app/article/${slug}.html`;
    
    const isVideo = articleData.contentType === 'video' && articleData.video_url;
    const videoId = isVideo ? extractYouTubeId(articleData.video_url) : null;
    const videoThumbnail = isVideo ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null;
    
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
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${articleData.titre}">
    <meta name="twitter:description" content="${articleData.extrait}">
    <meta name="twitter:image" content="${isVideo ? videoThumbnail : firstImage}">
    
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; background: #0f172a; color: #f1f5f9; line-height: 1.6; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .article-hero { height: 400px; background: url('${firstImage}') center/cover; border-radius: 20px; position: relative; }
        .article-content { background: #1e293b; padding: 30px; border-radius: 15px; margin-top: 30px; }
        h1 { font-size: 2.5rem; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="article-hero"></div>
        <h1>${articleData.titre}</h1>
        <div class="article-content">
            <p>${articleData.extrait}</p>
            <div>${articleData.contenu}</div>
        </div>
    </div>
</body>
</html>`;
}

function extractYouTubeId(url) {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
    return match ? match[1] : null;
}
