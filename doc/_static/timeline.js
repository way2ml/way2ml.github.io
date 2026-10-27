/**
 * Progressive enhancement for the Highlights and News timelines.
 *
 * The Markdown lists remain the source of truth. Direct image links in each
 * list item are mirrored into a visual gallery without changing the content.
 */
(function() {
    'use strict';

    const TIMELINE_PAGES = ['highlights', 'news'];
    const IMAGE_PATH = /\.(?:avif|gif|jpe?g|png|svg|webp)$/i;
    const DATE_PREFIX = /^(\d{4}(?:[.\-/]|\s+)\d{2}[.\-/]\d{2})\s+/;

    function isImageLink(link) {
        try {
            const url = new URL(link.href, window.location.href);
            return ['http:', 'https:'].includes(url.protocol) && IMAGE_PATH.test(url.pathname);
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
        date.className = 'timeline-date';
        date.dateTime = dateValue;
        date.textContent = dateLabel;

        const content = document.createElement('div');
        content.className = 'timeline-content';
        content.appendChild(paragraph);

        const imageLinks = Array.from(paragraph.querySelectorAll('a[href]')).filter(isImageLink);
        if (imageLinks.length) {
            item.classList.add('has-images');

            const gallery = document.createElement('div');
            gallery.className = 'timeline-gallery';
            gallery.dataset.count = String(Math.min(imageLinks.length, 4));

            imageLinks.forEach(function(link) {
                const photoLink = document.createElement('a');
                photoLink.className = 'timeline-photo';
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

        item.classList.add('timeline-item');
        item.prepend(date);
        item.appendChild(content);
    }

    function enhanceTimeline(pageId) {
        const list = document.querySelector('#' + pageId + ' > ul');
        if (!list || list.classList.contains('timeline-list')) return;

        list.classList.add('timeline-list');
        Array.from(list.children).forEach(enhanceItem);
    }

    function initTimelines() {
        TIMELINE_PAGES.forEach(enhanceTimeline);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTimelines);
    } else {
        initTimelines();
    }
})();
