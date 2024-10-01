import { OpenAPIV3 } from 'openapi-types'
import { z } from 'zod'
import { parseOpenApiToZod } from '../src/openapi-to-zod' // Adjust the import path accordingly
import { zodToJsonSchema } from 'zod-to-json-schema'
import * as openapiJson from './__mocks__/openapi_3_1_0_v1.json'

describe('parseOpenApiToZod v1', () => {
  let zodSchemas: Record<string, z.ZodSchema>

  beforeAll(() => {
    zodSchemas = parseOpenApiToZod(openapiJson as OpenAPIV3.Document)
  })

  test('should return an object with schemas', () => {
    expect(typeof zodSchemas).toBe('object')
    expect(Object.keys(zodSchemas).length).toBeGreaterThan(0)
  })

  test('should generate valid Zod schemas', () => {
    for (const schema of Object.values(zodSchemas)) {
      expect(schema).toBeInstanceOf(z.ZodType)
    }
  })

  test('check zod schema contains description in its definition', () => {
    for (const [operationId, schema] of Object.entries(zodSchemas)) {
      expect(schema._def.description).toBeDefined()
    }
  })

  // Test specific operation: addJiraIssueComment
  test('should generate correct schema for operationId "POST addJiraIssueComment"', () => {
    const schema = zodSchemas['addJiraIssueComment']
    expect(schema).toBeDefined()
    expect(schema).toBeInstanceOf(z.ZodType)

    // Example valid data
    const validData = {
      issueIdOrKey: 'JIRA-123',
      commentBody: 'This is a test comment.',
    }

    // Example invalid data (missing required field)
    const invalidData = {
      issueIdOrKey: 'JIRA-123',
    }

    expect(() => schema.parse(validData)).not.toThrow()
    expect(() => schema.parse(invalidData)).toThrow()

    // Generate JSON schema from Zod schema
    const jsonSchema = zodToJsonSchema(schema)

    // Use snapshot testing
    expect(jsonSchema).toMatchSnapshot()
  })

  test('should generate correct schema for operationId "POST addProductiveTimeEntry"', () => {
    const schema = zodSchemas['addProductiveTimeEntry'] as z.ZodObject<any>
    expect(schema).toBeDefined()
    expect(schema).toBeInstanceOf(z.ZodObject)

    // Valid data
    const validData = {
      note: 'Worked on project X',
      dateString: 'today',
      hours: 8,
      service_id: '3173137',
      person_id: '404947',
    }

    // Invalid data (missing required fields)
    const invalidDataMissingFields = {
      note: 'Worked on project X',
    }

    // Invalid data (wrong type)
    const invalidDataWrongType = {
      note: 'Worked on project X',
      dateString: 'today',
      hours: 'eight', // Should be integer
    }

    // Validate parsing
    expect(() => schema.parse(validData)).not.toThrow()
    expect(() => schema.parse(invalidDataMissingFields)).toThrow()
    expect(() => schema.parse(invalidDataWrongType)).toThrow()

    // Generate JSON schema and snapshot test
    const jsonSchema = zodToJsonSchema(schema, 'addProductiveTimeEntry')
    expect(jsonSchema).toMatchSnapshot()
  })

  test('should generate correct schema for operationId "POST assignJiraIssue"', () => {
    const schema = zodSchemas['assignJiraIssue'] as z.ZodObject<any>
    expect(schema).toBeDefined()
    expect(schema).toBeInstanceOf(z.ZodObject)

    // Valid data with assignee
    const validDataWithAssignee = {
      issueIdOrKey: 'JIRA-123',
      assignee: 'user123',
    }

    // Valid data without assignee (should return available assignees)
    const validDataWithoutAssignee = {
      issueIdOrKey: 'JIRA-123',
    }

    // Invalid data (missing issueIdOrKey)
    const invalidData = {
      assignee: 'user123',
    }

    // Validate parsing
    expect(() => schema.parse(validDataWithAssignee)).not.toThrow()
    expect(() => schema.parse(validDataWithoutAssignee)).not.toThrow()
    expect(() => schema.parse(invalidData)).toThrow()

    // Generate JSON schema and snapshot test
    const jsonSchema = zodToJsonSchema(schema, 'assignJiraIssue')
    expect(jsonSchema).toMatchSnapshot()
  })

  test('should generate correct schema for operationId "POST commentOnGithubIssue"', () => {
    const schema = zodSchemas['commentOnGithubIssue'] as z.ZodObject<any>
    expect(schema).toBeDefined()
    expect(schema).toBeInstanceOf(z.ZodObject)

    // Valid data
    const validData = {
      repoOwner: 'octocat',
      repoName: 'Hello-World',
      issueNumber: 42,
      commentBody: 'This is a test comment.',
    }

    // Invalid data (missing required fields)
    const invalidDataMissingFields = {
      repoOwner: 'octocat',
      issueNumber: 42,
      commentBody: 'This is a test comment.',
    }

    // Invalid data (wrong type)
    const invalidDataWrongType = {
      repoOwner: 'octocat',
      repoName: 'Hello-World',
      issueNumber: 'forty-two', // Should be integer
      commentBody: 'This is a test comment.',
    }

    // Validate parsing
    expect(() => schema.parse(validData)).not.toThrow()
    expect(() => schema.parse(invalidDataMissingFields)).toThrow()
    expect(() => schema.parse(invalidDataWrongType)).toThrow()

    // Generate JSON schema and snapshot test
    const jsonSchema = zodToJsonSchema(schema, 'commentOnGithubIssue')
    expect(jsonSchema).toMatchSnapshot()
  })

  test('should generate correct schema for operationId "GET createGmailLabelsAndFilters"', () => {
    const schema = zodSchemas['createGmailLabelsAndFilters'] as z.ZodObject<any>
    expect(schema).toBeDefined()
    expect(schema).toBeInstanceOf(z.ZodObject)

    // Valid data with both parameters
    const validDataBothParams = {
      labelsToCreate: 'Important,Work',
      filtersToCreate: 'from:boss@example.com',
    }

    // Valid data with one parameter
    const validDataOneParam = {
      labelsToCreate: 'Personal',
    }

    // Valid data with no parameters (both optional)
    const validDataNoParams = {}

    // Invalid data (wrong type)
    const invalidDataWrongType = {
      labelsToCreate: 123, // Should be string
    }

    // Validate parsing
    expect(() => schema.parse(validDataBothParams)).not.toThrow()
    expect(() => schema.parse(validDataOneParam)).not.toThrow()
    expect(() => schema.parse(validDataNoParams)).not.toThrow()
    expect(() => schema.parse(invalidDataWrongType)).toThrow()

    // Generate JSON schema and snapshot test
    const jsonSchema = zodToJsonSchema(schema, 'createGmailLabelsAndFilters')
    expect(jsonSchema).toMatchSnapshot()
  })

  test('should generate correct schema for operationId "POST createGoogleDriveFile"', () => {
    const schema = zodSchemas['createGoogleDriveFile'] as z.ZodObject<any>
    expect(schema).toBeDefined()
    expect(schema).toBeInstanceOf(z.ZodObject)

    // Valid data
    const validData = {
      fileName: 'document.txt',
      fileContent: 'This is the content of the file.',
    }

    // Invalid data: missing fileContent
    const invalidDataMissingFileContent = {
      fileName: 'document.txt',
    }

    // Invalid data: fileName is not a string
    const invalidDataFileNameNotString = {
      fileName: 123, // Should be string
      fileContent: 'This is the content of the file.',
    }

    // Validate parsing
    expect(() => schema.parse(validData)).not.toThrow()
    expect(() => schema.parse(invalidDataMissingFileContent)).toThrow()
    expect(() => schema.parse(invalidDataFileNameNotString)).toThrow()

    // Generate JSON schema and snapshot test
    const jsonSchema = zodToJsonSchema(schema, 'createGoogleDriveFile')
    expect(jsonSchema).toMatchSnapshot()
  })

  test('should generate correct schema for operationId "DELETE deleteJiraFixVersion"', () => {
    const schema = zodSchemas['deleteJiraFixVersion'] as z.ZodObject<any>
    expect(schema).toBeDefined()
    expect(schema).toBeInstanceOf(z.ZodObject)

    // Valid data
    const validData = {
      versionId: '12345',
    }

    // Invalid data: missing versionId
    const invalidDataMissingVersionId = {}

    // Invalid data: versionId is not a string
    const invalidDataVersionIdNotString = {
      versionId: 12345, // Should be a string
    }

    // Validate parsing
    expect(() => schema.parse(validData)).not.toThrow()
    expect(() => schema.parse(invalidDataMissingVersionId)).toThrow()
    expect(() => schema.parse(invalidDataVersionIdNotString)).toThrow()

    // Generate JSON schema and snapshot test
    const jsonSchema = zodToJsonSchema(schema, 'deleteJiraFixVersion')
    expect(jsonSchema).toMatchSnapshot()
  })

  test('should generate correct schema for operationId "DELETE deleteJiraIssueComment"', () => {
    const schema = zodSchemas['deleteJiraIssueComment'] as z.ZodObject<any>
    expect(schema).toBeDefined()
    expect(schema).toBeInstanceOf(z.ZodObject)

    // Valid data
    const validData = {
      issueIdOrKey: 'JIRA-123',
      commentId: '45678',
    }

    // Invalid data: missing commentId
    const invalidDataMissingCommentId = {
      issueIdOrKey: 'JIRA-123',
    }

    // Invalid data: missing issueIdOrKey
    const invalidDataMissingIssueIdOrKey = {
      commentId: '45678',
    }

    // Invalid data: commentId is not a string
    const invalidDataCommentIdNotString = {
      issueIdOrKey: 'JIRA-123',
      commentId: 45678, // Should be a string
    }

    // Validate parsing
    expect(() => schema.parse(validData)).not.toThrow()
    expect(() => schema.parse(invalidDataMissingCommentId)).toThrow()
    expect(() => schema.parse(invalidDataMissingIssueIdOrKey)).toThrow()
    expect(() => schema.parse(invalidDataCommentIdNotString)).toThrow()

    // Generate JSON schema and snapshot test
    const jsonSchema = zodToJsonSchema(schema, 'deleteJiraIssueComment')
    expect(jsonSchema).toMatchSnapshot()
  })

  test('should generate correct schema for operationId "DELETE deleteJiraSprint"', () => {
    const schema = zodSchemas['deleteJiraSprint'] as z.ZodObject<any>
    expect(schema).toBeDefined()
    expect(schema).toBeInstanceOf(z.ZodObject)

    // Valid data
    const validData = {
      sprintId: 7890,
    }

    // Invalid data: missing sprintId
    const invalidDataMissingSprintId = {}

    // Invalid data: sprintId is not an integer
    const invalidDataSprintIdNotInteger = {
      sprintId: '7890', // Should be an integer
    }

    // Validate parsing
    expect(() => schema.parse(validData)).not.toThrow()
    expect(() => schema.parse(invalidDataMissingSprintId)).toThrow()
    expect(() => schema.parse(invalidDataSprintIdNotInteger)).toThrow()

    // Generate JSON schema and snapshot test
    const jsonSchema = zodToJsonSchema(schema, 'deleteJiraSprint')
    expect(jsonSchema).toMatchSnapshot()
  })

  test('should generate correct schema for operationId "PATCH updateJiraIssue"', () => {
    const schema = zodSchemas['updateJiraIssue'] as z.ZodObject<any>
    expect(schema).toBeDefined()
    expect(schema).toBeInstanceOf(z.ZodObject)

    // Valid data
    const validData = {
      issueIdOrKey: 'JIRA-123',
      bodyData: '{"fields": {"summary": "Updated summary"}}',
    }

    // Invalid data: missing issueIdOrKey
    const invalidDataMissingIssueIdOrKey = {
      bodyData: '{"fields": {"summary": "Updated summary"}}',
    }

    // Invalid data: missing bodyData
    const invalidDataMissingBodyData = {
      issueIdOrKey: 'JIRA-123',
    }

    // Invalid data: issueIdOrKey is not a string
    const invalidDataIssueIdOrKeyNotString = {
      issueIdOrKey: 12345, // Should be a string
      bodyData: '{"fields": {"summary": "Updated summary"}}',
    }

    // Validate parsing
    expect(() => schema.parse(validData)).not.toThrow()
    expect(() => schema.parse(invalidDataMissingIssueIdOrKey)).toThrow()
    expect(() => schema.parse(invalidDataMissingBodyData)).toThrow()
    expect(() => schema.parse(invalidDataIssueIdOrKeyNotString)).toThrow()

    // Generate JSON schema and snapshot test
    const jsonSchema = zodToJsonSchema(schema, 'updateJiraIssue')
    expect(jsonSchema).toMatchSnapshot()
  })

  test('should generate correct schema for operationId "PATCH updateJiraIssueComment"', () => {
    const schema = zodSchemas['updateJiraIssueComment'] as z.ZodObject<any>
    expect(schema).toBeDefined()
    expect(schema).toBeInstanceOf(z.ZodObject)

    // Valid data
    const validData = {
      issueIdOrKey: 'JIRA-123',
      commentId: '45678',
      commentBody: 'Updated comment content.',
    }

    // Invalid data: missing issueIdOrKey
    const invalidDataMissingIssueIdOrKey = {
      commentId: '45678',
      commentBody: 'Updated comment content.',
    }

    // Invalid data: missing commentId
    const invalidDataMissingCommentId = {
      issueIdOrKey: 'JIRA-123',
      commentBody: 'Updated comment content.',
    }

    // Invalid data: missing commentBody
    const invalidDataMissingCommentBody = {
      issueIdOrKey: 'JIRA-123',
      commentId: '45678',
    }

    // Invalid data: commentId is not a string
    const invalidDataCommentIdNotString = {
      issueIdOrKey: 'JIRA-123',
      commentId: 45678, // Should be a string
      commentBody: 'Updated comment content.',
    }

    // Validate parsing
    expect(() => schema.parse(validData)).not.toThrow()
    expect(() => schema.parse(invalidDataMissingIssueIdOrKey)).toThrow()
    expect(() => schema.parse(invalidDataMissingCommentId)).toThrow()
    expect(() => schema.parse(invalidDataMissingCommentBody)).toThrow()
    expect(() => schema.parse(invalidDataCommentIdNotString)).toThrow()

    // Generate JSON schema and snapshot test
    const jsonSchema = zodToJsonSchema(schema, 'updateJiraIssueComment')
    expect(jsonSchema).toMatchSnapshot()
  })

  test('should generate correct schema for operationId "PATCH updateJiraSprint"', () => {
    const schema = zodSchemas['updateJiraSprint'] as z.ZodObject<any>
    expect(schema).toBeDefined()
    expect(schema).toBeInstanceOf(z.ZodObject)

    // Valid data with all fields
    const validDataAllFields = {
      sprintId: 7890,
      name: 'Sprint 5',
      startDate: '2023-10-01T00:00:00Z',
      endDate: '2023-10-15T23:59:59Z',
      goal: 'Complete all user stories assigned.',
      state: 'active',
    }

    // Valid data with only required field
    const validDataRequiredOnly = {
      sprintId: 7890,
    }

    // Invalid data: missing sprintId
    const invalidDataMissingSprintId = {
      name: 'Sprint 5',
    }

    // Invalid data: sprintId is not an integer
    const invalidDataSprintIdNotInteger = {
      sprintId: '7890', // Should be an integer
      name: 'Sprint 5',
    }

    // Invalid data: startDate is not a string
    const invalidDataStartDateNotString = {
      sprintId: 7890,
      startDate: 20231001, // Should be a string
    }

    // Validate parsing
    expect(() => schema.parse(validDataAllFields)).not.toThrow()
    expect(() => schema.parse(validDataRequiredOnly)).not.toThrow()
    expect(() => schema.parse(invalidDataMissingSprintId)).toThrow()
    expect(() => schema.parse(invalidDataSprintIdNotInteger)).toThrow()
    expect(() => schema.parse(invalidDataStartDateNotString)).toThrow()

    // Generate JSON schema and snapshot test
    const jsonSchema = zodToJsonSchema(schema, 'updateJiraSprint')
    expect(jsonSchema).toMatchSnapshot()
  })
})
