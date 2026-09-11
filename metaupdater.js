const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const SITEMAP_PATH = './sitemap.xml';
const BASE_DOMAIN = 'https://istegecb.in';

async function processSite() {
    if (!fs.existsSync(SITEMAP_PATH)) {
        console.error("Error: sitemap.xml not found in the current directory!");
        return;
    }

    const sitemapContent = fs.readFileSync(SITEMAP_PATH, 'utf-8');
    const $xml = cheerio.load(sitemapContent, { xmlMode: true });

    $xml('loc').each((i, el) => {
        const fullUrl = $xml(el).text().trim();

        let urlPath = fullUrl.replace(BASE_DOMAIN, '').split('?')[0];

        let localFile = '';
        if (urlPath === '' || urlPath === '/') {
            localFile = 'index.html';
        } else {
            // Remove the starting slash
            let relativePath = urlPath.replace(/^\//, '');

            // FIX: Remove .html from the string if it exists so we don't search for .html.html
            let cleanBase = relativePath.replace(/\.html$/, '');

            // Check for the file locally
            if (fs.existsSync(cleanBase + '.html')) {
                localFile = cleanBase + '.html';
            } else if (fs.existsSync(path.join(cleanBase, 'index.html'))) {
                localFile = path.join(cleanBase, 'index.html');
            } else {
                console.log(`⚠️ Could not find local file for URL: ${fullUrl}`);
                return;
            }
        }

        if (fs.existsSync(localFile)) {
            updateHtmlFile(localFile, urlPath);
        }
    });

    console.log("\n✅ Finished updating all pages from sitemap!");
}

function updateHtmlFile(filePath, urlPath) {
    const html = fs.readFileSync(filePath, 'utf-8');
    const $ = cheerio.load(html);
    let modified = false;

    // The clean canonical URL should not have .html
    const cleanUrlPath = urlPath.replace(/\.html$/, '');
    const expectedCanonical = `${BASE_DOMAIN}${cleanUrlPath}`;

    // 1. Check and Update/Add Canonical Tag
    let canonicalTag = $('link[rel="canonical"]');
    if (canonicalTag.length > 0) {
        let currentHref = canonicalTag.attr('href');
        if (currentHref && currentHref.includes('.html')) {
            canonicalTag.attr('href', currentHref.replace(/\.html$/, ''));
            modified = true;
        }
    } else {
        $('head').append(`\n\t<!-- Canonical -->\n\t<link rel="canonical" href="${expectedCanonical}" />`);
        modified = true;
    }

    // 2. Check and Add Favicon Tag
    let iconTag = $('link[rel="icon"]');
    if (iconTag.length === 0) {
        // We inject it exactly as you requested
        $('head').append(`\n\t<link rel="icon" href="/assets/img/logo.png" type="image/icon type">`);
        modified = true;
    }

    // 3. Remove .html from all internal <a> links on the page
    $('a[href]').each(function () {
        let href = $(this).attr('href');

        if (href) { 
            // Only process internal links (skips http://external-site.com or mailto:)
            const isInternal = !href.startsWith('http') || href.startsWith(BASE_DOMAIN);

            if (isInternal && href.includes('.html')) {
                // Removes .html, safely ignoring query parameters like ?id=1 or anchors like #section
                const newHref = href.replace(/\.html(\?|#|$)/, '$1');

                if (newHref !== href) {
                    $(this).attr('href', newHref);
                    modified = true;
                }
            }
        }
    });

    // Save back to file if changes were made
    if (modified) {
        fs.writeFileSync(filePath, $.html(), 'utf-8');
        console.log(`Updated: ${filePath}`);
    } else {
        console.log(`Skipped (already clean): ${filePath}`);
    }
}

processSite();