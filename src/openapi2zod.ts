import { z, ZodSchema, ZodTypeAny } from 'zod'
import { OpenAPIV3 } from 'openapi-types'
import { openApiSchemaToZod } from './openapi-schema-to-zod'
import { flattenZodType } from './utils/flattenZodType'

export function parseOpenApiToZod(openApiSchema: OpenAPIV3.Document): Record<string, ZodSchema> {
  const zodSchemas: Record<string, ZodSchema> = {}

  const paths = openApiSchema.paths || {}
  const schemas = openApiSchema.components?.schemas || {}

  // Convert schemas to proper mapping for reference resolution
  const schemaMap: Record<string, OpenAPIV3.SchemaObject> = {}
  for (const [schemaName, schemaDef] of Object.entries(schemas)) {
    if (!('$ref' in schemaDef)) {
      schemaMap[schemaName] = schemaDef
    }
  }

  for (const [path, pathItem] of Object.entries(paths)) {
    if (!pathItem) continue

    for (const method of [
      'get',
      'post',
      'put',
      'patch',
      'delete',
      'options',
      'head',
      'trace',
    ] as const) {
      const operation = pathItem[method] as OpenAPIV3.OperationObject | undefined
      if (!operation) continue

      const operationId = operation.operationId || `${method.toUpperCase()} ${path}`

      const parameters = [
        ...(pathItem.parameters || []),
        ...(operation.parameters || []),
      ] as OpenAPIV3.ParameterObject[]

      const requestBody = operation.requestBody;

      // Collect all parameters and request body properties
      const combinedSchemas: Record<string, ZodTypeAny> = {}

      // Process parameters
      for (const param of parameters) {
        const { name, required } = param
        let paramSchema: ZodTypeAny

        if ('schema' in param && param.schema) {
          paramSchema = openApiSchemaToZod(param.schema, schemaMap)
        } else {
          console.warn(`Parameter ${name} missing schema.`)
          paramSchema = z.any()
        }

        // Attach description to object if available
        if (param?.description && !paramSchema.description) {
          paramSchema = paramSchema.describe(param.description)
        }

        if (!required) {
          paramSchema = paramSchema.optional()
        }

        combinedSchemas[name] = paramSchema
      }

      // Create parameters schema
      const parametersSchema = z.object(combinedSchemas)

      // Process requestBody
      let requestBodySchema: ZodTypeAny | undefined = undefined

      if (requestBody && 'content' in requestBody && requestBody.content) {
        const requestBodyObj = requestBody as OpenAPIV3.RequestBodyObject
        const jsonContent = requestBodyObj.content['application/json']
        if (jsonContent && 'schema' in jsonContent && jsonContent.schema) {
          requestBodySchema = openApiSchemaToZod(jsonContent.schema, schemaMap)
        } else {
          console.warn(
            `Request body for operation ${operationId} missing 'application/json' content schema.`,
          )
        }
      }

      let operationSchema: ZodTypeAny;

      if (requestBodySchema) {
        const isParametersSchemaEmpty =
          parametersSchema instanceof z.ZodObject &&
          Object.keys(parametersSchema.shape).length === 0

        if (isParametersSchemaEmpty) {
          // No parameters, use requestBodySchema directly
          operationSchema = requestBodySchema
        } else {
          // Merge parametersSchema and requestBodySchema appropriately
          // Existing logic for merging schemas
          const flattenedRequestBodySchema = flattenZodType(requestBodySchema)

          if (flattenedRequestBodySchema instanceof z.ZodObject) {
            operationSchema = parametersSchema.merge(flattenedRequestBodySchema);
          }
          else if (flattenedRequestBodySchema instanceof z.ZodUnion) {
            // Handle ZodUnion by merging parametersSchema with each option in the union
            const mergedOptions = flattenedRequestBodySchema.options.map((option: z.ZodObject<any> | z.ZodAny) => {
              // Instead of directly merging, combine the fields using intersection or custom logic
              return z.intersection(parametersSchema, option);
            });
          
            if (mergedOptions.length >= 2) {
              operationSchema = z.union(mergedOptions as [ZodTypeAny, ZodTypeAny, ...ZodTypeAny[]]);
            } else if (mergedOptions.length === 1) {
              operationSchema = mergedOptions[0];
            } else {
              operationSchema = parametersSchema;
            }
          }
          
          else {
            // For other types of requestBodySchema, use z.intersection
            operationSchema = z.intersection(parametersSchema, flattenedRequestBodySchema);
          }

          // Apply transformation to ensure merged fields are preserved
          operationSchema = operationSchema.transform((input) => {
            // Merge fields from both schemas
            const paramResult = parametersSchema.safeParse(input).success ? input : {};
            const bodyResult = flattenedRequestBodySchema.safeParse(input).success ? input : {};
            
            return { ...paramResult, ...bodyResult };
          });
        }
      } else {
        operationSchema = parametersSchema
      }

      // Attach description or summary to operationSchema if available
      operationSchema = operationSchema.describe(JSON.stringify({
        description: operation.description || operation.summary || '',
        operationId,
        path,
        method,
      }));

      // Add the schema to the result
      zodSchemas[operationId] = operationSchema
    }
  }

  return zodSchemas
}
