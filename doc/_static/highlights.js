/**
 * Progressive enhancement for the Highlights page.
 *
 * The Markdown list remains the source of truth. Local image links in each
 * list item are mirrored into a visual gallery without changing the content.
 */
(function() {
    'use strict';

    const IMAGE_PATH = /\.(?:avif|gif|jpe?g|png|svg|webp)$/i;
    const DATE_PREFIX = /^(\d{4}(?:[.\-/]|\s+)\d{2}[.\-/]\d{2})\s+/;

    function isImageLink(link) {
        try {
            const url = new URL(link.href, window.location.href);
            return url.origin === window.location.origin && IMAGE_PATH.test(url.pathname);
        } catch (error) {
            return false;
        }
    }

    function findDateTextNode(element) {
        return Array.from(element.childNodes).find(function(node) {
            return node.nodeType === Node.TEXT_NODE && DATE_PREFIX.test(node.textContent);
        });
    }

    function cleanAltText(link, dateLabel) {
        const label = link.textContent.trim().replace(/^\[|\]$/g, '');
        return label || 'Photo from ' + dateLabel;
    }

    function enhanceItem(item) {
        const paragraph = item.querySelector(':scope > p');
        if (!paragraph) return;

        const dateNode = findDateTextNode(paragraph);
        const dateMatch = dateNode && dateNode.textContent.match(DATE_PREFIX);
        if (!dateMatch) return;

        const dateLabel = dateMatch[1].replace(/\s+|\//g, '.');
        const dateValue = dateLabel.replace(/\./g, '-');
        dateNode.textContent = dateNode.textContent.slice(dateMatch[0].length);

        const date = document.createElement('time');
        date.className = 'highlight-date';
        date.dateTime = dateValue;
        date.textContent = dateLabel;

        const content = document.createElement('div');
        content.className = 'highlight-content';
        content.appendChild(paragraph);

        const imageLinks = Array.from(paragraph.querySelectorAll('a[href]')).filter(isImageLink);
        if (imageLinks.length) {
            item.classList.add('has-images');

            const gallery = document.createElement('div');
            gallery.className = 'highlight-gallery';
            gallery.dataset.count = String(Math.min(imageLinks.length, 4));

            imageLinks.forEach(function(link) {
                const photoLink = document.createElement('a');
                photoLink.className = 'highlight-photo';
                photoLink.href = link.href;
                photoLink.target = '_blank';
                photoLink.rel = 'noopener';

                const image = document.createElement('img');
                image.src = link.href;
                image.alt = cleanAltText(link, dateLabel);
                image.loading = 'lazy';
                image.decoding = 'async';

                photoLink.appendChild(image);
                gallery.appendChild(photoLink);
            });

            content.appendChild(gallery);
        }

        item.classList.add('highlight-item');
        item.prepend(date);
        item.appendChild(content);
    }

    function initHighlights() {
        const list = document.querySelector('#highlights > ul');
        if (!list || list.classList.contains('highlights-timeline')) return;

        list.classList.add('highlights-timeline');
        Array.from(list.children).forEach(enhanceItem);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initHighlights);
    } else {
        initHighlights();
    }
})();
