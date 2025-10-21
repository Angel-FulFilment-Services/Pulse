import validator from 'validator';
import TurndownService from 'turndown';

/**
 * Sanitizes the input by removing all characters that appear in the blacklist.
 * @param {string} input - The input to sanitize.
 * @param {string} chars - The characters to remove from the input.
 * @returns {string} - The sanitized input.
 */
export const sanitizeBlacklist = (input, chars) => {
    return validator.blacklist(input, chars);
};

/**
 * Escapes HTML entities in the input.
 * @param {string} input - The input to sanitize.
 * @returns {string} - The sanitized input.
 */
export const sanitizeEscape = (input) => {
    return validator.escape(input);
};

/**
 * Trims characters from the left side of the input.
 * @param {string} input - The input to sanitize.
 * @param {string} [chars] - The characters to trim from the input.
 * @returns {string} - The sanitized input.
 */
export const sanitizeLtrim = (input, chars) => {
    return validator.ltrim(input, chars);
};

/**
 * Trims characters from the right side of the input.
 * @param {string} input - The input to sanitize.
 * @param {string} [chars] - The characters to trim from the input.
 * @returns {string} - The sanitized input.
 */
export const sanitizeRtrim = (input, chars) => {
    return validator.rtrim(input, chars);
};

/**
 * Normalizes the email address.
 * @param {string} email - The email to sanitize.
 * @param {object} [options] - Additional options for normalization.
 * @returns {string} - The normalized email.
 */
export const sanitizeNormalizeEmail = (email, options = {}) => {
    return validator.normalizeEmail(email, options);
};

/**
 * Converts the input to a boolean.
 * @param {string} input - The input to sanitize.
 * @param {boolean} [strict] - If true, only '1' and 'true' are converted to true.
 * @returns {boolean} - The sanitized boolean value.
 */
export const sanitizeToBoolean = (input, strict = false) => {
    return validator.toBoolean(input, strict);
};

/**
 * Converts the input to a date.
 * @param {string} input - The input to sanitize.
 * @returns {Date|null} - The sanitized date or null if the input is not a valid date.
 */
export const sanitizeToDate = (input) => {
    return validator.toDate(input);
};

/**
 * Converts the input to a float.
 * @param {string} input - The input to sanitize.
 * @returns {number} - The sanitized float value.
 */
export const sanitizeToFloat = (input) => {
    return validator.toFloat(input);
};

/**
 * Converts the input to an integer.
 * @param {string} input - The input to sanitize.
 * @param {number} [radix] - The radix or base to use for conversion.
 * @returns {number} - The sanitized integer value.
 */
export const sanitizeToInt = (input, radix = 10) => {
    return validator.toInt(input, radix);
};

/**
 * Trims characters from both sides of the input.
 * @param {string} input - The input to sanitize.
 * @param {string} [chars] - The characters to trim from the input.
 * @returns {string} - The sanitized input.
 */
export const sanitizeTrim = (input, chars) => {
    return validator.trim(input, chars);
};

/**
 * Unescapes HTML entities in the input.
 * @param {string} input - The input to sanitize.
 * @returns {string} - The sanitized input.
 */
export const sanitizeUnescape = (input) => {
    return validator.unescape(input);
};

/**
 * Sanitizes the input by removing all characters that do not appear in the whitelist.
 * @param {string} input - The input to sanitize.
 * @param {string} chars - The characters to whitelist.
 * @returns {string} - The sanitized input.
 */
export const sanitizeWhitelist = (input, chars) => {
    return validator.whitelist(input, chars);
};

/**
 * Sanitizes the input by converting it to lowercase.
 * @param {string} input - The input to sanitize.
 * @returns {string} - The sanitized input.
 */
export const sanitizeToLowerCase = (input) => {
    return input.toLowerCase();
};

/**
 * Sanitizes the input by converting it to uppercase.
 * @param {string} input - The input to sanitize.
 * @returns {string} - The sanitized input.
 */
export const sanitizeToUpperCase = (input) => {
    return input.toUpperCase();
};

/**
 * Sanitizes the input by removing all non-alphanumeric characters.
 * @param {string} input - The input to sanitize.
 * @returns {string} - The sanitized input.
 */
export const sanitizeAlphanumeric = (input) => {
    return input.replace(/[^a-z0-9]/gi, '');
};

/**
 * Sanitizes the input by removing all non-numeric characters.
 * @param {string} input - The input to sanitize.
 * @returns {string} - The sanitized telephone number.
 */
export const sanitizeTelephoneNumber = (input) => {
    return input.replace(/[^0-9]/g, '');
};

/**
 * Sanitizes the input by removing invalid URL characters.
 * @param {string} input - The input to sanitize.
 * @returns {string} - The sanitized URL.
 */
export const sanitizeURL = (input) => {
    // Remove any characters that are not allowed in URLs
    return input.replace(/[^a-zA-Z0-9-._~:/?#[\]@!$&'()*+,;=%]/g, '');
};

/**
 * Strips HTML tags from the input string.
 * @param {string} htmlContent - The HTML content to sanitize.
 * @returns {string} - The text content without HTML tags.
 */
export const stripHtmlTags = (htmlContent) => {
    if (!htmlContent || typeof htmlContent !== 'string') {
        return '';
    }
    return htmlContent.replace(/<[^>]*>/g, '').trim();
};

/**
 * Sanitizes the input by capitalizing the first letter of each word.
 * Useful for names, addresses, and other text that should be in proper case.
 * Preserves existing capital letters and handles word boundaries properly.
 * @param {string} input - The input to sanitize.
 * @returns {string} - The sanitized input with proper case formatting.
 */
export const sanitizeProperCase = (input) => {
    if (!input || typeof input !== 'string') {
        return input;
    }
    
    // Capitalize first letter of each word (\b\w matches word boundaries)
    return input.replace(/\b\w/g, (match) => match.toUpperCase());
};

/**
 * Converts HTML content to Markdown format.
 * @param {string} htmlContent - The HTML content to convert.
 * @returns {string} - The converted Markdown content.
 */
export const convertToMarkdown = (htmlContent) => {
    if (!htmlContent || typeof htmlContent !== 'string') {
        return '';
    }
    
    const turndownService = new TurndownService({
        headingStyle: 'atx',
        bulletListMarker: '-',
        codeBlockStyle: 'fenced',
        fence: '```',
        emDelimiter: '*',
        strongDelimiter: '**',
        linkStyle: 'inlined',
        linkReferenceStyle: 'full'
    });
    
    // Add custom rule for audio elements
    turndownService.addRule('audio', {
        filter: 'audio',
        replacement: function (content, node) {
            const src = node.getAttribute('src');
            let name = node.getAttribute('data-audio-name') || '';
            
            // If no data-audio-name, try to extract filename from URL
            if (!name && src) {
                try {
                    const url = new URL(src);
                    const pathname = url.pathname;
                    // Extract filename from path, handling both direct paths and nested paths
                    const parts = pathname.split('/');
                    const filename = parts[parts.length - 1];
                    
                    // Only use extracted filename if it looks like a valid audio file
                    if (filename && /\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(filename)) {
                        name = filename;
                    }
                } catch (e) {
                    // If URL parsing fails, try simple regex extraction
                    const match = src.match(/([^\/]+\.(mp3|wav|ogg|m4a|aac|flac))(\?.*)?$/i);
                    if (match) {
                        name = match[1];
                    }
                }
            }
            
            // If we have a filename, format it as the proper path format
            if (name && name !== src) {
                // Check if name already includes the [AUDIO: format first (most specific)
                if (name.startsWith('[AUDIO:') && name.endsWith(']')) {
                    // Already in [AUDIO:path] format, extract the inner path for display
                    const innerPath = name.slice(7, -1); // Remove [AUDIO: and ]
                    return `[audio:${innerPath}](${name})`;
                } else if (name.includes('knowledge-base/audio/') && !name.startsWith('[AUDIO:')) {
                    // Already has the path but not wrapped, wrap in [AUDIO:]
                    return `[audio:${name}]([AUDIO:${name}])`;
                } else {
                    // Just filename, add the full path and wrap
                    const audioPath = `knowledge-base/audio/${name}`;
                    return `[audio:${audioPath}]([AUDIO:${audioPath}])`;
                }
            }
            
            // Fallback to URL format if we can't extract a proper filename
            return `[audio:${name || src}](${src})`;
        }
    });
    
    return turndownService.turndown(htmlContent);
};

/**
 * Converts Markdown content with custom audio syntax back to HTML.
 * @param {string} markdownContent - The Markdown content to convert.
 * @param {Array} soundfiles - Optional array of soundfiles with temporary URLs.
 * @returns {string} - The converted HTML content.
 */
export const convertFromMarkdown = (markdownContent, soundfiles = []) => {
    if (!markdownContent || typeof markdownContent !== 'string') {
        return '';
    }
    
    let htmlContent = markdownContent;
    
    // First, temporarily replace audio elements to protect URLs from Markdown processing
    const audioPlaceholders = [];
    const audioRegex = /\[audio:(.*?)\]\((.*?)\)/g;
    htmlContent = htmlContent.replace(audioRegex, (match, name, src) => {
        // If we have soundfiles data, try to find a matching temporary URL
        if (soundfiles && soundfiles.length > 0) {
            const matchingSoundfile = soundfiles.find(sf => 
                sf.original_name === name || sf.path?.includes(name)
            );
            
            if (matchingSoundfile && matchingSoundfile.path) {
                src = matchingSoundfile.path; // Use the temporary URL
            }
        }
        
        const audioElement = `<audio controls src="${src}" data-audio-name="${name}"></audio>`;
        const placeholder = `AUDIOPLACEHOLDER${audioPlaceholders.length}`;
        audioPlaceholders.push(audioElement);
        return placeholder;
    });
    
    // Basic Markdown to HTML conversions (now safe from corrupting audio URLs)
    // Headers (do these first before paragraph processing)
    htmlContent = htmlContent.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    htmlContent = htmlContent.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    htmlContent = htmlContent.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    
    // Horizontal rules (do before paragraph processing)
    htmlContent = htmlContent.replace(/^---+\s*$/gim, '<hr>');
    htmlContent = htmlContent.replace(/^\*\*\*+\s*$/gim, '<hr>');
    htmlContent = htmlContent.replace(/^___+\s*$/gim, '<hr>');
    
    // Bold **text** or __text__
    htmlContent = htmlContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    htmlContent = htmlContent.replace(/__(.*?)__/g, '<strong>$1</strong>');
    
    // Italic *text* or _text_ (but avoid conflicting with bold)
    htmlContent = htmlContent.replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, '<em>$1</em>');
    htmlContent = htmlContent.replace(/(?<!_)_([^_]+?)_(?!_)/g, '<em>$1</em>');
    
    // Convert line breaks to <br> first
    htmlContent = htmlContent.replace(/\n/g, '<br>');
    
    // Convert double <br> to paragraph breaks, but preserve <hr> elements
    htmlContent = htmlContent.replace(/<br>\s*<br>/g, '</p><p>');
    
    // Wrap in paragraphs, but handle <hr> elements properly
    const parts = htmlContent.split('<hr>');
    htmlContent = parts.map(part => {
        part = part.trim();
        if (part && !part.startsWith('<h') && !part.includes('AUDIOPLACEHOLDER')) {
            return '<p>' + part + '</p>';
        }
        return part;
    }).join('<hr>');
    
    // Clean up extra paragraph tags
    htmlContent = htmlContent.replace(/<p><\/p>/g, '');
    htmlContent = htmlContent.replace(/^<p>|<\/p>$/g, '');
    
    // Finally, restore the audio elements from placeholders
    audioPlaceholders.forEach((audioElement, index) => {
        const placeholder = `AUDIOPLACEHOLDER${index}`;
        htmlContent = htmlContent.replace(new RegExp(placeholder, 'g'), audioElement);
    });
    
    return htmlContent.trim();
};