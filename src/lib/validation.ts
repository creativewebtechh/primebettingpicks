const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const MAX_NAME_LENGTH = 100
const MAX_EMAIL_LENGTH = 254
const MIN_PASSWORD_LENGTH = 8
const MAX_PASSWORD_LENGTH = 128

export interface ValidationError {
  field: string
  message: string
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
}

export function validateRegistrationInput(data: {
  name?: string
  email?: string
  password?: string
}): ValidationResult {
  const errors: ValidationError[] = []

  if (!data.name || data.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Name is required' })
  } else if (data.name.trim().length > MAX_NAME_LENGTH) {
    errors.push({ field: 'name', message: `Name must be ${MAX_NAME_LENGTH} characters or less` })
  }

  if (!data.email || data.email.trim().length === 0) {
    errors.push({ field: 'email', message: 'Email is required' })
  } else if (!EMAIL_REGEX.test(data.email.trim())) {
    errors.push({ field: 'email', message: 'Please provide a valid email address' })
  } else if (data.email.trim().length > MAX_EMAIL_LENGTH) {
    errors.push({ field: 'email', message: `Email must be ${MAX_EMAIL_LENGTH} characters or less` })
  }

  if (!data.password) {
    errors.push({ field: 'password', message: 'Password is required' })
  } else if (data.password.length < MIN_PASSWORD_LENGTH) {
    errors.push({ field: 'password', message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` })
  } else if (data.password.length > MAX_PASSWORD_LENGTH) {
    errors.push({ field: 'password', message: `Password must be ${MAX_PASSWORD_LENGTH} characters or less` })
  }

  return { valid: errors.length === 0, errors }
}

export function sanitizeString(input: string): string {
  return input.trim().replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
}
