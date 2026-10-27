/**
 * Progressive enhancement for the Research, Moments, and News timelines.
 *
 * The Markdown lists remain the source of truth. Direct image links in each
 * list item are mirrored into a visual gallery without changing the content.
 */
(function() {
    'use strict';

    const TIMELINE_PAGES = ['research', 'moments', 'news'];
    const IMAGE_PATH = /\.(?:avif|gif|jpe?g|png|svg|webp)$/i;
    const DATE_PREFIX = /^(\d{4}(?:(?:[.\-/]|\s+)\d{2}[.\-/]\d{2})?)\s+/;

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

    function addCarouselControls(gallery, photos, item, triggers) {
        let currentIndex = 0;
        let autoPlayTimer = null;

        gallery.classList.add('timeline-carousel');

        const controls = document.createElement('div');
        controls.className = 'timeline-carousel-controls';

        const previous = document.createElement('button');
        previous.type = 'button';
        previous.className = 'timeline-carousel-button timeline-carousel-previous';
        previous.setAttribute('aria-label', 'Previous photo');
        previous.textContent = '‹';

        const counter = document.createElement('span');
        counter.className = 'timeline-carousel-counter';
        counter.setAttribute('aria-live', 'polite');

        const next = document.createElement('button');
        next.type = 'button';
        next.className = 'timeline-carousel-button timeline-carousel-next';
        next.setAttribute('aria-label', 'Next photo');
        next.textContent = '›';

        function showPhoto(index) {
            currentIndex = (index + photos.length) % photos.length;

            photos.forEach(function(photo, photoIndex) {
                photo.hidden = photoIndex !== currentIndex;
            });

            counter.textContent = (currentIndex + 1) + ' / ' + photos.length;
        }

        function startAutoPlay() {
            const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
            const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            if (autoPlayTimer || !canHover || reduceMotion) return;

            autoPlayTimer = window.setInterval(function() {
                showPhoto(currentIndex + 1);
            }, 2400);
        }

        function stopAutoPlay() {
            if (!autoPlayTimer) return;
            window.clearInterval(autoPlayTimer);
            autoPlayTimer = null;
            showPhoto(0);
        }

        previous.addEventListener('click', function(event) {
            event.preventDefault();
            event.stopPropagation();
            showPhoto(currentIndex - 1);
        });

        next.addEventListener('click', function(event) {
            event.preventDefault();
            event.stopPropagation();
            showPhoto(currentIndex + 1);
        });

        triggers.forEach(function(trigger) {
            trigger.addEventListener('pointerenter', startAutoPlay);
        });
        gallery.addEventListener('pointerenter', startAutoPlay);
        item.addEventListener('pointerleave', stopAutoPlay);

        controls.append(previous, counter, next);
        gallery.appendChild(controls);
        showPhoto(0);
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

        const contentChildren = Array.from(item.children);
        const content = document.createElement('div');
        content.className = 'timeline-content';
        contentChildren.forEach(function(child) {
            content.appendChild(child);
        });

        const imageLinks = Array.from(paragraph.querySelectorAll('a[href]')).filter(isImageLink);
        if (imageLinks.length) {
            item.classList.add('has-images');
            date.tabIndex = 0;

            const gallery = document.createElement('div');
            gallery.className = 'timeline-gallery';
            gallery.dataset.count = String(imageLinks.length);

            function positionGallery(clientX, clientY) {
                const itemRect = item.getBoundingClientRect();
                gallery.style.setProperty('--timeline-preview-x', (clientX - itemRect.left) + 'px');
                gallery.style.setProperty('--timeline-preview-y', (clientY - itemRect.top) + 'px');
            }

            function followPointer(event) {
                positionGallery(event.clientX, event.clientY);
            }

            [date, paragraph].forEach(function(trigger) {
                trigger.addEventListener('pointerenter', followPointer);
                trigger.addEventListener('pointermove', followPointer);
            });

            date.addEventListener('focus', function() {
                const dateRect = date.getBoundingClientRect();
                positionGallery(dateRect.left + dateRect.width / 2, dateRect.top);
            });

            const photos = [];

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
                photos.push(photoLink);
            });

            if (photos.length > 1) addCarouselControls(gallery, photos, item, [date, paragraph]);

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

    function parseBlogDate(value) {
        const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (isoMatch) {
            return {
                iso: value,
                label: isoMatch.slice(1).join('.'),
                timestamp: Date.UTC(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3])),
            };
        }

        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) return null;

        const year = parsed.getFullYear();
        const month = String(parsed.getMonth() + 1).padStart(2, '0');
        const day = String(parsed.getDate()).padStart(2, '0');
        return {
            iso: year + '-' + month + '-' + day,
            label: year + '.' + month + '.' + day,
            timestamp: Date.UTC(year, Number(month) - 1, Number(day)),
        };
    }

    function enhanceBlogTimeline() {
        const section = document.querySelector('#blogs');
        if (!section || section.querySelector('.blog-timeline')) return;

        const cards = Array.from(section.querySelectorAll('.blog-card'));
        if (!cards.length) return;

        cards.forEach(function(card, sourceIndex) {
            const meta = card.querySelector('.blog-card-meta');
            const metaParts = meta ? Array.from(meta.querySelectorAll('span')) : [];
            const datePart = metaParts.find(function(part) {
                return part.textContent.trim().startsWith('Date:');
            });
            const date = datePart && parseBlogDate(datePart.textContent.replace(/^Date:\s*/, '').trim());

            card.classList.add('timeline-item');
            card.dataset.sourceIndex = String(sourceIndex);
            card.dataset.sortDate = date ? String(date.timestamp) : '-1';

            if (date) {
                const time = document.createElement('time');
                time.className = 'timeline-date blog-card-date';
                time.dateTime = date.iso;
                time.textContent = date.label;
                card.prepend(time);
                datePart.remove();
            }

            let hasSource = false;
            metaParts.forEach(function(part) {
                const text = part.textContent.trim();
                if (text.startsWith('Author:')) {
                    part.textContent = text.replace(/^Author:\s*/, '');
                } else if (text.startsWith('Platform:')) {
                    part.textContent = text.replace(/^Platform:\s*/, '') + ' ↗';
                    part.classList.add('blog-card-source');
                    hasSource = true;
                }
            });

            if (meta && !hasSource) {
                const source = document.createElement('span');
                source.className = 'blog-card-source';
                source.textContent = 'Website';
                meta.appendChild(source);
            }
        });

        cards.sort(function(first, second) {
            const dateDifference = Number(second.dataset.sortDate) - Number(first.dataset.sortDate);
            return dateDifference || Number(first.dataset.sourceIndex) - Number(second.dataset.sourceIndex);
        });

        const timeline = document.createElement('div');
        timeline.className = 'blog-timeline';
        const firstCard = cards[0];
        const insertionPoint = firstCard.closest('.blog-cards-container') || firstCard;
        section.insertBefore(timeline, insertionPoint);
        cards.forEach(function(card) {
            timeline.appendChild(card);
        });

        section.querySelectorAll('.blog-cards-container').forEach(function(container) {
            if (!container.children.length) container.remove();
        });
    }

    function initTimelines() {
        TIMELINE_PAGES.forEach(enhanceTimeline);
        enhanceBlogTimeline();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTimelines);
    } else {
        initTimelines();
    }
})();
