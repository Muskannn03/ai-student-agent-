// ==========================================
// Tool Registry for Future Agent Execution
// ==========================================

import { AgentToolDefinition } from '../ai/agent-types';
import { AgentToolManager } from './tool-definition';

export const calculateGPATool: AgentToolDefinition = {
  name: 'calculate_gpa',
  description: 'Calculate cumulative or semester GPA given grades and credits',
  parameters: [
    { name: 'courseGrades', type: 'array', description: 'List of objects with grade points and credits', required: true },
  ],
  async execute(args) {
    return {
      success: true,
      result: { calculatedGPA: 3.85, coursesEvaluated: Array.isArray(args.courseGrades) ? args.courseGrades.length : 0 },
    };
  },
};

export const getUpcomingAssignmentsTool: AgentToolDefinition = {
  name: 'get_upcoming_assignments',
  description: 'Retrieve pending student assignments sorted by urgent due date',
  parameters: [
    { name: 'limit', type: 'number', description: 'Number of assignments to fetch', required: false },
  ],
  async execute(args) {
    return {
      success: true,
      result: { limit: args.limit || 5, message: 'Tool ready for DB integration' },
    };
  },
};

export const defaultToolManager = new AgentToolManager();
defaultToolManager.registerTool(calculateGPATool);
defaultToolManager.registerTool(getUpcomingAssignmentsTool);
