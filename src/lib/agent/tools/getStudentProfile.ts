// ==========================================
// Tool: getStudentProfile
// Retrieves the current student's profile and academic information from PostgreSQL
// ==========================================

import {
  AgentTool,
  AgentContext,
  GetStudentProfileInput,
  GetStudentProfileOutput,
} from '../types';
import { prisma } from '@/lib/prisma';

/**
 * Validates input for getStudentProfile tool at runtime.
 * Strictly ignores any client/model-supplied parameters to prevent parameter tampering.
 */
export function validateGetStudentProfileInput(_rawInput: any): GetStudentProfileInput {
  return {};
}

export const getStudentProfileTool: AgentTool<GetStudentProfileInput, GetStudentProfileOutput> = {
  name: 'getStudentProfile',
  description:
    "Retrieve the current student's profile and academic information from PostgreSQL (such as student name, ID, enrolled course, department/college, semester, and skills).",
  parameters: {
    type: 'object',
    properties: {},
  },
  execute: async (_rawInput: GetStudentProfileInput, context: AgentContext): Promise<GetStudentProfileOutput> => {
    // 1. Runtime validation (always empty object)
    validateGetStudentProfileInput(_rawInput);

    // 2. Enforce verified server-side userId from context (Never accept client-supplied userId)
    const userId = context.userId;
    if (!userId || typeof userId !== 'string' || !userId.trim()) {
      throw new Error('Security Exception: Verified userId in AgentContext is required to retrieve student profile.');
    }

    // 3. Query PostgreSQL using explicit select to exclude passwords, hashes, and internal secrets
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          studentProfile: {
            select: {
              college: true,
              course: true,
              semester: true,
              skills: true,
              careerGoals: true,
            },
          },
        },
      });

      if (!user) {
        return {
          found: false,
          profile: null,
          message: 'Student profile could not be found.',
        };
      }

      // 4. Return safe, structured profile fields
      return {
        found: true,
        profile: {
          id: user.id,
          studentId: user.id,
          name: user.name,
          email: user.email,
          college: user.studentProfile?.college ?? null,
          department: user.studentProfile?.college ?? null,
          course: user.studentProfile?.course ?? null,
          semester: user.studentProfile?.semester ?? null,
          skills: user.studentProfile?.skills ?? [],
          careerGoals: user.studentProfile?.careerGoals ?? null,
        },
      };
    } catch (dbError: any) {
      console.error('[TOOL:getStudentProfile] Database retrieval error:', dbError?.message || dbError);
      throw new Error('Failed to retrieve student profile from database.');
    }
  },
};
