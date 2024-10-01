import { OpenAPIV3 } from 'openapi-types'
import { z } from 'zod'
import { parseOpenApiToZod } from '../src/openapi-to-zod' // Adjust the import path accordingly
import { zodToJsonSchema } from 'zod-to-json-schema'
import * as openapiJson from './__mocks__/openapi_3_1_0_v2.json'

describe('parseOpenApiToZod v2', () => {
  let zodSchemas: Record<string, z.ZodSchema>

  beforeAll(() => {
    zodSchemas = parseOpenApiToZod(openapiJson as OpenAPIV3.Document)
  })
  test('should generate correct schema for operationId "oneOfExample"', () => {
    const schema = zodSchemas['oneOfExample'] as z.ZodTypeAny
    expect(schema).toBeDefined()

    // Valid data: conforms to TypeA
    const validDataTypeA = {
      type: 'A',
      value: 'Some value',
    }

    // Valid data: conforms to TypeB
    const validDataTypeB = {
      type: 'B',
      amount: 42,
    }

    // Invalid data: conforms to neither TypeA nor TypeB
    const invalidData = {
      type: 'C',
      value: 'Invalid',
    }

    // Validate parsing
    expect(() => schema.parse(validDataTypeA)).not.toThrow()
    expect(() => schema.parse(validDataTypeB)).not.toThrow()
    expect(() => schema.parse(invalidData)).toThrow()

    // Generate JSON schema and snapshot test
    const jsonSchema = zodToJsonSchema(schema, 'oneOfExample')
    expect(jsonSchema).toMatchSnapshot()
  })
  test('should generate correct schema for operationId "anyOfExample"', () => {
    const schema = zodSchemas['anyOfExample'] as z.ZodTypeAny
    expect(schema).toBeDefined()

    // Valid data: conforms to TypeC
    const validDataTypeC = {
      option1: 'Value',
    }

    // Valid data: conforms to TypeD
    const validDataTypeD = {
      option2: 100,
    }

    // Valid data: conforms to both TypeC and TypeD
    const validDataBoth = {
      option1: 'Value',
      option2: 100,
    }

    // Invalid data: conforms to neither
    const invalidData = {
      option3: 'Invalid',
    }

    // Validate parsing
    expect(() => schema.parse(validDataTypeC)).not.toThrow()
    expect(() => schema.parse(validDataTypeD)).not.toThrow()
    expect(() => schema.parse(validDataBoth)).not.toThrow()
    expect(() => schema.parse(invalidData)).toThrow()

    // Generate JSON schema and snapshot test
    const jsonSchema = zodToJsonSchema(schema, 'anyOfExample')
    expect(jsonSchema).toMatchSnapshot()
  })
  test('should generate correct schema for operationId "allOfExample"', () => {
    const schema = zodSchemas['allOfExample'] as z.ZodTypeAny
    expect(schema).toBeDefined()

    // Valid data: conforms to both BaseType and additional properties
    const validData = {
      id: '123',
      name: 'Test Entity',
      additionalProperty: 'Extra Value',
    }

    // Invalid data: missing property from BaseType
    const invalidDataMissingBase = {
      name: 'Test Entity',
      additionalProperty: 'Extra Value',
    }

    // Invalid data: missing additionalProperty
    const invalidDataMissingAdditional = {
      id: '123',
      name: 'Test Entity',
    }

    // Validate parsing
    expect(() => schema.parse(validData)).not.toThrow()
    expect(() => schema.parse(invalidDataMissingBase)).toThrow()
    expect(() => schema.parse(invalidDataMissingAdditional)).toThrow()

    // Generate JSON schema and snapshot test
    const jsonSchema = zodToJsonSchema(schema, 'allOfExample')
    expect(jsonSchema).toMatchSnapshot()
  })
  test('should generate correct schema for operationId "notExample"', () => {
    const schema = zodSchemas['notExample'] as z.ZodTypeAny
    expect(schema).toBeDefined()

    // Valid data: does not conform to ForbiddenType
    const validData = {
      allowed: true,
    }

    // Invalid data: conforms to ForbiddenType
    const invalidData = {
      forbidden: true,
    }

    // Validate parsing
    expect(() => schema.parse(validData)).not.toThrow()
    expect(() => schema.parse(invalidData)).toThrow()

    // Generate JSON schema and snapshot test
    const jsonSchema = zodToJsonSchema(schema, 'notExample')
    expect(jsonSchema).toMatchSnapshot()
  })
})
