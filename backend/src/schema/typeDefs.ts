import { gql } from 'graphql-tag';

export const typeDefs = gql`
  enum EmployeeStatus {
    ACTIVE
    INACTIVE
    ON_LEAVE
  }

  type Employee {
    id: ID!
    firstName: String!
    lastName: String!
    email: String!
    department: String!
    role: String!
    salary: Float!
    phone: String
    dateOfJoining: String
    status: EmployeeStatus!
    createdAt: String!
    updatedAt: String!
  }

  type DeleteResult {
    success: Boolean!
    id: ID!
    message: String!
  }

  type HealthStatus {
    status: String!
    uptime: Float!
    timestamp: String!
    mode: String!
  }

  input CreateEmployeeInput {
    firstName: String!
    lastName: String!
    email: String!
    department: String!
    role: String!
    salary: Float!
    phone: String
    dateOfJoining: String
    status: EmployeeStatus
  }

  input UpdateEmployeeInput {
    firstName: String
    lastName: String
    email: String
    department: String
    role: String
    salary: Float
    phone: String
    dateOfJoining: String
    status: EmployeeStatus
  }

  type Query {
    employees(department: String, status: String, limit: Int, offset: Int): [Employee!]!
    employee(id: ID!): Employee
    health: HealthStatus!
  }

  type Mutation {
    createEmployee(input: CreateEmployeeInput!): Employee!
    updateEmployee(id: ID!, input: UpdateEmployeeInput!): Employee!
    deleteEmployee(id: ID!): DeleteResult!
  }

  type Subscription {
    employeeCreated: Employee!
    employeeUpdated: Employee!
    employeeDeleted: DeleteResult!
  }
`;
