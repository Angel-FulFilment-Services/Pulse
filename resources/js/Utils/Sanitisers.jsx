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
            const name = node.getAttribute('data-audio-name') || '';
            return `[audio:${name || src}](${src})`;
        }
    });
    
    return turndownService.turndown(htmlContent);
};

/**
 * Converts Markdown content with custom audio syntax back to HTML.
 * @param {string} markdownContent - The Markdown content to convert.
 * @returns {string} - The converted HTML content.
 */
export const convertFromMarkdown = (markdownContent) => {
    if (!markdownContent || typeof markdownContent !== 'string') {
        return '';
    }
    
    // Convert custom audio syntax [audio:filename](url) back to HTML
    const audioRegex = /\[audio:(.*?)\]\((.*?)\)/g;
    return markdownContent.replace(audioRegex, (match, name, src) => {
        return `<audio controls src="${src}" data-audio-name="${name}"></audio>`;
    });
};