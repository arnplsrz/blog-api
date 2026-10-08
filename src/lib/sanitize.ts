import sanitizeHtml from 'sanitize-html'

export const sanitizeContent = (html: string) =>
  sanitizeHtml(html, {
    allowedTags: [
      'p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3',
      'ol', 'ul', 'li', 'blockquote', 'pre', 'code', 'a', 'span',
    ],
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
      '*': ['class'],
    },
    allowedClasses: { '*': [/^ql-/] },
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer', target: '_blank' }),
    },
    allowedSchemes: ['http', 'https', 'mailto'],
  })

export const textLength = (html: string) =>
  sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} }).trim().length
