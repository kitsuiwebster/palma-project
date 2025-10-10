// Quiz models for palm quiz functionality

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  imageUrl?: string;
  category: QuestionCategory;
  relatedSpecies?: string;
}

export interface QuizAnswer {
  questionId: string;
  selectedAnswer: string;
  isCorrect: boolean;
  timeSpent: number; // in milliseconds
}

export interface QuizSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  questions: QuizQuestion[];
  answers: QuizAnswer[];
  score: number;
  totalQuestions: number;
  category?: QuestionCategory;
  completed: boolean;
}


export interface QuizConfig {
  numberOfQuestions: number;
  categories: QuestionCategory[];
  includeImages: boolean;
  timeLimit?: number; // in seconds
}

export enum QuestionType {
  MULTIPLE_CHOICE = 'multiple_choice',
  TRUE_FALSE = 'true_false',
  IMAGE_IDENTIFICATION = 'image_identification',
  FILL_IN_BLANK = 'fill_in_blank',
  COMPARISON = 'comparison'
}


export enum QuestionCategory {
  IDENTIFICATION = 'identification',
  GEOGRAPHY = 'geography',
  MORPHOLOGY = 'morphology',
  TAXONOMY = 'taxonomy',
  ECOLOGY = 'ecology',
  FRUITS = 'fruits',
  LEAVES = 'leaves',
  STEMS = 'stems',
  HABITAT = 'habitat',
  COMMON_NAMES = 'common_names'
}

export interface QuestionTemplate {
  template: string;
  type: QuestionType;
  category: QuestionCategory;
  requiresImage?: boolean;
  dataFields: string[]; // PalmTrait fields needed for this question
}