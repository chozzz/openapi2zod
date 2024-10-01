import { OpenAPIV3 } from 'openapi-types'
import { z } from 'zod'
import { openApiSchemaToZod } from '../src/openapi-schema-to-zod' // Adjust the import path accordingly

describe('openApiSchemaToZod - String Formats', () => {
  const schemas: Record<string, OpenAPIV3.SchemaObject> = {}

  test("should handle 'email' format", () => {
    const schema: OpenAPIV3.SchemaObject = { type: 'string', format: 'email' }
    const zodSchema = openApiSchemaToZod(schema, schemas)

    expect(() => zodSchema.parse('test@example.com')).not.toThrow()
    expect(() => zodSchema.parse('invalid-email')).toThrow()
  })

  test("should handle 'uuid' format", () => {
    const schema: OpenAPIV3.SchemaObject = { type: 'string', format: 'uuid' }
    const zodSchema = openApiSchemaToZod(schema, schemas)

    expect(() => zodSchema.parse('123e4567-e89b-12d3-a456-426614174000')).not.toThrow()
    expect(() => zodSchema.parse('invalid-uuid')).toThrow()
  })

  test("should handle 'date-time' format", () => {
    const schema: OpenAPIV3.SchemaObject = { type: 'string', format: 'date-time' }
    const zodSchema = openApiSchemaToZod(schema, schemas)

    expect(() => zodSchema.parse('2023-09-15T13:45:30Z')).not.toThrow()
    expect(() => zodSchema.parse('2023-09-15')).toThrow()
  })

  test("should handle 'date' format", () => {
    const schema: OpenAPIV3.SchemaObject = { type: 'string', format: 'date' }
    const zodSchema = openApiSchemaToZod(schema, schemas)

    expect(() => zodSchema.parse('2023-09-15')).not.toThrow()
    expect(() => zodSchema.parse('15-09-2023')).toThrow()
  })

  test("should handle 'time' format", () => {
    const schema: OpenAPIV3.SchemaObject = { type: 'string', format: 'time' }
    const zodSchema = openApiSchemaToZod(schema, schemas)

    expect(() => zodSchema.parse('13:45:30')).not.toThrow()
    expect(() => zodSchema.parse('25:00:00')).toThrow()
  })

  test("should handle 'ipv4' format", () => {
    const schema: OpenAPIV3.SchemaObject = { type: 'string', format: 'ipv4' }
    const zodSchema = openApiSchemaToZod(schema, schemas)

    expect(() => zodSchema.parse('192.168.1.1')).not.toThrow()
    expect(() => zodSchema.parse('999.999.999.999')).toThrow()
  })

  test("should handle 'ipv6' format", () => {
    const schema: OpenAPIV3.SchemaObject = { type: 'string', format: 'ipv6' }
    const zodSchema = openApiSchemaToZod(schema, schemas)

    expect(() => zodSchema.parse('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).not.toThrow()
    expect(() => zodSchema.parse('invalid-ipv6')).toThrow()
  })

  test("should handle 'uri' format", () => {
    const schema: OpenAPIV3.SchemaObject = { type: 'string', format: 'uri' }
    const zodSchema = openApiSchemaToZod(schema, schemas)

    expect(() => zodSchema.parse('https://example.com')).not.toThrow()
    expect(() => zodSchema.parse('not-a-uri')).toThrow()
  })

  test("should handle 'hostname' format", () => {
    const schema: OpenAPIV3.SchemaObject = { type: 'string', format: 'hostname' }
    const zodSchema = openApiSchemaToZod(schema, schemas)

    expect(() => zodSchema.parse('example.com')).not.toThrow()
    expect(() => zodSchema.parse('-invalid-hostname')).toThrow()
  })

  test("should handle 'byte' format", () => {
    const schema: OpenAPIV3.SchemaObject = { type: 'string', format: 'byte' }
    const zodSchema = openApiSchemaToZod(schema, schemas)

    const validBase64 = Buffer.from('Hello World').toString('base64')
    expect(() => zodSchema.parse(validBase64)).not.toThrow()
    expect(() => zodSchema.parse('InvalidBase64!@#')).toThrow()
  })

  test("should handle 'password' format", () => {
    const schema: OpenAPIV3.SchemaObject = { type: 'string', format: 'password' }
    const zodSchema = openApiSchemaToZod(schema, schemas)

    expect(() => zodSchema.parse('securePass123')).not.toThrow()
    expect(() => zodSchema.parse('short')).toThrow()
  })

  test("should handle 'binary' format", () => {
    const schema: OpenAPIV3.SchemaObject = { type: 'string', format: 'binary' }
    const zodSchema = openApiSchemaToZod(schema, schemas)

    // Since we used z.instanceof(Buffer), we'll test with a Buffer instance
    expect(() => zodSchema.parse(Buffer.from('binary data'))).not.toThrow()
    expect(() => zodSchema.parse('not a buffer')).toThrow()
  })

  test('should handle unknown format gracefully', () => {
    const schema: OpenAPIV3.SchemaObject = { type: 'string', format: 'unknown-format' }
    const zodSchema = openApiSchemaToZod(schema, schemas)

    expect(zodSchema).toBeInstanceOf(z.ZodString)
    expect(() => zodSchema.parse('any string')).not.toThrow()
  })

  test('should resolve $ref correctly', () => {
    schemas['TestSchema'] = { type: 'string', format: 'email' }
    const schema: OpenAPIV3.ReferenceObject = { $ref: '#/components/schemas/TestSchema' } // Use ReferenceObject here
    const zodSchema = openApiSchemaToZod(schema, schemas)
    expect(() => zodSchema.parse('test@example.com')).not.toThrow()
    expect(() => zodSchema.parse('invalid-email')).toThrow()
  })

  test('should handle $ref with missing schema', () => {
    const schema: OpenAPIV3.ReferenceObject = { $ref: '#/components/schemas/NonExistent' } // Use ReferenceObject here
    const zodSchema = openApiSchemaToZod(schema, schemas)
    expect(zodSchema).toBeInstanceOf(z.ZodAny)
  })

  test('should handle oneOf with single and multiple items', () => {
    const singleOneOfSchema: OpenAPIV3.SchemaObject = { oneOf: [{ type: 'string' }] }
    const multiOneOfSchema: OpenAPIV3.SchemaObject = {
      oneOf: [{ type: 'string' }, { type: 'number' }],
    }

    const singleZodSchema = openApiSchemaToZod(singleOneOfSchema, schemas)
    const multiZodSchema = openApiSchemaToZod(multiOneOfSchema, schemas)

    expect(singleZodSchema).toBeInstanceOf(z.ZodString)
    expect(multiZodSchema).toBeInstanceOf(z.ZodUnion)
    expect(() => multiZodSchema.parse(42)).not.toThrow()
    expect(() => multiZodSchema.parse('valid string')).not.toThrow()
  })

  test('should handle anyOf with empty array', () => {
    const schema: OpenAPIV3.SchemaObject = { anyOf: [] }
    const zodSchema = openApiSchemaToZod(schema, schemas)
    expect(zodSchema).toBeInstanceOf(z.ZodAny)
  })

  test('should handle allOf with mixed types and enforce required properties', () => {
    const schema: OpenAPIV3.SchemaObject = {
      allOf: [
        { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] },
        { type: 'object', properties: { age: { type: 'number' } }, required: ['age'] },
      ],
    }

    const zodSchema = openApiSchemaToZod(schema, schemas)

    // Valid input should not throw
    expect(() => zodSchema.parse({ name: 'John', age: 30 })).not.toThrow()

    // Missing `age` should throw an error
    expect(() => zodSchema.parse({ name: 'John' })).toThrow()

    // Missing `name` should throw an error
    expect(() => zodSchema.parse({ age: 30 })).toThrow()
  })

  test('should handle not property in schema', () => {
    const schema: OpenAPIV3.SchemaObject = { not: { type: 'string' } }
    const zodSchema = openApiSchemaToZod(schema, schemas)
    expect(() => zodSchema.parse(123)).not.toThrow()
    expect(() => zodSchema.parse('This should fail')).toThrow()
  })

  test('should handle not with specific format', () => {
    const schema: OpenAPIV3.SchemaObject = { not: { type: 'string', format: 'email' } }
    const zodSchema = openApiSchemaToZod(schema, schemas)
    expect(() => zodSchema.parse('not-an-email')).not.toThrow()
    expect(() => zodSchema.parse('email@example.com')).toThrow()
  })

  test('should attach descriptions to schema', () => {
    const schema: OpenAPIV3.SchemaObject = { type: 'string', description: 'A simple string type' }
    const zodSchema = openApiSchemaToZod(schema, schemas)
    expect(zodSchema.description).toBe('A simple string type')
  })

  test('should handle additionalProperties with schema and boolean', () => {
    const schemaWithProps: OpenAPIV3.SchemaObject = {
      type: 'object',
      properties: { name: { type: 'string' } },
      additionalProperties: { type: 'number' },
    }
    const schemaWithBool: OpenAPIV3.SchemaObject = { type: 'object', additionalProperties: true }

    const zodSchemaWithProps = openApiSchemaToZod(schemaWithProps, schemas)
    const zodSchemaWithBool = openApiSchemaToZod(schemaWithBool, schemas)

    expect(() => zodSchemaWithProps.parse({ name: 'John', extra: 123 })).not.toThrow()
    expect(() => zodSchemaWithProps.parse({ name: 'John', extra: 'Invalid' })).toThrow()
    expect(() => zodSchemaWithBool.parse({ name: 'John', extra: 'anything goes' })).not.toThrow()
  })

  test('should handle nested and complex object properties with required fields', () => {
    const schema: OpenAPIV3.SchemaObject = {
      type: 'object',
      properties: {
        profile: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            address: {
              type: 'object',
              properties: {
                street: { type: 'string' },
                city: { type: 'string' },
              },
              required: ['street', 'city'], // Make 'street' and 'city' required in address
            },
          },
          required: ['name', 'address'], // Make 'name' and 'address' required in profile
        },
      },
      required: ['profile'], // Make 'profile' required in the root schema
    }

    const zodSchema = openApiSchemaToZod(schema, schemas)

    // Valid input should not throw
    expect(() =>
      zodSchema.parse({ profile: { name: 'John', address: { street: 'Main St', city: 'NYC' } } }),
    ).not.toThrow()

    // Missing `city` in `address` should throw an error
    expect(() =>
      zodSchema.parse({ profile: { name: 'John', address: { street: 'Main St' } } }),
    ).toThrow()

    // Missing `address` in `profile` should throw an error
    expect(() => zodSchema.parse({ profile: { name: 'John' } })).toThrow()

    // Missing `profile` entirely should throw an error
    expect(() => zodSchema.parse({})).toThrow() // This is now enforced
  })
})
