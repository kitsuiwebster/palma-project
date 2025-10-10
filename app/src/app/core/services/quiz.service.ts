import { Injectable } from '@angular/core';
import { BehaviorSubject, map, of, switchMap, Observable } from 'rxjs';
import { PalmTrait } from '../models/palm-trait.model';
import { 
  QuizQuestion, 
  QuizSession, 
  QuizConfig, 
  QuestionType,
  QuestionCategory,
  QuestionTemplate,
  QuizAnswer
} from '../models/quiz.model';
import { DataService } from './data.service';
import { RegionCodesService } from './region-codes.service';

@Injectable({
  providedIn: 'root'
})
export class QuizService {
  private currentSessionSubject = new BehaviorSubject<QuizSession | null>(null);
  public currentSession$ = this.currentSessionSubject.asObservable();

  private questionTemplates: QuestionTemplate[] = [
    // Identification questions
    {
      template: "What is the genus of {species}?",
      type: QuestionType.MULTIPLE_CHOICE,
      category: QuestionCategory.IDENTIFICATION,
      dataFields: ['SpecName', 'accGenus']
    },
    {
      template: "Which species belongs to the genus {genus}?",
      type: QuestionType.MULTIPLE_CHOICE,
      category: QuestionCategory.IDENTIFICATION,
      dataFields: ['accGenus', 'SpecName']
    },
    
    // Geography questions
    {
      template: "Where is {species} native to?",
      type: QuestionType.MULTIPLE_CHOICE,
      category: QuestionCategory.GEOGRAPHY,
      dataFields: ['SpecName', 'NativeRegion']
    },
    {
      template: "Which palm species is native to {region}?",
      type: QuestionType.MULTIPLE_CHOICE,
      category: QuestionCategory.GEOGRAPHY,
      dataFields: ['NativeRegion', 'SpecName']
    },
    
    // Morphology questions
    {
      template: "What is the maximum height of {species}?",
      type: QuestionType.MULTIPLE_CHOICE,
      category: QuestionCategory.MORPHOLOGY,
      dataFields: ['SpecName', 'MaxStemHeight_m']
    },
    {
      template: "Which palm can grow up to {height}m tall?",
      type: QuestionType.MULTIPLE_CHOICE,
      category: QuestionCategory.MORPHOLOGY,
      dataFields: ['MaxStemHeight_m', 'SpecName']
    },
    
    // Taxonomy questions
    {
      template: "What tribe does {species} belong to?",
      type: QuestionType.MULTIPLE_CHOICE,
      category: QuestionCategory.TAXONOMY,
      dataFields: ['SpecName', 'PalmTribe']
    },
    {
      template: "What subfamily does {genus} belong to?",
      type: QuestionType.MULTIPLE_CHOICE,
      category: QuestionCategory.TAXONOMY,
      dataFields: ['accGenus', 'PalmSubfamily']
    },
    
    // Stems and growth form
    {
      template: "Is {species} a climbing palm?",
      type: QuestionType.TRUE_FALSE,
      category: QuestionCategory.STEMS,
      dataFields: ['SpecName', 'Climbing']
    },
    {
      template: "Does {species} have an armed stem?",
      type: QuestionType.TRUE_FALSE,
      category: QuestionCategory.STEMS,
      dataFields: ['SpecName', 'StemArmed']
    },
    
    // Habitat questions
    {
      template: "In what type of habitat does {species} typically grow?",
      type: QuestionType.MULTIPLE_CHOICE,
      category: QuestionCategory.HABITAT,
      dataFields: ['SpecName', 'UnderstoreyCanopy']
    },
    
    // Fruit questions
    {
      template: "What color are the fruits of {species}?",
      type: QuestionType.MULTIPLE_CHOICE,
      category: QuestionCategory.FRUITS,
      dataFields: ['SpecName', 'MainFruitColors']
    },
    {
      template: "What shape are the fruits of {species}?",
      type: QuestionType.MULTIPLE_CHOICE,
      category: QuestionCategory.FRUITS,
      dataFields: ['SpecName', 'FruitShape']
    },
    
    // Leaves questions
    {
      template: "What is the maximum number of leaves on {species}?",
      type: QuestionType.MULTIPLE_CHOICE,
      category: QuestionCategory.LEAVES,
      dataFields: ['SpecName', 'MaxLeafNumber']
    },
    {
      template: "Does {species} have armed leaves?",
      type: QuestionType.TRUE_FALSE,
      category: QuestionCategory.LEAVES,
      dataFields: ['SpecName', 'LeavesArmed']
    },
    
    // Image identification
    {
      template: "Which palm species is shown in this image?",
      type: QuestionType.IMAGE_IDENTIFICATION,
      category: QuestionCategory.IDENTIFICATION,
      requiresImage: true,
      dataFields: ['SpecName', 'Photos']
    }
  ];

  constructor(
    private dataService: DataService,
    private regionCodesService: RegionCodesService
  ) {}

  generateQuiz(config: QuizConfig): Observable<QuizSession> {
    return this.dataService.getAllPalms().pipe(
      switchMap(async palms => {
        const filteredPalms = this.filterPalmsForQuiz(palms);
        const questions = await this.generateQuestions(filteredPalms, config);
        
        const session: QuizSession = {
          id: this.generateSessionId(),
          startTime: new Date(),
          questions,
          answers: [],
          score: 0,
          totalQuestions: questions.length,
          category: config.categories.length === 1 ? config.categories[0] : undefined,
          completed: false
        };
        
        this.currentSessionSubject.next(session);
        return session;
      })
    );
  }

  private filterPalmsForQuiz(palms: PalmTrait[]): PalmTrait[] {
    return palms.filter(palm => {
      // Filter out palms without essential data
      return palm.SpecName && 
             palm.accGenus && 
             palm.NativeRegion &&
             palm.PalmTribe &&
             palm.PalmSubfamily;
    });
  }

  private async generateQuestions(palms: PalmTrait[], config: QuizConfig): Promise<QuizQuestion[]> {
    const questions: QuizQuestion[] = [];
    const usedSpecies = new Set<string>();
    
    // Filter templates based on config
    let availableTemplates = this.questionTemplates.filter(template => {
      const matchesCategory = config.categories.length === 0 || 
                             config.categories.includes(template.category);
      const imageRequired = template.requiresImage && !config.includeImages;
      
      return matchesCategory && !imageRequired;
    });

    for (let i = 0; i < config.numberOfQuestions && availableTemplates.length > 0; i++) {
      const template = availableTemplates[Math.floor(Math.random() * availableTemplates.length)];
      const palm = this.selectRandomPalm(palms, template, usedSpecies);
      
      if (palm) {
        const question = await this.createQuestionFromTemplate(template, palm, palms);
        if (question) {
          questions.push(question);
          usedSpecies.add(palm.SpecName);
        }
      }
    }

    return questions;
  }


  private selectRandomPalm(palms: PalmTrait[], template: QuestionTemplate, usedSpecies: Set<string>): PalmTrait | null {
    const eligiblePalms = palms.filter(palm => {
      if (usedSpecies.has(palm.SpecName)) return false;
      
      // Check if palm has all required data fields
      return template.dataFields.every(field => {
        const value = (palm as any)[field];
        return value !== undefined && value !== null && value !== '';
      });
    });

    if (eligiblePalms.length === 0) return null;
    return eligiblePalms[Math.floor(Math.random() * eligiblePalms.length)];
  }

  private async createQuestionFromTemplate(template: QuestionTemplate, palm: PalmTrait, allPalms: PalmTrait[]): Promise<QuizQuestion | null> {
    const questionId = this.generateQuestionId();
    
    try {
      switch (template.type) {
        case QuestionType.MULTIPLE_CHOICE:
          return await this.createMultipleChoiceQuestion(questionId, template, palm, allPalms);
        case QuestionType.TRUE_FALSE:
          return await this.createTrueFalseQuestion(questionId, template, palm);
        case QuestionType.IMAGE_IDENTIFICATION:
          return this.createImageIdentificationQuestion(questionId, template, palm, allPalms);
        default:
          return null;
      }
    } catch (error) {
      console.error('Error creating question:', error);
      return null;
    }
  }

  private async createMultipleChoiceQuestion(id: string, template: QuestionTemplate, palm: PalmTrait, allPalms: PalmTrait[]): Promise<QuizQuestion> {
    const question = await this.formatQuestionText(template.template, palm);
    const correctAnswer = await this.getCorrectAnswer(template, palm);
    const incorrectOptions = await this.generateIncorrectOptions(template, palm, allPalms, 3);
    const explanation = await this.generateExplanation(template, palm);
    
    const options = this.shuffleArray([correctAnswer, ...incorrectOptions]);
    
    return {
      id,
      type: template.type,
      question,
      options,
      correctAnswer,
      category: template.category,
      relatedSpecies: palm.SpecName,
      explanation
    };
  }

  private async createTrueFalseQuestion(id: string, template: QuestionTemplate, palm: PalmTrait): Promise<QuizQuestion> {
    const question = await this.formatQuestionText(template.template, palm);
    const correctAnswer = this.getTrueFalseAnswer(template, palm);
    const explanation = await this.generateExplanation(template, palm);
    
    return {
      id,
      type: template.type,
      question,
      options: ['True', 'False'],
      correctAnswer,
      category: template.category,
      relatedSpecies: palm.SpecName,
      explanation
    };
  }

  private createImageIdentificationQuestion(id: string, template: QuestionTemplate, palm: PalmTrait, allPalms: PalmTrait[]): QuizQuestion | null {
    const photos = palm.Photos;
    if (!photos || !photos.includes('http')) return null;
    
    const imageUrls = photos.split(' ').filter(url => url.startsWith('http'));
    if (imageUrls.length === 0) return null;
    
    const imageUrl = imageUrls[0];
    const correctAnswer = palm.SpecName;
    const incorrectOptions = this.generateIncorrectSpeciesNames(allPalms, palm, 3);
    const options = this.shuffleArray([correctAnswer, ...incorrectOptions]);
    
    return {
      id,
      type: template.type,
      question: template.template,
      options,
      correctAnswer,
      imageUrl,
      category: template.category,
      relatedSpecies: palm.SpecName,
      explanation: `This is ${correctAnswer}, a palm species belonging to the genus ${palm.accGenus}.`
    };
  }

  private async formatQuestionText(template: string, palm: PalmTrait): Promise<string> {
    const formattedRegion = await this.formatRegion(palm.NativeRegion);
    return template
      .replace('{species}', palm.SpecName)
      .replace('{genus}', palm.accGenus)
      .replace('{height}', palm.MaxStemHeight_m?.toString() || 'unknown')
      .replace('{region}', formattedRegion);
  }

  private async formatRegion(region: string): Promise<string> {
    // Convert region codes to readable names
    try {
      const convertedRegion = await this.regionCodesService.convertSubdivisionCodesToDisplay(region, false);
      return convertedRegion || region;
    } catch (error) {
      // Fallback to original region string if conversion fails
      return region;
    }
  }

  private async getCorrectAnswer(template: QuestionTemplate, palm: PalmTrait): Promise<string> {
    const field = template.dataFields[1]; // Usually the answer field
    const value = (palm as any)[field];
    
    if (field === 'NativeRegion') {
      return await this.formatRegion(value);
    }
    
    return value?.toString() || 'Unknown';
  }

  private getTrueFalseAnswer(template: QuestionTemplate, palm: PalmTrait): string {
    const field = template.dataFields[1];
    const value = (palm as any)[field];
    
    if (typeof value === 'number') {
      return value === 1 ? 'True' : 'False';
    }
    
    return value ? 'True' : 'False';
  }

  private async generateIncorrectOptions(template: QuestionTemplate, palm: PalmTrait, allPalms: PalmTrait[], count: number): Promise<string[]> {
    const field = template.dataFields[1];
    const correctValue = (palm as any)[field];
    const options = new Set<string>();
    
    // Get similar values from other palms
    const candidates = allPalms
      .filter(p => p.SpecName !== palm.SpecName)
      .map(p => (p as any)[field])
      .filter(v => v && v !== correctValue)
      .map(v => v.toString());
    
    // Add random candidates and convert if needed
    while (options.size < count && candidates.length > 0) {
      const randomIndex = Math.floor(Math.random() * candidates.length);
      let candidateValue = candidates[randomIndex];
      
      // Convert region codes to names if this is a region field
      if (field === 'NativeRegion') {
        candidateValue = await this.formatRegion(candidateValue);
      }
      
      options.add(candidateValue);
      candidates.splice(randomIndex, 1);
    }
    
    return Array.from(options);
  }

  private generateIncorrectSpeciesNames(allPalms: PalmTrait[], correctPalm: PalmTrait, count: number): string[] {
    const candidates = allPalms
      .filter(p => p.SpecName !== correctPalm.SpecName && p.accGenus !== correctPalm.accGenus)
      .map(p => p.SpecName);
    
    const options = new Set<string>();
    while (options.size < count && candidates.length > 0) {
      const randomIndex = Math.floor(Math.random() * candidates.length);
      options.add(candidates[randomIndex]);
      candidates.splice(randomIndex, 1);
    }
    
    return Array.from(options);
  }

  private async generateExplanation(template: QuestionTemplate, palm: PalmTrait): Promise<string> {
    switch (template.category) {
      case QuestionCategory.IDENTIFICATION:
        return `${palm.SpecName} belongs to the genus ${palm.accGenus} and the tribe ${palm.PalmTribe}.`;
      case QuestionCategory.GEOGRAPHY:
        const formattedRegion = await this.formatRegion(palm.NativeRegion);
        return `${palm.SpecName} is native to ${formattedRegion}.`;
      case QuestionCategory.MORPHOLOGY:
        return `${palm.SpecName} can reach a maximum height of ${palm.MaxStemHeight_m || 'unknown'} meters.`;
      case QuestionCategory.TAXONOMY:
        return `${palm.SpecName} belongs to the subfamily ${palm.PalmSubfamily} and tribe ${palm.PalmTribe}.`;
      default:
        return `${palm.SpecName} is a palm species from the genus ${palm.accGenus}.`;
    }
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private generateSessionId(): string {
    return 'quiz_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private generateQuestionId(): string {
    return 'q_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  submitAnswer(questionId: string, selectedAnswer: string, timeSpent: number): void {
    const currentSession = this.currentSessionSubject.value;
    if (!currentSession) return;

    const question = currentSession.questions.find(q => q.id === questionId);
    if (!question) return;

    const answer: QuizAnswer = {
      questionId,
      selectedAnswer,
      isCorrect: selectedAnswer === question.correctAnswer,
      timeSpent
    };

    currentSession.answers.push(answer);
    
    // Update score
    const correctAnswers = currentSession.answers.filter(a => a.isCorrect).length;
    currentSession.score = Math.round((correctAnswers / currentSession.totalQuestions) * 100);

    this.currentSessionSubject.next(currentSession);
  }

  completeQuiz(): void {
    const currentSession = this.currentSessionSubject.value;
    if (!currentSession) return;

    currentSession.endTime = new Date();
    currentSession.completed = true;

    this.currentSessionSubject.next(currentSession);
    this.saveQuizSession(currentSession);
  }

  private saveQuizSession(session: QuizSession): void {
    const savedSessions = JSON.parse(localStorage.getItem('quiz_sessions') || '[]');
    savedSessions.push(session);
    localStorage.setItem('quiz_sessions', JSON.stringify(savedSessions));
  }


  getCurrentSession(): QuizSession | null {
    return this.currentSessionSubject.value;
  }

  resetCurrentSession(): void {
    this.currentSessionSubject.next(null);
  }
}