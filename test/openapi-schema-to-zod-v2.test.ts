import { OpenAPIV3 } from 'openapi-types'
import { z } from 'zod'
import { openApiSchemaToZod } from '../src/openapi-schema-to-zod' // Adjust the import path accordingly
import zodToJsonSchema from 'zod-to-json-schema';

describe("openApiSchemaToZod - Additional Coverage Tests", () => {
  // Mock schemas for testing
  const schemas: Record<string, OpenAPIV3.SchemaObject> = {};

  // Test for handling $ref with undefined or empty referenced schema
  test("should handle $ref with undefined or empty schema", () => {
    const schemaWithUndefinedRef: OpenAPIV3.ReferenceObject = { $ref: '#/components/schemas/UndefinedSchema' };
    const schemaWithEmptyRef: OpenAPIV3.ReferenceObject = { $ref: '' };
    
    const zodSchemaUndefined = openApiSchemaToZod(schemaWithUndefinedRef, schemas);
    const zodSchemaEmpty = openApiSchemaToZod(schemaWithEmptyRef, schemas);
    
    expect(zodSchemaUndefined).toBeInstanceOf(z.ZodAny);
    expect(zodSchemaEmpty).toBeInstanceOf(z.ZodAny);
  });

  // Test oneOf handling with empty or single item
  test("should handle oneOf with empty or single item", () => {
    const emptyOneOfSchema: OpenAPIV3.SchemaObject = { oneOf: [] };
    const singleOneOfSchema: OpenAPIV3.SchemaObject = { oneOf: [{ type: 'string' }] };
    
    const zodSchemaEmpty = openApiSchemaToZod(emptyOneOfSchema, schemas);
    const zodSchemaSingle = openApiSchemaToZod(singleOneOfSchema, schemas);
    
    expect(zodSchemaEmpty).toBeInstanceOf(z.ZodAny);
    expect(zodSchemaSingle).toBeInstanceOf(z.ZodString);
  });

  // Test anyOf handling with mixed types
  test("should handle anyOf with mixed types", () => {
    const anyOfSchema: OpenAPIV3.SchemaObject = { anyOf: [{ type: 'string' }, { type: 'number' }] };
    const zodSchema = openApiSchemaToZod(anyOfSchema, schemas);
    
    expect(() => zodSchema.parse("string")).not.toThrow();
    expect(() => zodSchema.parse(123)).not.toThrow();
    expect(() => zodSchema.parse(true)).toThrow();
  });

  // Test allOf handling with empty array
  test("should handle allOf with empty array", () => {
    const emptyAllOfSchema: OpenAPIV3.SchemaObject = { allOf: [] };
    const zodSchema = openApiSchemaToZod(emptyAllOfSchema, schemas);
    
    expect(zodSchema).toBeInstanceOf(z.ZodAny);
  });

  // Test not property with enum
  test("should handle not property with enum", () => {
    const schema: OpenAPIV3.SchemaObject = { 
      not: { type: 'string', enum: ['A', 'B', 'C'] } 
    };
    const zodSchema = openApiSchemaToZod(schema, schemas);
    
    expect(() => zodSchema.parse('D')).not.toThrow(); // Valid, since it's not in the enum
    expect(() => zodSchema.parse('A')).toThrow(); // Invalid, since it's in the enum
  });

  // Test handling of additional string formats
  test("should handle additional string formats", () => {
    const formats = [
      { format: 'uri-reference', valid: 'example/path', invalid: '://example.com' },
      { format: 'ipv4', valid: '192.168.1.1', invalid: '999.999.999.999' },
      { format: 'ipv6', valid: '2001:0db8:85a3:0000:0000:8a2e:0370:7334', invalid: 'invalid-ipv6' },
      { format: 'binary', valid: Buffer.from('binary data'), invalid: 'not a buffer' },
      { format: 'password', valid: 'securePass123', invalid: 'short' },
    ];
  
    formats.forEach(({ format, valid, invalid }) => {
      const schema: OpenAPIV3.SchemaObject = { type: 'string', format };
      let zodSchema = openApiSchemaToZod(schema, schemas);
  
      // Ensure the valid case passes
      expect(() => zodSchema.parse(valid)).not.toThrow();
  
      // Ensure the invalid case throws
      expect(() => zodSchema.parse(invalid)).toThrow();
    });
  });

  // Test handling of additional properties with different combinations
  test("should handle complex nested properties and additionalProperties", () => {
    const schema: OpenAPIV3.SchemaObject = {
      type: 'object',
      properties: {
        profile: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            age: { type: 'number' },
          },
        },
      },
      additionalProperties: { type: 'string' },
    };
    const zodSchema = openApiSchemaToZod(schema, schemas);
    
    // Valid cases
    expect(() => zodSchema.parse({ profile: { name: 'John', age: 30 }, extraField: 'extraValue' })).not.toThrow();
    
    // Invalid case: additionalProperties should be string
    expect(() => zodSchema.parse({ profile: { name: 'John', age: 30 }, extraField: 42 })).toThrow();
  });

  // Test handling of inconsistent properties and required fields
  test("should handle inconsistent properties and required fields", () => {
    const schema: OpenAPIV3.SchemaObject = {
      type: 'object',
      properties: {
        id: { type: 'string' },
        description: { type: 'string' },
      },
      required: ['id'], // 'description' is not required
    };
    const zodSchema = openApiSchemaToZod(schema, schemas);

    expect(() => zodSchema.parse({ id: '123' })).not.toThrow(); // Missing 'description' is valid
    expect(() => zodSchema.parse({})).toThrow(); // Missing 'id' should throw
  });

  // Test handling of defaults in nested properties
  test('should apply default values to nested properties', () => {
    const schema: OpenAPIV3.SchemaObject = {
      type: 'object',
      properties: {
        name: { type: 'string', default: 'Default Name' },
        details: {
          type: 'object',
          properties: {
            age: { type: 'number', default: 25 },
          },
        },
      },
    };
  
    // Use openApiSchemaToZod to create the initial schema
    let zodSchema = openApiSchemaToZod(schema, schemas);
    
    // Generate JSON schema from Zod schema
    const jsonSchema = zodToJsonSchema(zodSchema)

    // Use snapshot testing
    expect(jsonSchema).toMatchSnapshot()
  
    // Parse an empty object to check if defaults are applied
    const parsed = zodSchema.parse({});
  
    // Validate the structure of the parsed output
    // expect(parsed).toHaveProperty('details'); // Check if 'details' is created
    expect(parsed.name).toBe('Default Name'); // Check default name
    expect(parsed.details.age).toEqual(25); // Check nested defaults
  });
});

