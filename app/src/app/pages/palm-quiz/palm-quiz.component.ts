import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { QuizService } from '../../core/services/quiz.service';
import { 
  QuizSession, 
  QuizQuestion, 
  QuizConfig, 
  QuestionCategory
} from '../../core/models/quiz.model';
import { Title, Meta } from '@angular/platform-browser';

@Component({
  selector: 'app-palm-quiz',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './palm-quiz.component.html',
  styleUrls: ['./palm-quiz.component.scss']
})
export class PalmQuizComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Quiz state
  currentSession: QuizSession | null = null;
  currentQuestionIndex = 0;
  selectedAnswer = '';
  showExplanation = false;
  isAnswered = false;
  quizStarted = false;
  quizCompleted = false;
  questionStartTime = 0;
  timeRemaining = 0;
  timer?: any;
  
  // Configuration
  quizConfig: QuizConfig = {
    numberOfQuestions: 10,
    categories: [],
    includeImages: true,
    timeLimit: undefined
  };
  
  
  // UI state
  isLoading = false;
  
  // Enums for template
  QuestionCategory = QuestionCategory;
  
  categories = [
    { value: QuestionCategory.IDENTIFICATION, label: 'Species Identification', icon: '🌴' },
    { value: QuestionCategory.GEOGRAPHY, label: 'Geographic Distribution', icon: '🌍' },
    { value: QuestionCategory.MORPHOLOGY, label: 'Morphology & Size', icon: '📏' },
    { value: QuestionCategory.TAXONOMY, label: 'Taxonomy', icon: '🔬' },
    { value: QuestionCategory.STEMS, label: 'Stems & Growth Form', icon: '🌿' },
    { value: QuestionCategory.LEAVES, label: 'Leaves & Foliage', icon: '🍃' },
    { value: QuestionCategory.FRUITS, label: 'Fruits & Seeds', icon: '🥥' },
    { value: QuestionCategory.HABITAT, label: 'Habitat & Ecology', icon: '🏞️' }
  ];

  constructor(
    private quizService: QuizService,
    public router: Router,
    private titleService: Title,
    private metaService: Meta
  ) {}

  ngOnInit(): void {
    this.titleService.setTitle('Palm Quiz - Test Your Knowledge - Palm Encyclopedia');
    this.metaService.updateTag({
      name: 'description',
      content: 'Test your knowledge of palm species with our interactive quiz. Learn about palm identification, geography, morphology, and taxonomy.'
    });
    
    // Subscribe to quiz session updates
    this.quizService.currentSession$
      .pipe(takeUntil(this.destroy$))
      .subscribe(session => {
        this.currentSession = session;
        if (session && !this.quizStarted) {
          this.startQuiz();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.clearTimer();
  }


  onCategoryChange(category: QuestionCategory, checked: boolean): void {
    if (checked) {
      if (!this.quizConfig.categories.includes(category)) {
        this.quizConfig.categories.push(category);
      }
    } else {
      this.quizConfig.categories = this.quizConfig.categories.filter(c => c !== category);
    }
  }

  isCategorySelected(category: QuestionCategory): boolean {
    return this.quizConfig.categories.includes(category);
  }

  generateQuiz(): void {
    if (this.isLoading) return;
    
    this.isLoading = true;
    this.quizService.generateQuiz(this.quizConfig).subscribe({
      next: (session: any) => {
        this.currentSession = session;
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error generating quiz:', error);
        this.isLoading = false;
      }
    });
  }

  startQuiz(): void {
    if (!this.currentSession) return;
    
    this.quizStarted = true;
    this.currentQuestionIndex = 0;
    this.resetQuestionState();
    this.startQuestionTimer();
    
    // Scroll to top when quiz starts
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  }

  getCurrentQuestion(): QuizQuestion | null {
    if (!this.currentSession || !this.currentSession.questions) return null;
    return this.currentSession.questions[this.currentQuestionIndex] || null;
  }

  selectAnswer(answer: string): void {
    if (this.isAnswered) return;
    
    this.selectedAnswer = answer;
    this.isAnswered = true;
    this.showExplanation = true;
    
    const timeSpent = Date.now() - this.questionStartTime;
    const currentQuestion = this.getCurrentQuestion();
    
    if (currentQuestion) {
      this.quizService.submitAnswer(currentQuestion.id, answer, timeSpent);
    }
    
    this.clearTimer();
  }

  nextQuestion(): void {
    if (!this.currentSession) return;
    
    if (this.currentQuestionIndex < this.currentSession.questions.length - 1) {
      this.currentQuestionIndex++;
      this.resetQuestionState();
      this.startQuestionTimer();
    } else {
      this.completeQuiz();
    }
  }

  completeQuiz(): void {
    this.quizService.completeQuiz();
    this.quizCompleted = true;
    this.quizStarted = false;
    this.clearTimer();
    
    // Scroll to top when quiz completes
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  }

  quitQuiz(): void {
    if (confirm('Are you sure you want to quit this quiz? Your progress will be lost.')) {
      this.resetQuiz();
    }
  }

  resetQuiz(): void {
    this.quizService.resetCurrentSession();
    this.currentSession = null;
    this.currentQuestionIndex = 0;
    this.quizStarted = false;
    this.quizCompleted = false;
    this.resetQuestionState();
    this.clearTimer();
    
    // Scroll to top when resetting
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  }

  private resetQuestionState(): void {
    this.selectedAnswer = '';
    this.showExplanation = false;
    this.isAnswered = false;
    this.questionStartTime = Date.now();
    this.timeRemaining = this.quizConfig.timeLimit || 0;
  }

  private startQuestionTimer(): void {
    if (!this.quizConfig.timeLimit) return;
    
    this.timeRemaining = this.quizConfig.timeLimit;
    this.timer = setInterval(() => {
      this.timeRemaining--;
      if (this.timeRemaining <= 0) {
        this.timeUp();
      }
    }, 1000);
  }

  private timeUp(): void {
    if (!this.isAnswered) {
      this.selectedAnswer = '';
      this.isAnswered = true;
      this.showExplanation = true;
      
      const currentQuestion = this.getCurrentQuestion();
      if (currentQuestion) {
        this.quizService.submitAnswer(currentQuestion.id, '', this.quizConfig.timeLimit! * 1000);
      }
    }
    this.clearTimer();
  }

  private clearTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  getProgressPercentage(): number {
    if (!this.currentSession) return 0;
    return ((this.currentQuestionIndex + 1) / this.currentSession.questions.length) * 100;
  }

  getScoreColor(score: number): string {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'danger';
  }


  getCategoryIcon(category: QuestionCategory): string {
    const categoryConfig = this.categories.find(c => c.value === category);
    return categoryConfig?.icon || '🌴';
  }


  getCorrectAnswersCount(): number {
    if (!this.currentSession) return 0;
    return this.currentSession.answers.filter(a => a.isCorrect).length;
  }

  getIncorrectAnswersCount(): number {
    if (!this.currentSession) return 0;
    return this.currentSession.answers.filter(a => !a.isCorrect).length;
  }

  goToSpeciesDetail(speciesName: string): void {
    if (!speciesName) return;
    
    // Convert species name to slug format
    const slug = speciesName.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    
    this.router.navigate(['/palms', slug]);
  }

  retryQuiz(): void {
    this.resetQuiz();
  }

  shareResults(): void {
    if (!this.currentSession) return;
    
    const text = `I just scored ${this.currentSession.score}% on a Palm Quiz! 🌴 Test your knowledge at`;
    const url = window.location.origin + '/quiz';
    
    if (navigator.share) {
      navigator.share({
        title: 'Palm Quiz Results',
        text: text,
        url: url
      });
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(`${text} ${url}`);
      // You could show a toast notification here
    }
  }

  formatTime(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  }
}