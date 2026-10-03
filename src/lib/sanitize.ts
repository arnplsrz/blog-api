import sanitizeHtml from 'sanitize-html'

export const sanitizeContent = (html: string) =>
  sanitizeHtml(html, {
    allowedTags: [
      'p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3',
      'ol', 'ul', 'li', 'blockquote', 'pre', 'code', 'a', 'img', 'span',
    ],
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
      img: ['src', 'alt'],
      '*': ['class'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
  })

export const textLength = (html: string) =>
  sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} }).trim().length
