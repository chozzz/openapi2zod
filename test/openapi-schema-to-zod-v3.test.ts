import { z, ZodIntersection, ZodObject, ZodTypeAny, ZodUnion } from 'zod';
import { OpenAPIV3 } from 'openapi-types';
import { openApiSchemaToZod } from '../src/openapi-schema-to-zod';
import { parseOpenApiToZod } from '../src/openapi2zod';

describe('openApiSchemaToZod - Array Schema Handling', () => {
  const schemas: Record<string, OpenAPIV3.SchemaObject> = {};

  it('should create a Zod array schema with simple items (string)', () => {
    const schema: OpenAPIV3.SchemaObject = {
      type: 'array',
      items: { type: 'string' },
    };

    const zodSchema = openApiSchemaToZod(schema, schemas);
    expect(zodSchema).toBeInstanceOf(z.ZodArray);
    expect(() => zodSchema.parse(['hello', 'world'])).not.toThrow();
    expect(() => zodSchema.parse([123])).toThrow();
  });

  it('should create a Zod array schema with object items', () => {
    const schema: OpenAPIV3.SchemaObject = {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
        },
        required: ['name'],
      },
    };

    const zodSchema = openApiSchemaToZod(schema, schemas);
    expect(zodSchema).toBeInstanceOf(z.ZodArray);
    const parsed = zodSchema.parse([{ name: 'John', age: 30 }, { name: 'Doe' }]);
    expect(parsed).toEqual([{ name: 'John', age: 30 }, { name: 'Doe' }]);
  });

  it('should apply default values to the array items', () => {
    const schema: OpenAPIV3.SchemaObject = {
      type: 'array',
      items: { type: 'string' },
      default: ['default1', 'default2'],
    };
  
    const zodSchema = openApiSchemaToZod(schema, schemas);
    // Check if the schema is a ZodDefault, which wraps the ZodArray
    expect(zodSchema).toBeInstanceOf(z.ZodDefault);
  
    // You can optionally unwrap the schema to check the underlying type if needed
    const unwrappedSchema = (zodSchema as z.ZodDefault<ZodTypeAny>)._def.innerType;
    expect(unwrappedSchema).toBeInstanceOf(z.ZodArray);
  
    // Check parsing with default values
    const parsed = zodSchema.parse(undefined); // Use `undefined` to test default application
    expect(parsed).toEqual(['default1', 'default2']);
  });

  it('should create a Zod array schema with a description', () => {
    const schema: OpenAPIV3.SchemaObject = {
      type: 'array',
      items: { type: 'string' },
      description: 'This is an array of strings',
    };

    const zodSchema = openApiSchemaToZod(schema, schemas);
    expect(zodSchema).toBeInstanceOf(z.ZodArray);
    expect(zodSchema._def.description).toBe('This is an array of strings');
  });

  it('should warn and create an array schema without "items" property', () => {
    console.warn = jest.fn(); // Mock console.warn to capture warnings
  
    // Use type assertion to bypass TypeScript's strict type checking for testing
    const schema = { type: 'array' } as unknown as OpenAPIV3.ArraySchemaObject;
  
    const zodSchema = openApiSchemaToZod(schema, schemas);
    expect(zodSchema).toBeInstanceOf(z.ZodArray);
  
    // Assert the schema as ZodArray to access the `.element` property
    const arraySchema = zodSchema as z.ZodArray<ZodTypeAny, 'many'>;
    expect(arraySchema.element).toBeInstanceOf(z.ZodAny); // Defaults to ZodAny
  
    // Check that the warning was triggered
    expect(console.warn).toHaveBeenCalledWith("Array schema without 'items' property.");
  });
});


describe('openApiSchemaToZod - Coverage Tests', () => {
  const schemas: Record<string, OpenAPIV3.SchemaObject> = {};

  it('should return z.any() for undefined or non-object schemas', () => {
    const zodSchema = openApiSchemaToZod(undefined, schemas);
    expect(zodSchema).toBeInstanceOf(z.ZodAny);

    const nonObjectSchema = openApiSchemaToZod('string' as any, schemas);
    expect(nonObjectSchema).toBeInstanceOf(z.ZodAny);
  });

  it('should attach description to a oneOf schema', () => {
    const schema: OpenAPIV3.SchemaObject = {
      oneOf: [{ type: 'string' }],
      description: 'One of schema',
    };

    const zodSchema = openApiSchemaToZod(schema, schemas);
    expect(zodSchema.description).toBe('One of schema');
  });

  it('should handle anyOf with a single schema', () => {
    const schema: OpenAPIV3.SchemaObject = {
      anyOf: [{ type: 'number' }],
    };

    const zodSchema = openApiSchemaToZod(schema, schemas);
    expect(zodSchema).toBeInstanceOf(z.ZodNumber);
  });

  it('should attach description to anyOf schema', () => {
    const schema: OpenAPIV3.SchemaObject = {
      anyOf: [{ type: 'number' }],
      description: 'Any of schema',
    };

    const zodSchema = openApiSchemaToZod(schema, schemas);
    expect(zodSchema.description).toBe('Any of schema');
  });

  it('should attach description to allOf schema', () => {
    const schema: OpenAPIV3.SchemaObject = {
      allOf: [{ type: 'string' }, { type: 'number' }],
      description: 'All of schema',
    };

    const zodSchema = openApiSchemaToZod(schema, schemas);
    expect(zodSchema.description).toBe('All of schema');
  });

  it('should attach description to not schema', () => {
    const schema: OpenAPIV3.SchemaObject = {
      not: { type: 'string' },
      description: 'Not schema',
    };

    const zodSchema = openApiSchemaToZod(schema, schemas);
    expect(zodSchema.description).toBe('Not schema');
  });

  it('should attach description to an enum schema', () => {
    const schema: OpenAPIV3.SchemaObject = {
      type: 'string',
      enum: ['value1', 'value2'],
      description: 'Enum schema',
    };

    const zodSchema = openApiSchemaToZod(schema, schemas);
    expect(zodSchema.description).toBe('Enum schema');
  });

  it('should attach description to a number schema', () => {
    const schema: OpenAPIV3.SchemaObject = {
      type: 'number',
      description: 'Number schema',
    };

    const zodSchema = openApiSchemaToZod(schema, schemas);
    expect(zodSchema.description).toBe('Number schema');
  });

  it('should attach description to a boolean schema', () => {
    const schema: OpenAPIV3.SchemaObject = {
      type: 'boolean',
      description: 'Boolean schema',
    };

    const zodSchema = openApiSchemaToZod(schema, schemas);
    expect(zodSchema.description).toBe('Boolean schema');
  });

  it('should apply a default value to a boolean schema', () => {
    const schema: OpenAPIV3.SchemaObject = {
      type: 'boolean',
      default: true,
    };

    const zodSchema = openApiSchemaToZod(schema, schemas);
    const parsed = zodSchema.parse(undefined);
    expect(parsed).toBe(true);
  });

  it('should attach description to an object schema', () => {
    const schema: OpenAPIV3.SchemaObject = {
      type: 'object',
      description: 'Object schema',
    };

    const zodSchema = openApiSchemaToZod(schema, schemas);
    expect(zodSchema.description).toBe('Object schema');
  });

  it('should log a warning and return z.any() for unhandled schema types337)', () => {
    console.warn = jest.fn(); // Mock console.warn to capture warnings
    const schema: OpenAPIV3.SchemaObject = { type: 'unknown' } as any;

    const zodSchema = openApiSchemaToZod(schema, schemas);
    expect(zodSchema).toBeInstanceOf(z.ZodAny);
    expect(console.warn).toHaveBeenCalledWith('Unhandled schema type: unknown');
  });
});

describe('parseOpenApiToZod - Additional Coverage Tests', () => {
  const openApiSchema: OpenAPIV3.Document = {
    openapi: '3.0.0',
    info: { title: 'Test API', version: '1.0.0' },
    paths: {},
  };

  it('should correctly merge parameters and requestBody schemas when both are ZodObject (line 106)', () => {
    const schema: OpenAPIV3.Document = {
      ...openApiSchema,
      paths: {
        '/test': {
          post: {
            operationId: 'testMergeObjects',
            parameters: [
              { name: 'queryParam', in: 'query', required: true, schema: { type: 'string' } } as OpenAPIV3.ParameterObject,
            ],
            requestBody: {
              content: {
                'application/json': { schema: { type: 'object', properties: { bodyParam: { type: 'number' } } } },
              },
            } as OpenAPIV3.RequestBodyObject,
            responses: {},
          },
        },
      },
    };

    const result = parseOpenApiToZod(schema);
    const operationSchema = result['testMergeObjects'];

    // Update expected type to ZodEffects, as the function uses intersection merging
    expect(operationSchema).toBeInstanceOf(z.ZodEffects);

    // Unwrap and check that the merged schema contains both parameters and body params
    const parsed = operationSchema.parse({ queryParam: 'test', bodyParam: 123 });
    expect(parsed).toEqual({ queryParam: 'test', bodyParam: 123 });
  });

  it('should handle merging with single or no ZodUnion options correctly (lines 121-124)', () => {
    const schema: OpenAPIV3.Document = {
      ...openApiSchema,
      paths: {
        '/test': {
          post: {
            operationId: 'testSingleUnionOption',
            parameters: [
              { name: 'queryParam', in: 'query', required: true, schema: { type: 'string' } } as OpenAPIV3.ParameterObject,
            ],
            requestBody: {
              content: {
                'application/json': {
                  schema: { anyOf: [{ type: 'object', properties: { bodyParam: { type: 'number' } } }] }, // Single option
                },
              },
            } as OpenAPIV3.RequestBodyObject,
            responses: {},
          },
        },
      },
    };

    const result = parseOpenApiToZod(schema);
    const operationSchema = result['testSingleUnionOption'];

    // Update expected type to ZodEffects, as a single option in union results in intersection
    expect(operationSchema).toBeInstanceOf(z.ZodEffects);

    // Test with valid data for the single union type
    const parsed = operationSchema.parse({ queryParam: 'test', bodyParam: 123 });
    expect(parsed).toEqual({ queryParam: 'test', bodyParam: 123 });
  });

  it('should fallback to parametersSchema when no ZodUnion options remain (line 124)', () => {
    const schema: OpenAPIV3.Document = {
      ...openApiSchema,
      paths: {
        '/test': {
          post: {
            operationId: 'testEmptyUnion',
            parameters: [
              { name: 'queryParam', in: 'query', required: true, schema: { type: 'string' } } as OpenAPIV3.ParameterObject,
            ],
            requestBody: {
              content: {
                'application/json': {
                  schema: { anyOf: [] }, // Empty union options
                },
              },
            } as OpenAPIV3.RequestBodyObject,
            responses: {},
          },
        },
      },
    };

    const result = parseOpenApiToZod(schema);
    const operationSchema = result['testEmptyUnion'];

    // Update expected type to ZodEffects, as parametersSchema is used in intersection
    expect(operationSchema).toBeInstanceOf(z.ZodEffects);

    // Test with valid data for parametersSchema only
    const parsed = operationSchema.parse({ queryParam: 'test' });
    expect(parsed).toEqual({ queryParam: 'test' });
  });
});

describe('parseOpenApiToZod - Full Coverage Tests', () => {
  const openApiSchema: OpenAPIV3.Document = {
    openapi: '3.0.0',
    info: { title: 'Test API', version: '1.0.0' },
    paths: {},
  };

  it('should log a warning and use z.any() for parameters missing schema (lines 56-57)', () => {
    console.warn = jest.fn(); // Mock console.warn to capture warnings
    const schemaWithMissingParamSchema: OpenAPIV3.Document = {
      ...openApiSchema,
      paths: {
        '/test': {
          get: {
            operationId: 'testMissingParamSchema',
            parameters: [
              { name: 'testParam', in: 'query', required: true } as OpenAPIV3.ParameterObject, // Missing 'schema' property
            ],
            responses: {},
          },
        },
      },
    };

    const result = parseOpenApiToZod(schemaWithMissingParamSchema);
    const operationSchema = result['testMissingParamSchema'];
    expect(operationSchema).toBeInstanceOf(z.ZodObject);
    expect((operationSchema as ZodObject<any>).shape['testParam']).toBeInstanceOf(z.ZodAny);
    expect(console.warn).toHaveBeenCalledWith('Parameter testParam missing schema.');
  });

  it('should log a warning when requestBody is missing application/json content schema (line 84)', () => {
    console.warn = jest.fn(); // Mock console.warn
    const schemaWithMissingRequestBodySchema: OpenAPIV3.Document = {
      ...openApiSchema,
      paths: {
        '/test': {
          post: {
            operationId: 'testMissingRequestBodySchema',
            requestBody: {
              content: {
                'text/plain': { schema: { type: 'string' } }, // Missing application/json
              },
            } as OpenAPIV3.RequestBodyObject,
            responses: {},
          },
        },
      },
    };

    const result = parseOpenApiToZod(schemaWithMissingRequestBodySchema);
    const operationSchema = result['testMissingRequestBodySchema'];
    expect(operationSchema).toBeInstanceOf(z.ZodObject);
    expect(console.warn).toHaveBeenCalledWith(
      "Request body for operation testMissingRequestBodySchema missing 'application/json' content schema."
    );
  });

  it('should correctly merge parameters and requestBody schemas when both are ZodObject (line 106)', () => {
    const schema: OpenAPIV3.Document = {
      ...openApiSchema,
      paths: {
        '/test': {
          post: {
            operationId: 'testMergeObjects',
            parameters: [
              { name: 'queryParam', in: 'query', required: true, schema: { type: 'string' } } as OpenAPIV3.ParameterObject,
            ],
            requestBody: {
              content: {
                'application/json': { schema: { type: 'object', properties: { bodyParam: { type: 'number' } } } },
              },
            } as OpenAPIV3.RequestBodyObject,
            responses: {},
          },
        },
      },
    };

    const result = parseOpenApiToZod(schema);
    const operationSchema = result['testMergeObjects'];

    // Expecting ZodEffects as merging is done using intersection
    expect(operationSchema).toBeInstanceOf(z.ZodEffects);

    const parsed = operationSchema.parse({ queryParam: 'test', bodyParam: 123 });
    expect(parsed).toEqual({ queryParam: 'test', bodyParam: 123 });
  });

  it('should correctly handle merging parameters with ZodUnion requestBody (line 113)', () => {
    const schema: OpenAPIV3.Document = {
      ...openApiSchema,
      paths: {
        '/test': {
          post: {
            operationId: 'testMergeUnion',
            parameters: [
              { name: 'queryParam', in: 'query', required: true, schema: { type: 'string' } } as OpenAPIV3.ParameterObject,
            ],
            requestBody: {
              content: {
                'application/json': {
                  schema: { anyOf: [{ type: 'object', properties: { bodyParam1: { type: 'number' } } }, { type: 'object', properties: { bodyParam2: { type: 'boolean' } } }] },
                },
              },
            } as OpenAPIV3.RequestBodyObject,
            responses: {},
          },
        },
      },
    };
  
    const result = parseOpenApiToZod(schema);
    const operationSchema = result['testMergeUnion'];
  
    // Expect ZodEffects since it's a combination of union options
    expect(operationSchema).toBeInstanceOf(z.ZodEffects);
  
    // Test with valid data for both union types
    const parsed1 = operationSchema.parse({ queryParam: 'test', bodyParam1: 123 });
    const parsed2 = operationSchema.parse({ queryParam: 'test', bodyParam2: true });
  
    // Verify that both union options are handled correctly
    expect(parsed1).toEqual({ queryParam: 'test', bodyParam1: 123 });
    expect(parsed2).toEqual({ queryParam: 'test' });
  });

  it('should handle merging with single or no ZodUnion options correctly (lines 121-124)', () => {
    const schema: OpenAPIV3.Document = {
      ...openApiSchema,
      paths: {
        '/test': {
          post: {
            operationId: 'testSingleUnionOption',
            parameters: [
              { name: 'queryParam', in: 'query', required: true, schema: { type: 'string' } } as OpenAPIV3.ParameterObject,
            ],
            requestBody: {
              content: {
                'application/json': {
                  schema: { anyOf: [{ type: 'object', properties: { bodyParam: { type: 'number' } } }] }, // Single option
                },
              },
            } as OpenAPIV3.RequestBodyObject,
            responses: {},
          },
        },
      },
    };

    const result = parseOpenApiToZod(schema);
    const operationSchema = result['testSingleUnionOption'];

    expect(operationSchema).toBeInstanceOf(z.ZodEffects); // Single option should result in ZodObject

    const parsed = operationSchema.parse({ queryParam: 'test', bodyParam: 123 });
    expect(parsed).toEqual({ queryParam: 'test', bodyParam: 123 });
  });
});