import type { InterviewSet } from '../api/interviews';
import { MOCK_TECH_INTERVIEWS } from './mockInterviewsTech';
import { MOCK_NURSING_INTERVIEWS } from './mockInterviewsNursing';
import { MOCK_ACADEMIC_INTERVIEWS } from './mockInterviewsAcademic';

export const MOCK_INTERVIEW_SETS: InterviewSet[] = [
  ...MOCK_TECH_INTERVIEWS,
  ...MOCK_NURSING_INTERVIEWS,
  ...MOCK_ACADEMIC_INTERVIEWS,
];
