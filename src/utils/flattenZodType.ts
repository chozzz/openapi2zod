import { ZodTypeAny, z } from 'zod'

/**
 * Flattens Zod schemas by recursively merging intersections of ZodObjects.
 * @param schema - The Zod schema to flatten
 * @returns - The flattened Zod schema
 */
export function flattenZodType(schema: ZodTypeAny): ZodTypeAny {
  if (schema instanceof z.ZodIntersection) {
    const left = flattenZodType(schema._def.left)
    const right = flattenZodType(schema._def.right)

    if (left instanceof z.ZodObject && right instanceof z.ZodObject) {
      // Merge the shapes of the two objects
      return left.merge(right)
    } else {
      // Return a new intersection if we cannot merge
      return z.intersection(left, right)
    }
  } else {
    return schema
  }
}
