/**
 * Image Lightbox for Sphinx Documentation
 * Clicking on images opens them in a fullscreen overlay view
 */

(function() {
    'use strict';

    // Create lightbox elements
    function createLightbox() {
        // Check if lightbox already exists
        if (document.querySelector('.lightbox-overlay')) {
            return;
        }

        const overlay = document.createElement('div');
        overlay.className = 'lightbox-overlay';
        overlay.innerHTML = `
            <span class="lightbox-close">&times;</span>
            <img src="" alt="Lightbox image">
            <div class="lightbox-caption"></div>
        `;
        document.body.appendChild(overlay);

        // Get elements
        const closeBtn = overlay.querySelector('.lightbox-close');
        const lightboxImg = overlay.querySelector('img');
        const caption = overlay.querySelector('.lightbox-caption');

        // Close lightbox function
        function closeLightbox() {
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }

        // Close on overlay click (including the image itself)
        overlay.addEventListener('click', function(e) {
            closeLightbox();
        });

        // Close on Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && overlay.classList.contains('active')) {
                closeLightbox();
            }
        });

        return { overlay, lightboxImg, caption };
    }

    // Check if an image should be excluded from lightbox
    function shouldExclude(img) {
        // Exclude logo images
        if (img.classList.contains('logo__image')) return true;
        if (img.src && img.src.includes('logo')) return true;
        if (img.classList.contains('lightbox-ignore')) return true;
        
        // Exclude very small images (icons, badges, etc.)
        if (img.naturalWidth < 50 || img.naturalHeight < 50) return true;
        
        // Exclude images that are already in the lightbox
        if (img.closest('.lightbox-overlay')) return true;

        return false;
    }

    // Get caption text for an image
    function getCaption(img) {
        // Check if image is in a figure with a figcaption
        const figure = img.closest('figure');
        if (figure) {
            const figcaption = figure.querySelector('figcaption');
            if (figcaption) {
                return figcaption.textContent.trim();
            }
        }

        // Use alt text as fallback
        if (img.alt && img.alt !== 'Lightbox image') {
            return img.alt;
        }

        // Use title attribute as another fallback
        if (img.title) {
            return img.title;
        }

        return '';
    }

    // Initialize lightbox functionality
    function initLightbox() {
        const { overlay, lightboxImg, caption } = createLightbox() || {};
        
        if (!overlay) {
            // Get existing elements if lightbox was already created
            const existingOverlay = document.querySelector('.lightbox-overlay');
            if (!existingOverlay) return;
        }

        const lightboxOverlay = document.querySelector('.lightbox-overlay');
        const lbImg = lightboxOverlay.querySelector('img');
        const lbCaption = lightboxOverlay.querySelector('.lightbox-caption');

        // Add click handlers to all images in the main content
        const contentImages = document.querySelectorAll('.bd-article img, .bd-main .bd-content img');
        
        contentImages.forEach(function(img) {
            // Skip excluded images
            if (shouldExclude(img)) return;

            // Add click handler
            img.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();

                // Set the lightbox image source
                lbImg.src = img.src;
                lbImg.alt = img.alt || 'Enlarged image';

                // Set caption
                const captionText = getCaption(img);
                if (captionText) {
                    lbCaption.textContent = captionText;
                    lbCaption.style.display = 'block';
                } else {
                    lbCaption.style.display = 'none';
                }

                // Show lightbox
                lightboxOverlay.classList.add('active');
                document.body.style.overflow = 'hidden';
            });
        });
    }

    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initLightbox);
    } else {
        initLightbox();
    }

    // Also run after page load (for lazy-loaded images)
    window.addEventListener('load', initLightbox);
})();
