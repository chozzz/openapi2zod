import { OpenAPIV3 } from "openapi-types";

/**
 * Recursively collects default values from an object schema.
 * @param schema - The OpenAPI schema object.
 * @returns - A partial object containing only default values.
 */
export function getDefaultValues(schema: OpenAPIV3.SchemaObject): Record<string, any> | undefined {
  if (!schema || typeof schema !== 'object' || schema.type !== 'object' || !schema.properties) {
    return undefined;
  }

  const defaultValues: Record<string, any> = {};
  let hasDefaults = false;

  for (const [key, propertySchema] of Object.entries(schema.properties)) {
    const propertyObject = propertySchema as OpenAPIV3.SchemaObject;

    // Check if this property has a default value
    if (propertyObject.default !== undefined) {
      defaultValues[key] = propertyObject.default;
      hasDefaults = true;
    }

    // Recursively check if nested objects have defaults
    if (propertyObject.type === 'object' && propertyObject.properties) {
      const nestedDefaults = getDefaultValues(propertyObject);
      if (nestedDefaults !== undefined) {
        // Merge the nested default values
        defaultValues[key] = { ...defaultValues[key], ...nestedDefaults };
        hasDefaults = true;
      }
    }
  }

  // Return the object with default values if any were found, else undefined
  return hasDefaults ? defaultValues : undefined;
}
