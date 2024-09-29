import { z, ZodSchema, ZodTypeAny } from "zod";
import { OpenAPIV3 } from "openapi-types";
import { openApiSchemaToZod } from "./openapi-schema-to-zod";

/**
 * Parses an OpenAPI schema and returns Zod schemas for all operations.
 * @param openApiSchema - The OpenAPI schema object
 * @returns - A record mapping operation IDs to their Zod schemas
 */
export function parseOpenApiToZod(openApiSchema: OpenAPIV3.Document): Record<string, ZodSchema> {
  const zodSchemas: Record<string, ZodSchema> = {};

  const paths = openApiSchema.paths || {};
  const schemas = openApiSchema.components?.schemas || {};

  // Convert schemas to proper mapping for reference resolution
  const schemaMap: Record<string, OpenAPIV3.SchemaObject> = {};
  for (const [schemaName, schemaDef] of Object.entries(schemas)) {
    if (!('$ref' in schemaDef)) {
      schemaMap[schemaName] = schemaDef;
    }
  }

  for (const [path, pathItem] of Object.entries(paths)) {
    if (!pathItem) continue;

    for (const method of ['get', 'post', 'put', 'patch', 'delete', 'options', 'head', 'trace'] as const) {
      const operation = pathItem[method] as OpenAPIV3.OperationObject | undefined;
      if (!operation) continue;

      const operationId = operation.operationId || `${method.toUpperCase()} ${path}`;

      const parameters = [
        ...(pathItem.parameters || []),
        ...(operation.parameters || []),
      ] as OpenAPIV3.ParameterObject[];

      const requestBody = operation.requestBody;

      // Collect all parameters and request body properties
      const combinedSchemas: Record<string, ZodTypeAny> = {};

      // Process parameters
      for (const param of parameters) {
        const { name, required } = param;
        let paramSchema: ZodTypeAny;

        if ('schema' in param && param.schema) {
          paramSchema = openApiSchemaToZod(param.schema, schemaMap);
        } else {
          console.warn(`Parameter ${name} missing schema.`);
          paramSchema = z.any();
        }
        
        // Attach description to object if available
        if (param?.description && !paramSchema.description) {
          paramSchema = paramSchema.describe(param.description);
        }

        if (!required) {
          paramSchema = paramSchema.optional();
        }

        combinedSchemas[name] = paramSchema;
      }

      // Process requestBody
      let requestBodySchema: ZodTypeAny | undefined = undefined;

      if (requestBody && 'content' in requestBody && requestBody.content) {
        const requestBodyObj = requestBody as OpenAPIV3.RequestBodyObject;
        const jsonContent = requestBodyObj.content["application/json"];
        if (jsonContent && 'schema' in jsonContent && jsonContent.schema) {
          requestBodySchema = openApiSchemaToZod(jsonContent.schema, schemaMap);

          if (requestBodySchema instanceof z.ZodObject) {
            Object.assign(combinedSchemas, requestBodySchema.shape);
          } else {
            combinedSchemas['requestBody'] = requestBodySchema;
          }
        } else {
          console.warn(`Request body for operation ${operationId} missing 'application/json' content schema.`);
        }
      }

      // Create the operation schema
      const operationSchema = z.object(combinedSchemas);

      // Add the schema to the result
      zodSchemas[operationId] = operationSchema;
    }
  }

  return zodSchemas;
}
