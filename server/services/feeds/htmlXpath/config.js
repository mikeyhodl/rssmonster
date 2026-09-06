export const HTML_XPATH_CONFIG_FIELDS = Object.freeze([
  'feedTitle',
  'item',
  'itemTitle',
  'itemContent',
  'itemUri',
  'itemAuthor',
  'itemTimestamp',
  'itemThumbnail',
  'itemUid'
]);

export const HTML_XPATH_LIMITS = Object.freeze({
  expressionCharacters: 2048,
  serializedConfigBytes: 12 * 1024,
  aggregateOutputBytes: 10 * 1024 * 1024,
  previewItems: 5,
  previewContentCharacters: 4000
});

// Creates a stable error that can cross the parser-worker boundary.
export const htmlXpathError = (code, message, field = null) => {
  const error = new Error(message);
  error.name = 'HtmlXpathError';
  error.code = code;
  if (field) error.field = field;
  return error;
};

// Validates and normalizes the allowlisted HTML/XPath source configuration.
export const normalizeHtmlXpathConfig = input => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw htmlXpathError(
      'HTML_XPATH_INVALID_CONFIG',
      'HTML/XPath configuration must be an object'
    );
  }

  const unknownField = Object.keys(input)
    .find(field => !HTML_XPATH_CONFIG_FIELDS.includes(field));
  if (unknownField) {
    throw htmlXpathError(
      'HTML_XPATH_INVALID_CONFIG',
      `Unsupported HTML/XPath field: ${unknownField}`,
      unknownField
    );
  }

  const config = {};
  for (const field of HTML_XPATH_CONFIG_FIELDS) {
    if (input[field] === undefined || input[field] === null) continue;
    if (typeof input[field] !== 'string') {
      throw htmlXpathError(
        'HTML_XPATH_INVALID_CONFIG',
        `${field} must be a string`,
        field
      );
    }
    const expression = input[field].trim();
    if (!expression) continue;
    if (expression.length > HTML_XPATH_LIMITS.expressionCharacters) {
      throw htmlXpathError(
        'HTML_XPATH_INVALID_CONFIG',
        `${field} exceeds ${HTML_XPATH_LIMITS.expressionCharacters} characters`,
        field
      );
    }
    if (field.startsWith('item') && field !== 'item' && /^\s*\//.test(expression)) {
      throw htmlXpathError(
        'HTML_XPATH_INVALID_CONFIG',
        `${field} must be relative to each matched item`,
        field
      );
    }
    config[field] = expression;
  }

  config.feedTitle ||= '//title';
  if (!config.item) {
    throw htmlXpathError(
      'HTML_XPATH_INVALID_CONFIG',
      'Item XPath is required',
      'item'
    );
  }
  if (!config.itemTitle && !config.itemContent && !config.itemUri) {
    throw htmlXpathError(
      'HTML_XPATH_INVALID_CONFIG',
      'At least one title, content, or URI XPath is required'
    );
  }
  if (Buffer.byteLength(JSON.stringify(config), 'utf8') > HTML_XPATH_LIMITS.serializedConfigBytes) {
    throw htmlXpathError(
      'HTML_XPATH_INVALID_CONFIG',
      `HTML/XPath configuration exceeds ${HTML_XPATH_LIMITS.serializedConfigBytes} bytes`
    );
  }

  return Object.freeze(config);
};

export default { normalizeHtmlXpathConfig };
