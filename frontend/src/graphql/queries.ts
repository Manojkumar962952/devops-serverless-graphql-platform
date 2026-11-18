import { gql } from '@apollo/client';

export const GET_EMPLOYEES = gql`
  query GetEmployees($department: String, $status: String, $limit: Int, $offset: Int) {
    employees(department: $department, status: $status, limit: $limit, offset: $offset) {
      id
      firstName
      lastName
      email
      department
      role
      salary
      phone
      dateOfJoining
      status
      createdAt
      updatedAt
    }
  }
`;

export const GET_EMPLOYEE = gql`
  query GetEmployee($id: ID!) {
    employee(id: $id) {
      id
      firstName
      lastName
      email
      department
      role
      salary
      phone
      dateOfJoining
      status
      createdAt
      updatedAt
    }
  }
`;

export const GET_HEALTH = gql`
  query GetHealth {
    health {
      status
      uptime
      timestamp
      mode
    }
  }
`;
