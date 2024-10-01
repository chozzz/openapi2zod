import { z, ZodEffects, ZodString, ZodTypeAny, ZodObject } from 'zod'
import { OpenAPIV3 } from 'openapi-types'
import { flattenZodType } from './utils/flattenZodType'

/**
 * Converts an OpenAPI schema object to a Zod schema.
 * @param schema - OpenAPI SchemaObject or ReferenceObject
 * @param schemas - Map of component schemas for resolving $ref
 * @returns - ZodTypeAny
 */
export function openApiSchemaToZod(
  schema: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject | undefined,
  schemas: Record<string, OpenAPIV3.SchemaObject>,
): ZodTypeAny {
  if (!schema || typeof schema !== 'object') {
    return z.any()
  }

  // Handle $ref references
  if ('$ref' in schema && schema.$ref) {
    const refPath = schema.$ref.replace(/^#\/components\/schemas\//, '')
    const refSchema = schemas[refPath]
    if (refSchema) {
      return openApiSchemaToZod(refSchema, schemas)
    } else {
      console.warn(`Reference ${schema.$ref} not found in schemas.`)
      return z.any()
    }
  }

  // Handle composite schemas
  if ('oneOf' in schema && schema.oneOf) {
    const zodSchemas = schema.oneOf.map((s) => openApiSchemaToZod(s, schemas))

    let combinedSchema: ZodTypeAny

    if (zodSchemas.length === 0) {
      combinedSchema = z.any()
    } else if (zodSchemas.length === 1) {
      combinedSchema = zodSchemas[0]
    } else {
      combinedSchema = z.union(zodSchemas as [ZodTypeAny, ZodTypeAny, ...ZodTypeAny[]])
    }

    // Attach description if available
    if ('description' in schema && schema.description) {
      combinedSchema = combinedSchema.describe(schema.description)
    }

    return combinedSchema
  }

  if ('anyOf' in schema && schema.anyOf) {
    const zodSchemas = schema.anyOf.map((s) => openApiSchemaToZod(s, schemas))

    let combinedSchema: ZodTypeAny

    if (zodSchemas.length === 0) {
      combinedSchema = z.any()
    } else if (zodSchemas.length === 1) {
      combinedSchema = zodSchemas[0]
    } else {
      combinedSchema = z.union(zodSchemas as [ZodTypeAny, ZodTypeAny, ...ZodTypeAny[]])
    }

    // Attach description if available
    if ('description' in schema && schema.description) {
      combinedSchema = combinedSchema.describe(schema.description)
    }

    return combinedSchema
  }

  if ('allOf' in schema && schema.allOf) {
    const zodSchemas = schema.allOf.map((s) => openApiSchemaToZod(s, schemas))

    let combinedSchema: ZodTypeAny

    if (zodSchemas.length === 0) {
      combinedSchema = z.any()
    } else {
      combinedSchema = zodSchemas.reduce((prev, curr) => z.intersection(prev, curr))
    }

    // **Flatten the intersection of ZodObjects**
    combinedSchema = flattenZodType(combinedSchema)

    // Attach description if available
    if ('description' in schema && schema.description) {
      combinedSchema = combinedSchema.describe(schema.description)
    }

    return combinedSchema
  }

  if ('not' in schema && schema.not) {
    let combinedSchema = z
      .any()
      .refine((value) => !openApiSchemaToZod(schema.not, schemas).safeParse(value).success)

    // Attach description if available
    if ('description' in schema && schema.description) {
      combinedSchema = combinedSchema.describe(schema.description)
    }

    return combinedSchema
  }

  if ('type' in schema) {
    switch (schema.type) {
      case 'string': {
        // Handle enums separately
        if ('enum' in schema && schema.enum) {
          const enumValues = schema.enum as [string, ...string[]]
          let enumSchema = z.enum(enumValues)

          // Attach description if available
          if ('description' in schema && schema.description) {
            enumSchema = enumSchema.describe(schema.description)
          }
          return enumSchema
        }

        // Start with a ZodString
        let stringSchema: ZodString | ZodEffects<ZodString, any, any> = z.string()

        // Handle formats
        if ('format' in schema && schema.format) {
          switch (schema.format) {
            case 'email':
              stringSchema = stringSchema.email()
              break
            case 'uuid':
              stringSchema = stringSchema.uuid()
              break
            case 'uri':
            case 'uri-reference':
              stringSchema = stringSchema.url()
              break
            case 'hostname':
              stringSchema = stringSchema.refine(
                (val) => {
                  // Simple regex for hostname validation
                  const hostnameRegex =
                    /^(?=.{1,253}$)(?!\-)(?:[a-zA-Z0-9\-]{0,62}[a-zA-Z0-9]\.)+[a-zA-Z]{2,63}$/
                  return hostnameRegex.test(val)
                },
                { message: 'Invalid hostname format' },
              )
              break
            case 'ipv4':
              stringSchema = stringSchema.ip({ version: 'v4' })
              break
            case 'ipv6':
              stringSchema = stringSchema.ip({ version: 'v6' })
              break
            case 'date-time':
              stringSchema = stringSchema.datetime({ offset: true })
              break
            case 'date':
              stringSchema = stringSchema.refine(
                (val) => {
                  // Simple date validation (YYYY-MM-DD)
                  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
                  return dateRegex.test(val)
                },
                { message: 'Invalid date format' },
              )
              break
            case 'time':
              stringSchema = stringSchema.refine(
                (val) => {
                  // Simple time validation (HH:MM:SS)
                  const timeRegex = /^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/
                  return timeRegex.test(val)
                },
                { message: 'Invalid time format' },
              )
              break
            case 'byte':
              stringSchema = stringSchema.base64()
              break
            case 'password':
              // For passwords, we might not enforce any format, but you can add custom rules
              // For example, minimum length
              stringSchema = stringSchema.min(8, 'Password must be at least 8 characters long')
              break
            case 'binary':
              // Handle binary data as Buffer instance
              return z.instanceof(Buffer)
            default:
              console.warn(`Unhandled string format: ${schema.format}`)
          }
        }

        // Attach description if available
        if ('description' in schema && schema.description) {
          stringSchema = stringSchema.describe(schema.description)
        }

        return stringSchema
      }
      case 'integer': {
        let integerSchema = z.number().int()

        // Attach description if available
        if ('description' in schema && schema.description) {
          integerSchema = integerSchema.describe(schema.description)
        }

        return integerSchema
      }
      case 'number': {
        let numberSchema = z.number()

        // Attach description if available
        if ('description' in schema && schema.description) {
          numberSchema = numberSchema.describe(schema.description)
        }

        return numberSchema
      }
      case 'boolean': {
        let booleanSchema = z.boolean()

        // Attach description if available
        if ('description' in schema && schema.description) {
          booleanSchema = booleanSchema.describe(schema.description)
        }

        return booleanSchema
      }
      case 'array': {
        if ('items' in schema && schema.items) {
          let arraySchema = z.array(openApiSchemaToZod(schema.items, schemas))

          // Attach description if available
          if ('description' in schema && schema.description) {
            arraySchema = arraySchema.describe(schema.description)
          }

          return arraySchema
        } else {
          console.warn("Array schema without 'items' property.")
          return z.array(z.any())
        }
      }
      case 'object': {
        const properties = schema.properties || {}
        const requiredProps = schema.required || []
        const zodProperties: Record<string, ZodTypeAny> = {}

        for (const [key, value] of Object.entries(properties)) {
          let propertySchema = openApiSchemaToZod(value as OpenAPIV3.SchemaObject, schemas)

          if (!requiredProps.includes(key)) {
            propertySchema = propertySchema.optional()
          }

          // Attach description to property if available
          if ('description' in value && value.description) {
            propertySchema = propertySchema.describe(value.description)
          }

          zodProperties[key] = propertySchema
        }

        let objectSchema = z.object(zodProperties)

        if (schema.additionalProperties) {
          if (schema.additionalProperties === true) {
            objectSchema = objectSchema.catchall(z.any())
          } else if (typeof schema.additionalProperties === 'object') {
            objectSchema = objectSchema.catchall(
              openApiSchemaToZod(schema.additionalProperties, schemas),
            )
          }
        }

        // Attach description to object if available
        if ('description' in schema && schema.description) {
          objectSchema = objectSchema.describe(schema.description)
        }

        return objectSchema
      }
      default:
        console.warn(`Unhandled schema type: ${schema.type}`)
        return z.any()
    }
  } else {
    console.warn("Schema without 'type' property.")
    return z.any()
  }
}
