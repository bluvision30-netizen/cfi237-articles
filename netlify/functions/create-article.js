// GÃ©nÃ©rer HTML page article ULTRA MODERNE
function generateModernArticleHTML(articleData, articleId, slug, images) {
  const firstImage = images[0] || articleData.image;
  const articleUrl = `https://cfiupload.netlify.app/article/${slug}.html`;
  const currentDate = new Date().toISOString();
  
  const escapeJson = (str) => str.replace(/"/g, '\\"').replace(/\n/g, ' ');
  
  return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${articleData.titre} - Abu Media Group</title>
    <meta name="description" content="${articleData.extrait}">
    <meta name="keywords" content="${articleData.categorie}, ${articleData.auteur}, actualitÃ©s Cameroun, Abu Media">
    <meta name="author" content="${articleData.auteur}">
    <meta name="robots" content="index, follow">
    
    <link rel="canonical" href="${articleUrl}">
    
    <!-- OPEN GRAPH -->
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
    
    <!-- SCHEMA.ORG -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      "headline": "${escapeJson(articleData.titre)}",
      "description": "${escapeJson(articleData.extrait)}",
      "image": ["${firstImage}"],
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
    
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        :root {
            --primary: #2563eb;
            --primary-dark: #1e40af;
            --secondary: #667eea;
            --dark: #0f172a;
            --gray: #64748b;
            --light: #f1f5f9;
            --success: #22c55e;
            --danger: #ef4444;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', 'Arial', sans-serif;
            line-height: 1.7;
            color: #1a1a1a;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        
        /* TOP BAR */
        .top-bar {
            background: rgba(15, 23, 42, 0.95);
            backdrop-filter: blur(10px);
            color: white;
            padding: 12px 0;
            position: sticky;
            top: 0;
            z-index: 1000;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        }
        
        .top-bar-container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 0 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .logo {
            font-size: 1.5rem;
            font-weight: 800;
            display: flex;
            align-items: center;
            gap: 10px;
            color: white;
            text-decoration: none;
            transition: transform 0.3s;
        }
        
        .logo:hover {
            transform: scale(1.05);
        }
        
        .logo i {
            color: var(--primary);
            background: white;
            padding: 8px;
            border-radius: 10px;
        }
        
        .back-btn {
            background: rgba(255,255,255,0.1);
            border: 2px solid rgba(255,255,255,0.2);
            color: white;
            padding: 10px 20px;
            border-radius: 25px;
            text-decoration: none;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.3s;
        }
        
        .back-btn:hover {
            background: rgba(255,255,255,0.2);
            transform: translateY(-2px);
        }
        
        /* CONTAINER PRINCIPAL */
        .main-container {
            max-width: 1200px;
            margin: 30px auto;
            background: white;
            border-radius: 24px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        
        /* HERO HEADER */
        .article-hero {
            position: relative;
            height: 500px;
            overflow: hidden;
        }
        
        .article-hero::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.9));
            z-index: 1;
        }
        
        .hero-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
            animation: zoomIn 0.8s ease-out;
        }
        
        @keyframes zoomIn {
            from {
                transform: scale(1.1);
                opacity: 0;
            }
            to {
                transform: scale(1);
                opacity: 1;
            }
        }
        
        .hero-content {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            padding: 40px;
            z-index: 2;
            color: white;
        }
        
        .category-badge {
            display: inline-block;
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            color: white;
            padding: 10px 20px;
            border-radius: 25px;
            font-size: 0.875rem;
            font-weight: 700;
            margin-bottom: 20px;
            box-shadow: 0 4px 15px rgba(37, 99, 235, 0.4);
            animation: slideUp 0.6s ease-out 0.2s both;
        }
        
        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .article-title {
            font-size: 3rem;
            font-weight: 900;
            line-height: 1.2;
            margin-bottom: 20px;
            text-shadow: 0 4px 20px rgba(0,0,0,0.5);
            animation: slideUp 0.6s ease-out 0.3s both;
        }
        
        .article-meta {
            display: flex;
            flex-wrap: wrap;
            gap: 30px;
            font-size: 0.95rem;
            opacity: 0.95;
            animation: slideUp 0.6s ease-out 0.4s both;
        }
        
        .meta-item {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .meta-item i {
            color: var(--primary);
        }
        
        /* CONTENT LAYOUT */
        .content-wrapper {
            display: grid;
            grid-template-columns: 1fr 350px;
            gap: 40px;
            padding: 50px;
        }
        
        /* ARTICLE CONTENT */
        .article-content {
            animation: fadeIn 0.8s ease-out 0.5s both;
        }
        
        @keyframes fadeIn {
            from {
                opacity: 0;
            }
            to {
                opacity: 1;
            }
        }
        
        .excerpt {
            font-size: 1.35rem;
            font-weight: 500;
            color: var(--gray);
            line-height: 1.7;
            margin-bottom: 40px;
            padding: 25px;
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.05), rgba(118, 75, 162, 0.05));
            border-left: 5px solid var(--primary);
            border-radius: 0 12px 12px 0;
        }
        
        .article-body {
            font-size: 1.15rem;
            line-height: 1.9;
            color: #2d3748;
        }
        
        .article-body p {
            margin-bottom: 28px;
        }
        
        .article-body p:first-letter {
            font-size: 3.5rem;
            font-weight: 700;
            float: left;
            line-height: 1;
            margin: 0 10px 0 0;
            color: var(--primary);
        }
        
        /* GALERIE */
        .gallery {
            margin: 50px 0;
            animation: fadeIn 1s ease-out;
        }
        
        .gallery-title {
            font-size: 1.75rem;
            font-weight: 700;
            margin-bottom: 25px;
            color: var(--dark);
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .gallery-title i {
            color: var(--primary);
        }
        
        .gallery-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 20px;
        }
        
        .gallery-item {
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            cursor: pointer;
            position: relative;
        }
        
        .gallery-item::before {
            content: 'ðŸ"';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0);
            font-size: 3rem;
            opacity: 0;
            transition: all 0.3s;
            z-index: 2;
        }
        
        .gallery-item:hover {
            transform: translateY(-8px) scale(1.02);
            box-shadow: 0 12px 40px rgba(37, 99, 235, 0.3);
        }
        
        .gallery-item:hover::before {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
        }
        
        .gallery-item img {
            width: 100%;
            height: 250px;
            object-fit: cover;
            display: block;
            transition: all 0.4s;
        }
        
        .gallery-item:hover img {
            filter: brightness(0.7);
        }
        
        /* ACTIONS BAR */
        .actions-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 30px;
            background: linear-gradient(135deg, var(--light), #e2e8f0);
            border-radius: 16px;
            margin: 40px 0;
            box-shadow: 0 4px 15px rgba(0,0,0,0.05);
        }
        
        .like-btn {
            display: flex;
            align-items: center;
            gap: 10px;
            background: white;
            border: 2px solid var(--light);
            padding: 15px 30px;
            border-radius: 50px;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        
        .like-btn:hover {
            background: linear-gradient(135deg, #fecaca, #fca5a5);
            border-color: var(--danger);
            color: var(--danger);
            transform: scale(1.05);
        }
        
        .like-btn.liked {
            background: linear-gradient(135deg, var(--danger), #dc2626);
            border-color: var(--danger);
            color: white;
            animation: pulse 0.5s;
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
        }
        
        .like-btn i {
            font-size: 1.3rem;
        }
        
        .views-count {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 1rem;
            color: var(--gray);
            font-weight: 600;
        }
        
        .views-count i {
            color: var(--primary);
            font-size: 1.2rem;
        }
        
        /* PARTAGE */
        .share-section {
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
            border-radius: 20px;
            padding: 35px;
            margin: 40px 0;
            border: 2px solid rgba(102, 126, 234, 0.2);
        }
        
        .share-title {
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 25px;
            color: var(--dark);
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .share-title i {
            color: var(--primary);
        }
        
        .share-buttons {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }
        
        .share-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            padding: 16px 24px;
            border-radius: 14px;
            text-decoration: none;
            font-weight: 700;
            font-size: 1rem;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        
        .share-btn:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.2);
        }
        
        .share-btn i {
            font-size: 1.3rem;
        }
        
        .whatsapp {
            background: linear-gradient(135deg, #25D366, #128C7E);
            color: white;
        }
        
        .facebook {
            background: linear-gradient(135deg, #3b5998, #2d4373);
            color: white;
        }
        
        .twitter {
            background: linear-gradient(135deg, #1DA1F2, #0d8bd9);
            color: white;
        }
        
        /* SIDEBAR */
        .sidebar {
            position: sticky;
            top: 100px;
            height: fit-content;
        }
        
        .sidebar-card {
            background: white;
            border-radius: 16px;
            padding: 25px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
            margin-bottom: 25px;
            border: 1px solid rgba(0,0,0,0.05);
            transition: all 0.3s;
        }
        
        .sidebar-card:hover {
            box-shadow: 0 8px 30px rgba(0,0,0,0.15);
            transform: translateY(-4px);
        }
        
        .sidebar-title {
            font-size: 1.3rem;
            font-weight: 700;
            margin-bottom: 20px;
            color: var(--dark);
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .sidebar-title i {
            color: var(--primary);
        }
        
        /* ARTICLES SIMILAIRES */
        .related-article {
            display: flex;
            gap: 15px;
            padding: 15px;
            border-bottom: 1px solid var(--light);
            cursor: pointer;
            transition: all 0.3s;
            border-radius: 10px;
        }
        
        .related-article:last-child {
            border-bottom: none;
        }
        
        .related-article:hover {
            background: var(--light);
            transform: translateX(5px);
        }
        
        .related-article img {
            width: 90px;
            height: 70px;
            object-fit: cover;
            border-radius: 10px;
            flex-shrink: 0;
        }
        
        .related-article h4 {
            font-size: 0.95rem;
            font-weight: 600;
            line-height: 1.5;
            color: var(--dark);
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
        
        .related-date {
            font-size: 0.75rem;
            color: var(--gray);
            margin-top: 5px;
        }
        
        /* COMMENTAIRES */
        .comments-section {
            margin: 50px 0;
            animation: fadeIn 1.2s ease-out;
        }
        
        .comments-title {
            font-size: 2rem;
            font-weight: 700;
            margin-bottom: 30px;
            color: var(--dark);
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .comments-title i {
            color: var(--primary);
        }
        
        .comment-form {
            background: linear-gradient(135deg, var(--light), #e2e8f0);
            padding: 30px;
            border-radius: 16px;
            margin-bottom: 40px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.05);
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        .form-control {
            width: 100%;
            padding: 15px 20px;
            border: 2px solid rgba(0,0,0,0.1);
            border-radius: 12px;
            font-family: inherit;
            font-size: 1rem;
            transition: all 0.3s;
        }
        
        .form-control:focus {
            outline: none;
            border-color: var(--primary);
            box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
        }
        
        textarea.form-control {
            min-height: 140px;
            resize: vertical;
        }
        
        .btn {
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            color: white;
            border: none;
            padding: 15px 35px;
            border-radius: 12px;
            font-size: 1rem;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s;
            box-shadow: 0 4px 15px rgba(37, 99, 235, 0.3);
        }
        
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(37, 99, 235, 0.4);
        }
        
        .comments-list {
            margin-top: 30px;
        }
        
        .comment {
            background: white;
            border-radius: 16px;
            padding: 25px;
            margin-bottom: 20px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.05);
            border-left: 4px solid var(--primary);
            transition: all 0.3s;
        }
        
        .comment:hover {
            box-shadow: 0 8px 25px rgba(0,0,0,0.1);
            transform: translateX(5px);
        }
        
        .comment-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 15px;
        }
        
        .comment-author {
            font-weight: 700;
            font-size: 1.1rem;
            color: var(--dark);
        }
        
        .comment-date {
            color: var(--gray);
            font-size: 0.875rem;
        }
        
        .comment-body {
            line-height: 1.7;
            color: #4a5568;
        }
        
        .empty-state {
            text-align: center;
            padding: 60px 20px;
            color: var(--gray);
        }
        
        .empty-state i {
            font-size: 4rem;
            margin-bottom: 20px;
            opacity: 0.3;
        }
        
        /* FOOTER */
        .footer {
            background: linear-gradient(135deg, var(--dark) 0%, #1e293b 100%);
            color: white;
            padding: 50px 30px 30px;
            text-align: center;
        }
        
        .footer-logo {
            font-size: 2rem;
            font-weight: 800;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
        }
        
        .footer-logo i {
            color: var(--primary);
        }
        
        .footer-links {
            display: flex;
            justify-content: center;
            gap: 30px;
            margin: 25px 0;
            flex-wrap: wrap;
        }
        
        .footer-links a {
            color: rgba(255,255,255,0.8);
            text-decoration: none;
            font-weight: 600;
            transition: all 0.3s;
        }
        
        .footer-links a:hover {
            color: var(--primary);
            transform: translateY(-2px);
        }
        
        .copyright {
            margin-top: 30px;
            opacity: 0.6;
            font-size: 0.9rem;
        }
        
        /* RESPONSIVE */
        @media (max-width: 1024px) {
            .content-wrapper {
                grid-template-columns: 1fr;
            }
            
            .sidebar {
                position: static;
            }
        }
        
        @media (max-width: 768px) {
            .article-hero {
                height: 350px;
            }
            
            .article-title {
                font-size: 2rem;
            }
            
            .content-wrapper {
                padding: 30px 20px;
            }
            
            .article-meta {
                flex-direction: column;
                gap: 12px;
            }
            
            .share-buttons {
                grid-template-columns: 1fr;
            }
            
            .actions-bar {
                flex-direction: column;
                gap: 15px;
            }
        }
    </style>
</head>
<body>
    <!-- TOP BAR -->
    <div class="top-bar">
        <div class="top-bar-container">
            <a href="https://cfiupload.netlify.app" class="logo">
                <i class="fas fa-newspaper"></i>
                Abu Media Group
            </a>
            <a href="https://cfiupload.netlify.app" class="back-btn">
                <i class="fas fa-arrow-left"></i>
                Retour Ã  l'accueil
            </a>
        </div>
    </div>

    <!-- MAIN CONTAINER -->
    <div class="main-container">
        <!-- HERO HEADER -->
        <div class="article-hero">
            <img src="${firstImage}" alt="${articleData.titre}" class="hero-image">
            <div class="hero-content">
                <span class="category-badge">
                    <i class="fas fa-bookmark"></i> ${articleData.categorie}
                </span>
                <h1 class="article-title">${articleData.titre}</h1>
                <div class="article-meta">
                    <div class="meta-item">
                        <i class="fas fa-user-circle"></i>
                        <span>${articleData.auteur}</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-calendar-alt"></i>
                        <span>${new Date().toLocaleDateString('fr-FR', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                        })}</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-clock"></i>
                        <span>${Math.ceil(articleData.contenu.split(' ').length / 200)} min de lecture</span>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- CONTENT WRAPPER -->
        <div class="content-wrapper">
            <!-- MAIN CONTENT -->
            <div class="article-content">
                <div class="excerpt">${articleData.extrait}</div>
                
                <div class="article-body">
                    ${articleData.contenu.split('\n\n').map(paragraph => {
                        const trimmed = paragraph.trim();
                        return trimmed ? `<p>${trimmed}</p>` : '';
                    }).join('')}
                </div>
                
                ${images.length > 1 ? `
                    <div class="gallery">
                        <h3 class="gallery-title">
                            <i class="fas fa-images"></i>
                            Galerie Photos
                        </h3>
                        <div class="gallery-grid">
                            ${images.slice(1).map((img, index) => `
                                <div class="gallery-item" onclick="window.open('${img}', '_blank')">
                                    <img src="${img}" alt="Photo ${index + 2}" loading="lazy">
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                
                <!-- ACTIONS BAR -->
                <div class="actions-bar">
                    <button class="like-btn" id="likeBtn" onclick="toggleLike()">
                        <i class="far fa-heart"></i>
                        <span id="likeCount">0</span> J'aime
                    </button>
                    <div class="views-count">
                        <i class="fas fa-eye"></i>
                        <span id="viewsCount">0 vues</span>
                    </div>
                </div>
                
                <!-- PARTAGE -->
                <div class="share-section">
                    <h3 class="share-title">
                        <i class="fas fa-share-nodes"></i>
                        Partager cet article
                    </h3>
                    <div class="share-buttons">
                        <a href="https://wa.me/?text=${encodeURIComponent(articleData.titre + ' - ' + articleUrl)}" 
                           class="share-btn whatsapp" 
                           target="_blank">
                            <i class="fab fa-whatsapp"></i>
                            WhatsApp
                        </a>
                        <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}" 
                           class="share-btn facebook" 
                           target="_blank">
                            <i class="fab fa-facebook-f"></i>
                            Facebook
                        </a>
                        <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(articleData.titre)}&url=${encodeURIComponent(articleUrl)}" 
                           class="share-btn twitter" 
                           target="_blank">
                            <i class="fab fa-twitter"></i>
                            Twitter
                        </a>
                    </div>
                </div>
                
                <!-- COMMENTAIRES -->
                <div class="comments-section">
                    <h2 class="comments-title">
                        <i class="fas fa-comments"></i>
                        Commentaires
                    </h2>
                    
                    <div class="comment-form">
                        <div class="form-group">
                            <input type="text" 
                                   class="form-control" 
                                   id="commentName" 
                                   placeholder="Votre nom">
                        </div>
                        <div class="form-group">
                            <textarea class="form-control" 
                                      id="commentText" 
                                      placeholder="Votre commentaire..."></textarea>
                        </div>
                        <button class="btn" onclick="submitComment()">
                            <i class="fas fa-paper-plane"></i>
                            Publier le commentaire
                        </button>
                    </div>
                    
                    <div class="comments-list" id="commentsList">
                        <div class="empty-state">
                            <i class="fas fa-comment-slash"></i>
                            <p>Soyez le premier à commenter cet article</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- SIDEBAR -->
            <aside class="sidebar">
                <!-- ARTICLES SIMILAIRES -->
                <div class="sidebar-card">
                    <h3 class="sidebar-title">
                        <i class="fas fa-newspaper"></i>
                        Articles Similaires
                    </h3>
                    <div id="relatedArticles">
                        <div style="text-align: center; padding: 20px; color: var(--gray);">
                            <i class="fas fa-spinner fa-spin" style="font-size: 2rem;"></i>
                            <p style="margin-top: 10px;">Chargement...</p>
                        </div>
                    </div>
                </div>
                
                <!-- CATÉGORIES POPULAIRES -->
                <div class="sidebar-card">
                    <h3 class="sidebar-title">
                        <i class="fas fa-th-large"></i>
                        Catégories
                    </h3>
                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        <a href="https://cfiupload.netlify.app?category=Politique" 
                           style="display: flex; align-items: center; gap: 10px; padding: 12px; background: var(--light); border-radius: 10px; text-decoration: none; color: var(--dark); transition: all 0.3s;">
                            <i class="fas fa-landmark" style="color: var(--primary);"></i>
                            <span>Politique</span>
                        </a>
                        <a href="https://cfiupload.netlify.app?category=Sports" 
                           style="display: flex; align-items: center; gap: 10px; padding: 12px; background: var(--light); border-radius: 10px; text-decoration: none; color: var(--dark); transition: all 0.3s;">
                            <i class="fas fa-futbol" style="color: var(--success);"></i>
                            <span>Sports</span>
                        </a>
                        <a href="https://cfiupload.netlify.app?category=Économie" 
                           style="display: flex; align-items: center; gap: 10px; padding: 12px; background: var(--light); border-radius: 10px; text-decoration: none; color: var(--dark); transition: all 0.3s;">
                            <i class="fas fa-chart-line" style="color: #f59e0b;"></i>
                            <span>Économie</span>
                        </a>
                        <a href="https://cfiupload.netlify.app?category=Société" 
                           style="display: flex; align-items: center; gap: 10px; padding: 12px; background: var(--light); border-radius: 10px; text-decoration: none; color: var(--dark); transition: all 0.3s;">
                            <i class="fas fa-users" style="color: #8b5cf6;"></i>
                            <span>Société</span>
                        </a>
                    </div>
                </div>
                
                <!-- NEWSLETTER -->
                <div class="sidebar-card" style="background: linear-gradient(135deg, var(--primary), var(--secondary)); color: white;">
                    <h3 style="color: white; margin-bottom: 15px;">
                        <i class="fas fa-envelope"></i>
                        Newsletter
                    </h3>
                    <p style="margin-bottom: 20px; opacity: 0.9;">
                        Recevez les dernières actualités directement dans votre boîte mail
                    </p>
                    <div class="form-group">
                        <input type="email" 
                               class="form-control" 
                               placeholder="Votre email"
                               style="margin-bottom: 10px;">
                        <button class="btn" 
                                style="width: 100%; background: white; color: var(--primary);">
                            S'abonner
                        </button>
                    </div>
                </div>
            </aside>
        </div>
    </div>
    
    <!-- FOOTER -->
    <footer class="footer">
        <div class="footer-logo">
            <i class="fas fa-newspaper"></i>
            Abu Media Group
        </div>
        <p style="max-width: 600px; margin: 0 auto 20px; opacity: 0.9;">
            Votre source d'information fiable au Cameroun. Suivez l'actualité en temps réel.
        </p>
        <nav class="footer-links">
            <a href="https://cfiupload.netlify.app">Accueil</a>
            <a href="https://cfiupload.netlify.app#actualites">Actualités</a>
            <a href="https://cfiupload.netlify.app#videos">Vidéos</a>
            <a href="https://cfiupload.netlify.app#societe">Société</a>
            <a href="https://cfiupload.netlify.app#contact">Contact</a>
        </nav>
        <div class="copyright">
            © 2025 Abu Media Group - Tous droits réservés
        </div>
    </footer>
    
    <script>
        // Configuration
        const ARTICLE_ID = '${articleId}';
        const ARTICLE_CATEGORY = '${articleData.categorie}';
        
        // ==========================================
        // SYSTÈME DE LIKES
        // ==========================================
        let likes = parseInt(localStorage.getItem('likes_' + ARTICLE_ID) || '0');
        let hasLiked = localStorage.getItem('hasLiked_' + ARTICLE_ID) === 'true';
        
        function toggleLike() {
            const likeBtn = document.getElementById('likeBtn');
            const likeCount = document.getElementById('likeCount');
            
            if (hasLiked) {
                likes = Math.max(0, likes - 1);
                hasLiked = false;
                likeBtn.classList.remove('liked');
                likeBtn.innerHTML = '<i class="far fa-heart"></i> <span id="likeCount">' + likes + '</span> J\\'aime';
            } else {
                likes++;
                hasLiked = true;
                likeBtn.classList.add('liked');
                likeBtn.innerHTML = '<i class="fas fa-heart"></i> <span id="likeCount">' + likes + '</span> J\\'aime';
            }
            
            localStorage.setItem('likes_' + ARTICLE_ID, likes);
            localStorage.setItem('hasLiked_' + ARTICLE_ID, hasLiked);
            
            likeCount.textContent = likes;
        }
        
        // Initialiser l'état du bouton like
        function initLikes() {
            const likeBtn = document.getElementById('likeBtn');
            const likeCount = document.getElementById('likeCount');
            
            likeCount.textContent = likes;
            
            if (hasLiked) {
                likeBtn.classList.add('liked');
                likeBtn.innerHTML = '<i class="fas fa-heart"></i> <span id="likeCount">' + likes + '</span> J\\'aime';
            }
        }
        
        // ==========================================
        // SYSTÈME DE VUES
        // ==========================================
        let views = parseInt(localStorage.getItem('views_' + ARTICLE_ID) || '0');
        
        function incrementViews() {
            // Vérifier si l'utilisateur a déjà vu cet article dans cette session
            const hasViewed = sessionStorage.getItem('viewed_' + ARTICLE_ID);
            
            if (!hasViewed) {
                views++;
                localStorage.setItem('views_' + ARTICLE_ID, views);
                sessionStorage.setItem('viewed_' + ARTICLE_ID, 'true');
            }
            
            document.getElementById('viewsCount').textContent = views + ' vues';
        }
        
        // ==========================================
        // SYSTÈME DE COMMENTAIRES
        // ==========================================
        function loadComments() {
            const comments = JSON.parse(localStorage.getItem('comments_' + ARTICLE_ID) || '[]');
            const container = document.getElementById('commentsList');
            
            if (comments.length === 0) {
                container.innerHTML = \`
                    <div class="empty-state">
                        <i class="fas fa-comment-slash"></i>
                        <p>Soyez le premier à commenter cet article</p>
                    </div>
                \`;
                return;
            }
            
            container.innerHTML = comments.map(comment => \`
                <div class="comment">
                    <div class="comment-header">
                        <div class="comment-author">
                            <i class="fas fa-user-circle" style="color: var(--primary); margin-right: 8px;"></i>
                            \${comment.name}
                        </div>
                        <div class="comment-date">\${formatDate(comment.date)}</div>
                    </div>
                    <div class="comment-body">\${comment.text}</div>
                </div>
            \`).join('');
        }
        
        function submitComment() {
            const nameInput = document.getElementById('commentName');
            const textInput = document.getElementById('commentText');
            
            const name = nameInput.value.trim();
            const text = textInput.value.trim();
            
            if (!name || !text) {
                alert('⚠️ Veuillez remplir tous les champs');
                return;
            }
            
            // Récupérer les commentaires existants
            const comments = JSON.parse(localStorage.getItem('comments_' + ARTICLE_ID) || '[]');
            
            // Ajouter le nouveau commentaire
            const newComment = {
                id: Date.now().toString(),
                name: name,
                text: text,
                date: new Date().toISOString()
            };
            
            comments.unshift(newComment);
            localStorage.setItem('comments_' + ARTICLE_ID, JSON.stringify(comments));
            
            // Réinitialiser les champs
            nameInput.value = '';
            textInput.value = '';
            
            // Afficher les commentaires
            loadComments();
            
            // Animation de succès
            const form = document.querySelector('.comment-form');
            form.style.background = 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.05))';
            setTimeout(() => {
                form.style.background = 'linear-gradient(135deg, var(--light), #e2e8f0)';
            }, 2000);
        }
        
        function formatDate(dateString) {
            const date = new Date(dateString);
            const now = new Date();
            const diffMs = now - date;
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            
            if (diffHours < 1) return 'À l\\'instant';
            if (diffHours < 24) return \`Il y a \${diffHours}h\`;
            if (diffDays === 1) return 'Hier';
            if (diffDays < 7) return \`Il y a \${diffDays}j\`;
            
            return date.toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        }
        
        // ==========================================
        // RÉCUPÉRER L'ID ARTICLE DEPUIS L'URL
        // ==========================================
        function getArticleIdFromUrl() {
            // Extraire de l'URL: /article/slug.html
            const path = window.location.pathname;
            const parts = path.split('/');
            const filename = parts[parts.length - 1];
            const slug = filename.replace('.html', '');
            return slug;
        }
        
        const ARTICLE_SLUG = getArticleIdFromUrl();
        console.log('📄 Article Slug:', ARTICLE_SLUG);
        
        // ==========================================
        // CHARGER ARTICLES SIMILAIRES
        // ==========================================
        async function loadRelatedArticles() {
            try {
                const response = await fetch('https://cfiupload.netlify.app/articles.json?t=' + Date.now());
                const data = await response.json();
                const allArticles = Object.values(data.articles || {});
                
                // Filtrer par catégorie (exclure l'article actuel)
                const related = allArticles
                    .filter(a => a.id !== ARTICLE_ID && a.categorie === ARTICLE_CATEGORY)
                    .slice(0, 5);
                
                const container = document.getElementById('relatedArticles');
                
                if (related.length === 0) {
                    container.innerHTML = \`
                        <p style="text-align: center; color: var(--gray); padding: 20px;">
                            Aucun article similaire
                        </p>
                    \`;
                    return;
                }
                
                container.innerHTML = related.map(article => {
                    const articleUrl = article.slug 
                        ? \`https://cfiupload.netlify.app/article/\${article.slug}.html\`
                        : \`https://cfiupload.netlify.app/article-detail.html?id=\${article.id}\`;
                    
                    return \`
                        <a href="\${articleUrl}" class="related-article" style="text-decoration: none; color: inherit;">
                            <img src="\${article.image}" alt="\${article.titre}">
                            <div>
                                <h4>\${article.titre}</h4>
                                <div class="related-date">\${formatDate(article.date)}</div>
                            </div>
                        </a>
                    \`;
                }).join('');
                
            } catch (error) {
                console.error('Erreur chargement articles similaires:', error);
                document.getElementById('relatedArticles').innerHTML = \`
                    <p style="text-align: center; color: var(--gray); padding: 20px;">
                        Erreur de chargement
                    </p>
                \`;
            }
        }
        
        // ==========================================
        // INITIALISATION
        // ==========================================
        document.addEventListener('DOMContentLoaded', function() {
            initLikes();
            incrementViews();
            loadComments();
            loadRelatedArticles();
            
            console.log('✅ Article moderne chargé');
            console.log('📊 Stats:', { likes, views, articleId: ARTICLE_ID });
        });
        
        // ==========================================
        // ANIMATIONS AU SCROLL
        // ==========================================
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animation = 'fadeIn 0.8s ease-out both';
                }
            });
        }, { threshold: 0.1 });
        
        document.querySelectorAll('.gallery-item, .comment, .sidebar-card').forEach(el => {
            observer.observe(el);
        });
        
        // ==========================================
        // SMOOTH SCROLL
        // ==========================================
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
    </script>
</body>
</html>`;
}

// Export de la fonction
module.exports = { generateModernArticleHTML };
