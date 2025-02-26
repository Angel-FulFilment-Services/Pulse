import validator from 'validator';

const defaultOptions = {
    customMessage: '',
    customValidator: null,
    validatorOptions: {},
    errorCode: null,
    condition: null,
    logErrors: false,
    locale: 'en-GB',
};

const logError = (field, error) => {
    console.error(`Validation error in field "${field}":`, error);
};

/**
 * Validates if the value contains a specific substring.
 * @param {string} value - The value to validate.
 * @param {string} substring - The substring that should be contained in the value.
 * @param {object} options - Additional options for validation.
 * @returns {object|string} - Error object or empty string if valid.
 */
export const validateContainsString = (value, substring, options = {}) => {
    const { customMessage, customValidator, errorCode, condition, logErrors, validatorOptions } = { ...defaultOptions, ...options };
    if (condition && !condition(value)) {
        return '';
    }
    if (customValidator) {
        const customError = customValidator(value);
        if (customError) {
            if (logErrors) logError('containsString', customError);
            return customError;
        }
    }
    if (!validator.contains(value, substring, validatorOptions)) {
        const error = { message: customMessage || `The value must contain "${substring}"`, code: errorCode || 'CONTAINS_STRING' };
        if (logErrors) logError('containsString', error);
        return error;
    }
    return '';
};

/**
 * Validates if the value equals a specific target value.
 * @param {string} value - The value to validate.
 * @param {string} target - The target value to compare against.
 * @param {object} options - Additional options for validation.
 * @returns {object|string} - Error object or empty string if valid.
 */
export const validateEquals = (value, target, options = {}) => {
    const { customMessage, customValidator, errorCode, condition, logErrors } = { ...defaultOptions, ...options };
    if (condition && !condition(value)) {
        return '';
    }
    if (customValidator) {
        const customError = customValidator(value);
        if (customError) {
            if (logErrors) logError('equals', customError);
            return customError;
        }
    }
    if (!validator.equals(value, target)) {
        const error = { message: customMessage || `The value must equal "${target}"`, code: errorCode || 'EQUALS' };
        if (logErrors) logError('equals', error);
        return error;
    }
    return '';
};

/**
 * Validates if the value is a date after the specified target date.
 * @param {string} value - The date value to validate.
 * @param {string} targetDate - The target date to compare against.
 * @param {object} options - Additional options for validation.
 * @returns {object|string} - Error object or empty string if valid.
 */
export const validateIsAfterDate = (value, targetDate, options = {}) => {
    const { customMessage, customValidator, errorCode, condition, logErrors, validatorOptions } = { ...defaultOptions, ...options };
    if (condition && !condition(value)) {
        return '';
    }
    if (customValidator) {
        const customError = customValidator(value);
        if (customError) {
            if (logErrors) logError('isAfterDate', customError);
            return customError;
        }
    }
    if (!validator.isAfter(value, targetDate, validatorOptions)) {
        const error = { message: customMessage || `The date must be after ${targetDate}`, code: errorCode || 'IS_AFTER_DATE' };
        if (logErrors) logError('isAfterDate', error);
        return error;
    }
    return '';
};

/**
 * Validates if the value contains only alphabetic characters.
 * @param {string} value - The value to validate.
 * @param {object} options - Additional options for validation.
 * @returns {object|string} - Error object or empty string if valid.
 */
export const validateIsAlpha = (value, options = {}) => {
    const { customMessage, customValidator, errorCode, condition, logErrors, locale, validatorOptions } = { ...defaultOptions, ...options };
    if (condition && !condition(value)) {
        return '';
    }
    if (customValidator) {
        const customError = customValidator(value);
        if (customError) {
            if (logErrors) logError('isAlpha', customError);
            return customError;
        }
    }
    if (!validator.isAlpha(value, locale, validatorOptions)) {
        const error = { message: customMessage || 'The value must contain only alphabetic characters', code: errorCode || 'IS_ALPHA' };
        if (logErrors) logError('isAlpha', error);
        return error;
    }
    return '';
};

/**
 * Validates if the value is alphanumeric.
 * @param {string} value - The value to validate.
 * @param {object} options - Additional options for validation.
 * @returns {object|string} - Error object or empty string if valid.
 */
export const validateAlphanumeric = (value, options = {}) => {
    const { customMessage, customValidator, errorCode, condition, logErrors, locale, validatorOptions } = { ...defaultOptions, ...options };
    if (condition && !condition(value)) {
        return '';
    }
    if (customValidator) {
        const customError = customValidator(value);
        if (customError) {
            if (logErrors) logError('alphanumeric', customError);
            return customError;
        }
    }
    if (!validator.isAlphanumeric(value, locale, validatorOptions)) {
        const error = { message: customMessage || 'Invalid alphanumeric value', code: errorCode || 'INVALID_ALPHANUMERIC' };
        if (logErrors) logError('alphanumeric', error);
        return error;
    }
    return '';
};

/**
 * Validates if the value contains only ASCII characters.
 * @param {string} value - The value to validate.
 * @param {object} options - Additional options for validation.
 * @returns {object|string} - Error object or empty string if valid.
 */
export const validateAscii = (value, options = {}) => {
    const { customMessage, customValidator, errorCode, condition, logErrors } = { ...defaultOptions, ...options };
    if (condition && !condition(value)) {
        return '';
    }
    if (customValidator) {
        const customError = customValidator(value);
        if (customError) {
            if (logErrors) logError('ascii', customError);
            return customError;
        }
    }
    if (!validator.isAscii(value)) {
        const error = { message: customMessage || 'Invalid ASCII value', code: errorCode || 'INVALID_ASCII' };
        if (logErrors) logError('ascii', error);
        return error;
    }
    return '';
};

/**
 * Validates if the value is a valid base64 string.
 * @param {string} value - The value to validate.
 * @param {object} options - Additional options for validation.
 * @returns {object|string} - Error object or empty string if valid.
 */
export const validateBase64 = (value, options = {}) => {
    const { customMessage, customValidator, errorCode, condition, logErrors, validatorOptions } = { ...defaultOptions, ...options };
    if (condition && !condition(value)) {
        return '';
    }
    if (customValidator) {
        const customError = customValidator(value);
        if (customError) {
            if (logErrors) logError('base64', customError);
            return customError;
        }
    }
    if (!validator.isBase64(value, validatorOptions)) {
        const error = { message: customMessage || 'Invalid base64 value', code: errorCode || 'INVALID_BASE64' };
        if (logErrors) logError('base64', error);
        return error;
    }
    return '';
};

/**
 * Validates if the value is a date before the specified date.
 * @param {string} value - The date value to validate.
 * @param {string} date - The date to compare against.
 * @param {object} options - Additional options for validation.
 * @returns {object|string} - Error object or empty string if valid.
 */
export const validateBeforeDate = (value, date, options = {}) => {
    const { customMessage, customValidator, errorCode, condition, logErrors } = { ...defaultOptions, ...options };
    if (condition && !condition(value)) {
        return '';
    }
    if (customValidator) {
        const customError = customValidator(value);
        if (customError) {
            if (logErrors) logError('beforeDate', customError);
            return customError;
        }
    }
    if (!validator.isBefore(value, date)) {
        const error = { message: customMessage || `Date must be before ${date}`, code: errorCode || 'INVALID_DATE' };
        if (logErrors) logError('beforeDate', error);
        return error;
    }
    return '';
};

/**
 * Validates if the value is a boolean.
 * @param {string} value - The value to validate.
 * @param {object} options - Additional options for validation.
 * @returns {object|string} - Error object or empty string if valid.
 */
export const validateBoolean = (value, options = {}) => {
    const { customMessage, customValidator, errorCode, condition, logErrors, validatorOptions } = { ...defaultOptions, ...options };
    if (condition && !condition(value)) {
        return '';
    }
    if (customValidator) {
        const customError = customValidator(value);
        if (customError) {
            if (logErrors) logError('boolean', customError);
            return customError;
        }
    }
    if (!validator.isBoolean(value.toString(), validatorOptions)) {
        const error = { message: customMessage || 'Invalid boolean value', code: errorCode || 'INVALID_BOOLEAN' };
        if (logErrors) logError('boolean', error);
        return error;
    }
    return '';
};

/**
 * Validates if the value is a valid credit card number.
 * @param {string} value - The credit card number to validate.
 * @param {object} options - Additional options for validation.
 * @returns {object|string} - Error object or empty string if valid.
 */
export const validateCreditCard = (value, options = {}) => {
    const { customMessage, customValidator, errorCode, condition, logErrors, validatorOptions } = { ...defaultOptions, ...options };
    if (condition && !condition(value)) {
        return '';
    }
    if (customValidator) {
        const customError = customValidator(value);
        if (customError) {
            if (logErrors) logError('creditCard', customError);
            return customError;
        }
    }
    if (!validator.isCreditCard(value, validatorOptions)) {
        const error = { message: customMessage || 'Invalid credit card number', code: errorCode || 'INVALID_CREDIT_CARD' };
        if (logErrors) logError('creditCard', error);
        return error;
    }
    return '';
};

/**
 * Validates if the value is a valid currency amount.
 * @param {string} value - The currency amount to validate.
 * @param {object} options - Additional options for validation.
 * @returns {object|string} - Error object or empty string if valid.
 */
export const validateCurrency = (value, options = {}) => {
    const { customMessage, customValidator, errorCode, condition, logErrors, validatorOptions } = { ...defaultOptions, ...options };
    if (condition && !condition(value)) {
        return '';
    }
    if (customValidator) {
        const customError = customValidator(value);
        if (customError) {
            if (logErrors) logError('currency', customError);
            return customError;
        }
    }
    if (!validator.isCurrency(value, validatorOptions)) {
        const error = { message: customMessage || 'Invalid currency value', code: errorCode || 'INVALID_CURRENCY' };
        if (logErrors) logError('currency', error);
        return error;
    }
    return '';
};


/**
 * Validates if the value is a valid date.
 * @param {string} value - The date value to validate.
 * @param {object} options - Additional options for validation.
 * @returns {object|string} - Error object or empty string if valid.
 */
export const validateDate = (value, options = {}) => {
    const { customMessage, customValidator, errorCode, condition, logErrors, validatorOptions } = { ...defaultOptions, ...options };
    if (condition && !condition(value)) {
        return '';
    }
    if (customValidator) {
        const customError = customValidator(value);
        if (customError) {
            if (logErrors) logError('date', customError);
            return customError;
        }
    }
    if (!validator.isDate(value, validatorOptions)) {
        const error = { message: customMessage || 'Invalid date', code: errorCode || 'INVALID_DATE' };
        if (logErrors) logError('date', error);
        return error;
    }
    return '';
};

/**
 * Validates if the value is a decimal number.
 * @param {string} value - The value to validate.
 * @param {object} options - Additional options for validation.
 * @returns {object|string} - Error object or empty string if valid.
 */
export const validateDecimal = (value, options = {}) => {
    const { customMessage, customValidator, errorCode, condition, logErrors, validatorOptions } = { ...defaultOptions, ...options };
    if (condition && !condition(value)) {
        return '';
    }
    if (customValidator) {
        const customError = customValidator(value);
        if (customError) {
            if (logErrors) logError('decimal', customError);
            return customError;
        }
    }
    if (!validator.isDecimal(value, validatorOptions)) {
        const error = { message: customMessage || 'Invalid decimal value', code: errorCode || 'INVALID_DECIMAL' };
        if (logErrors) logError('decimal', error);
        return error;
    }
    return '';
};

/**
 * Validates if the value is divisible by a specific number.
 * @param {string} value - The value to validate.
 * @param {number} number - The number to check divisibility against.
 * @param {object} options - Additional options for validation.
 * @returns {object|string} - Error object or empty string if valid.
 */
export const validateDivisibleBy = (value, number, options = {}) => {
    const { customMessage, customValidator, errorCode, condition, logErrors } = { ...defaultOptions, ...options };
    if (condition && !condition(value)) {
        return '';
    }
    if (customValidator) {
        const customError = customValidator(value);
        if (customError) {
            if (logErrors) logError('divisibleBy', customError);
            return customError;
        }
    }
    if (!validator.isDivisibleBy(value, number)) {
        const error = { message: customMessage || `The value must be divisible by ${number}`, code: errorCode || 'INVALID_DIVISIBLE_BY' };
        if (logErrors) logError('divisibleBy', error);
        return error;
    }
    return '';
};

/**
 * Validates if the value is a valid EAN (European Article Number).
 * @param {string} value - The value to validate.
 * @param {object} options - Additional options for validation.
 * @returns {object|string} - Error object or empty string if valid.
 */
export const validateEAN = (value, options = {}) => {
    const { customMessage, customValidator, errorCode, condition, logErrors } = { ...defaultOptions, ...options };
    if (condition && !condition(value)) {
        return '';
    }
    if (customValidator) {
        const customError = customValidator(value);
        if (customError) {
            if (logErrors) logError('EAN', customError);
            return customError;
        }
    }
    if (!validator.isEAN(value)) {
        const error = { message: customMessage || 'Invalid EAN value', code: errorCode || 'INVALID_EAN' };
        if (logErrors) logError('EAN', error);
        return error;
    }
    return '';
};

/**
 * Validates if the value is a valid email address.
 * @param {string} email - The email to validate.
 * @param {object} options - Additional options for validation.
 * @returns {object|string} - Error object or empty string if valid.
 */
export const validateEmail = (email, options = {}) => {
    const { customMessage, customValidator, errorCode, condition, logErrors, validatorOptions } = { ...defaultOptions, ...options };
    if (condition && !condition(email)) {
        return '';
    }
    if (customValidator) {
        const customError = customValidator(email);
        if (customError) {
            if (logErrors) logError('email', customError);
            return customError;
        }
    }
    if (!validator.isEmail(email, validatorOptions)) {
        const error = { message: customMessage || 'Invalid email address', code: errorCode || 'INVALID_EMAIL' };
        if (logErrors) logError('email', error);
        return error;
    }
    return '';
};

/**
 * Validates if the value is not empty.
 * @param {string} value - The value to validate.
 * @param {string} fieldName - The name of the field being validated.
 * @param {object} options - Additional options for validation.
 * @returns {object|string} - Error object or empty string if valid.
 */
export const validateRequired = (value, fieldName, options = {}) => {
    const { customMessage, customValidator, errorCode, condition, logErrors, validatorOptions } = { ...defaultOptions, ...options };
    if (condition && !condition(value)) {
        return '';
    }
    if (customValidator) {
        const customError = customValidator(value);
        if (customError) {
            if (logErrors) logError(fieldName, customError);
            return customError;
        }
    }
    
    if (validator.isEmpty(value, validatorOptions)) {
        const error = { message: customMessage || `${fieldName} is required`, code: errorCode || 'REQUIRED_FIELD' };
        if (logErrors) logError(fieldName, error);
        return error;
    }
    return '';
};

/**
 * Validates if the value is a float.
 * @param {string} value - The value to validate.
 * @param {object} options - Additional options for validation.
 * @returns {object|string} - Error object or empty string if valid.
 */
export const validateFloat = (value, options = {}) => {
    const { customMessage, customValidator, errorCode, condition, logErrors, validatorOptions } = { ...defaultOptions, ...options };
    if (condition && !condition(value)) {
        return '';
    }
    if (customValidator) {
        const customError = customValidator(value);
        if (customError) {
            if (logErrors) logError('float', customError);
            return customError;
        }
    }
    if (!validator.isFloat(value, validatorOptions)) {
        const error = { message: customMessage || 'Invalid float value', code: errorCode || 'INVALID_FLOAT' };
        if (logErrors) logError('float', error);
        return error;
    }
    return '';
};

/**
 * Validates if the value is in a specified list of values.
 * @param {string} value - The value to validate.
 * @param {array} values - The list of values to check against.
 * @param {object} options - Additional options for validation.
 * @returns {object|string} - Error object or empty string if valid.
 */
export const validateIn = (value, values, options = {}) => {
    const { customMessage, customValidator, errorCode, condition, logErrors } = { ...defaultOptions, ...options };
    if (condition && !condition(value)) {
        return '';
    }
    if (customValidator) {
        const customError = customValidator(value);
        if (customError) {
            if (logErrors) logError('in', customError);
            return customError;
        }
    }
    if (!validator.isIn(value, values)) {
        const error = { message: customMessage || `The value must be one of ${values.join(', ')}`, code: errorCode || 'INVALID_IN' };
        if (logErrors) logError('in', error);
        return error;
    }
    return '';
};

/**
 * Validates if the value is an integer.
 * @param {string} value - The value to validate.
 * @param {object} options - Additional options for validation.
 * @returns {object|string} - Error object or empty string if valid.
 */
export const validateInt = (value, options = {}) => {
    const { customMessage, customValidator, errorCode, condition, logErrors, validatorOptions } = { ...defaultOptions, ...options };
    if (condition && !condition(value)) {
        return '';
    }
    if (customValidator) {
        const customError = customValidator(value);
        if (customError) {
            if (logErrors) logError('int', customError);
            return customError;
        }
    }
    if (!validator.isInt(value, validatorOptions)) {
        const error = { message: customMessage || 'Invalid integer value', code: errorCode || 'INVALID_INT' };
        if (logErrors) logError('int', error);
        return error;
    }
    return '';
};

/**
 * Validates if the value is a valid JSON string.
 * @param {string} value - The value to validate.
 * @param {object} options - Additional options for validation.
 * @returns {object|string} - Error object or empty string if valid.
 */
export const validateIsJSON = (value, options = {}) => {
    const { customMessage, customValidator, errorCode, condition, logErrors, validatorOptions } = { ...defaultOptions, ...options };
    if (condition && !condition(value)) {
        return '';
    }
    if (customValidator) {
        const customError = customValidator(value);
        if (customError) {
            if (logErrors) logError('isJSON', customError);
            return customError;
        }
    }
    if (!validator.isJSON(value, validatorOptions)) {
        const error = { message: customMessage || 'Invalid JSON string', code: errorCode || 'INVALID_JSON' };
        if (logErrors) logError('isJSON', error);
        return error;
    }
    return '';
};

/**
 * Validates if the value's length falls within the specified range.
 * @param {string} value - The value to validate.
 * @param {object} options - Additional options for validation.
 * @returns {object|string} - Error object or empty string if valid.
 */
export const validateIsLength = (value, options = {}) => {
    const { customMessage, customValidator, errorCode, condition, logErrors, validatorOptions } = { ...defaultOptions, ...options };
    if (condition && !condition(value)) {
        return '';
    }
    if (customValidator) {
        const customError = customValidator(value);
        if (customError) {
            if (logErrors) logError('isLength', customError);
            return customError;
        }
    }
    if (!validator.isLength(value, validatorOptions)) {
        const error = { message: customMessage || 'The value does not meet the length requirements', code: errorCode || 'INVALID_LENGTH' };
        if (logErrors) logError('isLength', error);
        return error;
    }
    return '';
};

/**
 * Validates if the value is a valid license plate number for a specific locale.
 * @param {string} value - The value to validate.
 * @param {object} options - Additional options for validation.
 * @returns {object|string} - Error object or empty string if valid.
 */
export const validateIsLicensePlate = (value, options = {}) => {
    const { customMessage, customValidator, errorCode, condition, logErrors, locale, validatorOptions } = { ...defaultOptions, ...options };
    if (condition && !condition(value)) {
        return '';
    }
    if (customValidator) {
        const customError = customValidator(value);
        if (customError) {
            if (logErrors) logError('isLicensePlate', customError);
            return customError;
        }
    }
    if (!validator.isLicensePlate(value, locale, validatorOptions)) {
        const error = { message: customMessage || `Invalid license plate number for locale "${locale}"`, code: errorCode || 'INVALID_LICENSE_PLATE' };
        if (logErrors) logError('isLicensePlate', error);
        return error;
    }
    return '';
};

/**
 * Validates if the value is in lowercase.
 * @param {string} value - The value to validate.
 * @param {object} options - Additional options for validation.
 * @returns {object|string} - Error object or empty string if valid.
 */
export const validateIsLowercase = (value, options = {}) => {
    const { customMessage, customValidator, errorCode, condition, logErrors } = { ...defaultOptions, ...options };
    if (condition && !condition(value)) {
        return '';
    }
    if (customValidator) {
        const customError = customValidator(value);
        if (customError) {
            if (logErrors) logError('isLowercase', customError);
            return customError;
        }
    }
    if (!validator.isLowercase(value)) {
        const error = { message: customMessage || 'The value must be in lowercase', code: errorCode || 'NOT_LOWERCASE' };
        if (logErrors) logError('isLowercase', error);
        return error;
    }
    return '';
};

/**
 * Validates if the value is a valid MIME type.
 * @param {string} value - The value to validate.
 * @param {object} options - Additional options for validation.
 * @returns {object|string} - Error object or empty string if valid.
 */
export const validateIsMimeType = (value, options = {}) => {
    const { customMessage, customValidator, errorCode, condition, logErrors } = { ...defaultOptions, ...options };
    if (condition && !condition(value)) {
        return '';
    }
    if (customValidator) {
        const customError = customValidator(value);
        if (customError) {
            if (logErrors) logError('isMimeType', customError);
            return customError;
        }
    }
    if (!validator.isMimeType(value)) {
        const error = { message: customMessage || 'Invalid MIME type', code: errorCode || 'INVALID_MIME_TYPE' };
        if (logErrors) logError('isMimeType', error);
        return error;
    }
    return '';
};

/**
 * Validates if the value is a valid mobile phone number for a specific locale.
 * @param {string} value - The value to validate.
 * @param {string} [locale] - The locale to validate against.
 * @param {object} options - Additional options for validation.
 * @returns {object|string} - Error object or empty string if valid.
 */
export const validateIsMobilePhone = (value, options = {}) => {
    const { customMessage, customValidator, errorCode, condition, logErrors, locale, validatorOptions } = { ...defaultOptions, ...options };
    if (condition && !condition(value)) {
        return '';
    }
    if (customValidator) {
        const customError = customValidator(value);
        if (customError) {
            if (logErrors) logError('isMobilePhone', customError);
            return customError;
        }
    }
    if (!validator.isMobilePhone(value, locale, validatorOptions)) {
        const error = { message: customMessage || `Invalid mobile phone number`, code: errorCode || 'INVALID_MOBILE_PHONE' };
        if (logErrors) logError('isMobilePhone', error);
        return error;
    }
    return '';
};

/**
 * Validates if the value contains only numeric characters.
 * @param {string} value - The value to validate.
 * @param {object} options - Additional options for validation.
 * @returns {object|string} - Error object or empty string if valid.
 */
export const validateIsNumeric = (value, options = {}) => {
    const { customMessage, customValidator, errorCode, condition, logErrors, validatorOptions } = { ...defaultOptions, ...options };
    if (condition && !condition(value)) {
        return '';
    }
    if (customValidator) {
        const customError = customValidator(value);
        if (customError) {
            if (logErrors) logError('isNumeric', customError);
            return customError;
        }
    }
    if (!validator.isNumeric(value, validatorOptions)) {
        const error = { message: customMessage || 'The value must contain only numeric characters', code: errorCode || 'NOT_NUMERIC' };
        if (logErrors) logError('isNumeric', error);
        return error;
    }
    return '';
};

/**
 * Validates if the value is a valid passport number for a specific country.
 * @param {string} value - The value to validate.
 * @param {string} countryCode - The country code to validate against.
 * @param {object} options - Additional options for validation.
 * @returns {object|string} - Error object or empty string if valid.
 */
export const validateIsPassportNumber = (value, countryCode, options = {}) => {
    const { customMessage, customValidator, errorCode, condition, logErrors, validatorOptions } = { ...defaultOptions, ...options };
    if (condition && !condition(value)) {
        return '';
    }
    if (customValidator) {
        const customError = customValidator(value);
        if (customError) {
            if (logErrors) logError('isPassportNumber', customError);
            return customError;
        }
    }
    if (!validator.isPassportNumber(value, countryCode, validatorOptions)) {
        const error = { message: customMessage || `Invalid passport number for country code "${countryCode}"`, code: errorCode || 'INVALID_PASSPORT_NUMBER' };
        if (logErrors) logError('isPassportNumber', error);
        return error;
    }
    return '';
};

/**
 * Validates if the value is a valid postal code for a specific locale.
 * @param {string} value - The value to validate.
 * @param {string} locale - The locale to validate against.
 * @param {object} options - Additional options for validation.
 * @returns {object|string} - Error object or empty string if valid.
 */
export const validateIsPostalCode = (value, locale, options = {}) => {
    const { customMessage, customValidator, errorCode, condition, logErrors } = { ...defaultOptions, ...options };
    if (condition && !condition(value)) {
        return '';
    }
    if (customValidator) {
        const customError = customValidator(value);
        if (customError) {
            if (logErrors) logError('isPostalCode', customError);
            return customError;
        }
    }
    if (!validator.isPostalCode(value, locale)) {
        const error = { message: customMessage || `Invalid postal code for locale "${locale}"`, code: errorCode || 'INVALID_POSTAL_CODE' };
        if (logErrors) logError('isPostalCode', error);
        return error;
    }
    return '';
};

/**
 * Validates if the value is in uppercase.
 * @param {string} value - The value to validate.
 * @param {object} options - Additional options for validation.
 * @returns {object|string} - Error object or empty string if valid.
 */
export const validateIsUppercase = (value, options = {}) => {
    const { customMessage, customValidator, errorCode, condition, logErrors } = { ...defaultOptions, ...options };
    if (condition && !condition(value)) {
        return '';
    }
    if (customValidator) {
        const customError = customValidator(value);
        if (customError) {
            if (logErrors) logError('isUppercase', customError);
            return customError;
        }
    }
    if (!validator.isUppercase(value)) {
        const error = { message: customMessage || 'The value must be in uppercase', code: errorCode || 'NOT_UPPERCASE' };
        if (logErrors) logError('isUppercase', error);
        return error;
    }
    return '';
};

/**
 * Validates if the value is a strong password.
 * @param {string} value - The value to validate.
 * @param {object} options - Additional options for validation.
 * @returns {object|string} - Error object or empty string if valid.
 */
export const validateIsStrongPassword = (value, options = {}) => {
    const { customMessage, customValidator, errorCode, condition, logErrors, validatorOptions } = { ...defaultOptions, ...options };
    if (condition && !condition(value)) {
        return '';
    }
    if (customValidator) {
        const customError = customValidator(value);
        if (customError) {
            if (logErrors) logError('isStrongPassword', customError);
            return customError;
        }
    }
    if (!validator.isStrongPassword(value, validatorOptions)) {
        const error = { message: customMessage || 'The password is not strong enough', code: errorCode || 'WEAK_PASSWORD' };
        if (logErrors) logError('isStrongPassword', error);
        return error;
    }
    return '';
};

/**
 * Validates if the value is a valid time string.
 * @param {string} value - The value to validate.
 * @param {object} options - Additional options for validation.
 * @returns {object|string} - Error object or empty string if valid.
 */
export const validateIsTime = (value, options = {}) => {
    const { customMessage, customValidator, errorCode, condition, logErrors, validatorOptions } = { ...defaultOptions, ...options };
    if (condition && !condition(value)) {
        return '';
    }
    if (customValidator) {
        const customError = customValidator(value);
        if (customError) {
            if (logErrors) logError('isTime', customError);
            return customError;
        }
    }
    if (!validator.isTime(value, validatorOptions)) {
        const error = { message: customMessage || 'Invalid time format', code: errorCode || 'INVALID_TIME' };
        if (logErrors) logError('isTime', error);
        return error;
    }
    return '';
};

/**
 * Validates if the value is a valid tax identification number for a specific locale.
 * @param {string} value - The value to validate.
 * @param {string} locale - The locale to validate against.
 * @param {object} options - Additional options for validation.
 * @returns {object|string} - Error object or empty string if valid.
 */
export const validateIsTaxID = (value, options = {}) => {
    const { customMessage, customValidator, errorCode, condition, logErrors, locale, validatorOptions } = { ...defaultOptions, ...options };
    if (condition && !condition(value)) {
        return '';
    }
    if (customValidator) {
        const customError = customValidator(value);
        if (customError) {
            if (logErrors) logError('isTaxID', customError);
            return customError;
        }
    }
    if (!validator.isTaxID(value, locale, validatorOptions)) {
        const error = { message: customMessage || `Invalid tax ID for locale "${locale}"`, code: errorCode || 'INVALID_TAX_ID' };
        if (logErrors) logError('isTaxID', error);
        return error;
    }
    return '';
};

/**
 * Validates if the value contains only whitelisted characters.
 * @param {string} value - The value to validate.
 * @param {string} chars - The characters to whitelist.
 * @param {object} options - Additional options for validation.
 * @returns {object|string} - Error object or empty string if valid.
 */
export const validateIsWhitelisted = (value, chars, options = {}) => {
    const { customMessage, customValidator, errorCode, condition, logErrors } = { ...defaultOptions, ...options };
    if (condition && !condition(value)) {
        return '';
    }
    if (customValidator) {
        const customError = customValidator(value);
        if (customError) {
            if (logErrors) logError('isWhitelisted', customError);
            return customError;
        }
    }
    if (!validator.isWhitelisted(value, chars)) {
        const error = { message: customMessage || `The value contains characters outside the whitelist: "${chars}"`, code: errorCode || 'NOT_WHITELISTED' };
        if (logErrors) logError('isWhitelisted', error);
        return error;
    }
    return '';
};

/**
 * Validates if the value matches the specified regular expression pattern.
 * @param {string} value - The value to validate.
 * @param {string|RegExp} pattern - The regular expression pattern to match against.
 * @param {string} [modifiers] - Optional modifiers for the regular expression.
 * @param {object} options - Additional options for validation.
 * @returns {object|string} - Error object or empty string if valid.
 */
export const validateMatches = (value, pattern, modifiers, options = {}) => {
    const { customMessage, customValidator, errorCode, condition, logErrors } = { ...defaultOptions, ...options };
    if (condition && !condition(value)) {
        return '';
    }
    if (customValidator) {
        const customError = customValidator(value);
        if (customError) {
            if (logErrors) logError('matches', customError);
            return customError;
        }
    }
    if (!validator.matches(value, pattern, modifiers)) {
        const error = { message: customMessage || 'The value does not match the required pattern', code: errorCode || 'PATTERN_MISMATCH' };
        if (logErrors) logError('matches', error);
        return error;
    }
    return '';
};