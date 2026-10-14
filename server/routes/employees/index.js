/**
 * server/routes/employees/index.js
 * Router agregator untuk seluruh endpoint domain employee.
 */

import express from 'express';
import { registerEmployeeCrudRoutes } from './employeeCrudRoutes.js';
import { registerEmployeePinRoutes } from './employeePinRoutes.js';

export const setupEmployeeRoutes = (deps) => {
  const router = express.Router();
  registerEmployeeCrudRoutes(router, deps);
  registerEmployeePinRoutes(router, deps);
  return router;
};

export default setupEmployeeRoutes;
