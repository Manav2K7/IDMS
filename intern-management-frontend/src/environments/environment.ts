export const environment = {
  production: true,
  mainColor: '#3867d6',
  /**
   * Base URL of the Spring Boot backend (architecture.md §6). Every request in
   * core/services/* is appended to this, and all controllers are mapped under
   * `/api` — so the value must include that suffix, no trailing slash.
   */
  apiBaseUrl: 'http://localhost:8080/api'
};
