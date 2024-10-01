import { z, ZodTypeAny, ZodDefault, ZodEffects, ZodObject, ZodArray } from 'zod';

/**
 * Applies default values to Zod schema types, handling various structures robustly.
 * @param schema - The Zod schema to apply default values to.
 * @param defaultValue - The default value to apply.
 * @returns - A new schema with default values applied if applicable.
 */
export function applyDefaultValue<T extends ZodTypeAny>(schema: T, defaultValue: any): T | ZodDefault<T> | ZodEffects<T> {
  // Check if the schema supports .default() and apply it directly
  if (
    schema instanceof z.ZodString ||
    schema instanceof z.ZodNumber ||
    schema instanceof z.ZodBoolean ||
    schema instanceof z.ZodArray ||
    schema instanceof z.ZodObject ||
    schema instanceof z.ZodEnum
  ) {
    return schema.default(defaultValue) as unknown as T;
  }

  // Special handling for ZodObject to recursively apply defaults to nested properties
  if (schema instanceof z.ZodObject) {
    const updatedShape = Object.entries(schema.shape).reduce((acc, [key, value]) => {
      if (defaultValue && key in defaultValue) {
        acc[key] = applyDefaultValue(value as ZodTypeAny, defaultValue[key]) as ZodTypeAny;
      } else {
        acc[key] = value as ZodTypeAny;
      }
      return acc;
    }, {} as Record<string, ZodTypeAny>);

    return z.object(updatedShape).default(defaultValue) as unknown as T;
  }

  // Special handling for ZodArray to apply default value to array items
  if (schema instanceof z.ZodArray) {
    return z.array(applyDefaultValue(schema.element, defaultValue)).default(defaultValue) as unknown as T;
  }

  // Fallback: Handle ZodEffects, unions, and other advanced types by preprocessing the value
  const schemaWithDefault = z.preprocess(
    (val) => (val === undefined ? defaultValue : val),
    schema,
  );

  return schemaWithDefault as unknown as T;
}
