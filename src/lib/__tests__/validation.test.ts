import { validateRegistrationInput, sanitizeString } from '../validation'

describe('validateRegistrationInput', () => {
  const validInput = {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'securePass1',
  }

  it('accepts valid input', () => {
    const result = validateRegistrationInput(validInput)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('rejects missing name', () => {
    const result = validateRegistrationInput({ ...validInput, name: '' })
    expect(result.valid).toBe(false)
    expect(result.errors[0].field).toBe('name')
  })

  it('rejects whitespace-only name', () => {
    const result = validateRegistrationInput({ ...validInput, name: '   ' })
    expect(result.valid).toBe(false)
    expect(result.errors[0].field).toBe('name')
  })

  it('rejects name exceeding max length', () => {
    const result = validateRegistrationInput({
      ...validInput,
      name: 'A'.repeat(101),
    })
    expect(result.valid).toBe(false)
    expect(result.errors[0].field).toBe('name')
  })

  it('rejects missing email', () => {
    const result = validateRegistrationInput({ ...validInput, email: '' })
    expect(result.valid).toBe(false)
    expect(result.errors[0].field).toBe('email')
  })

  it('rejects invalid email format', () => {
    const result = validateRegistrationInput({
      ...validInput,
      email: 'not-an-email',
    })
    expect(result.valid).toBe(false)
    expect(result.errors[0].field).toBe('email')
  })

  it('rejects email without domain', () => {
    const result = validateRegistrationInput({
      ...validInput,
      email: 'user@',
    })
    expect(result.valid).toBe(false)
    expect(result.errors[0].field).toBe('email')
  })

  it('rejects email exceeding max length', () => {
    const result = validateRegistrationInput({
      ...validInput,
      email: `${'a'.repeat(260)}@example.com`,
    })
    expect(result.valid).toBe(false)
    expect(result.errors[0].field).toBe('email')
  })

  it('rejects missing password', () => {
    const result = validateRegistrationInput({ ...validInput, password: '' })
    expect(result.valid).toBe(false)
    expect(result.errors[0].field).toBe('password')
  })

  it('rejects password shorter than 8 characters', () => {
    const result = validateRegistrationInput({
      ...validInput,
      password: 'short',
    })
    expect(result.valid).toBe(false)
    expect(result.errors[0].field).toBe('password')
  })

  it('rejects password exceeding max length', () => {
    const result = validateRegistrationInput({
      ...validInput,
      password: 'A'.repeat(129),
    })
    expect(result.valid).toBe(false)
    expect(result.errors[0].field).toBe('password')
  })

  it('accepts password at exactly 8 characters', () => {
    const result = validateRegistrationInput({
      ...validInput,
      password: '12345678',
    })
    expect(result.valid).toBe(true)
  })

  it('returns multiple errors for multiple invalid fields', () => {
    const result = validateRegistrationInput({
      name: '',
      email: 'bad',
      password: '123',
    })
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThanOrEqual(2)
  })

  it('returns single clear message for one error', () => {
    const result = validateRegistrationInput({
      ...validInput,
      email: 'invalid',
    })
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].message).toBeTruthy()
  })
})

describe('sanitizeString', () => {
  it('trims whitespace', () => {
    expect(sanitizeString('  hello  ')).toBe('hello')
  })

  it('removes null bytes', () => {
    expect(sanitizeString('hello\x00world')).toBe('helloworld')
  })

  it('removes other control characters', () => {
    expect(sanitizeString('hello\x08\x0Bworld')).toBe('helloworld')
  })

  it('preserves normal characters', () => {
    expect(sanitizeString('John Doe john@example.com')).toBe(
      'John Doe john@example.com'
    )
  })

  it('handles empty string', () => {
    expect(sanitizeString('')).toBe('')
  })
})
