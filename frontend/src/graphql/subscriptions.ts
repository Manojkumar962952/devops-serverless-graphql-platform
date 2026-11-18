import { gql } from '@apollo/client';

export const EMPLOYEE_CREATED_SUBSCRIPTION = gql`
  subscription OnEmployeeCreated {
    employeeCreated {
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

export const EMPLOYEE_UPDATED_SUBSCRIPTION = gql`
  subscription OnEmployeeUpdated {
    employeeUpdated {
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

export const EMPLOYEE_DELETED_SUBSCRIPTION = gql`
  subscription OnEmployeeDeleted {
    employeeDeleted {
      success
      id
      message
    }
  }
`;
