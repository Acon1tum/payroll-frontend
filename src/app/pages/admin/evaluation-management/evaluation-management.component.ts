import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../../shared/header/header.component';
import { SidebarComponent } from '../../../shared/sidebar/sidebar.component';
import { EvaluationService, EvaluationForm, CreateEvaluationFormRequest } from '../../../services/evaluation.service';

// Supported question types
type QuestionType = 'multipleChoice' | 'text' | 'rating' | 'checkbox' | 'date';

interface Breadcrumb {
  label: string;
  path?: string;
  active?: boolean;
}

@Component({
  selector: 'app-evaluation-management',
  templateUrl: './evaluation-management.component.html',
  styleUrls: ['./evaluation-management.component.scss'],
  standalone: true,
  imports: [FormsModule, CommonModule, HeaderComponent, SidebarComponent]
})
export class EvaluationManagementComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Breadcrumbs for header
  breadcrumbs: Breadcrumb[] = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Evaluation Management', active: true }
  ];
  
  evaluationForms: EvaluationForm[] = [];
  loading = false;
  error = '';
  successMessage = '';
  errorMessage = '';
  
  // Search & pagination
  searchTerm = '';
  filteredEvaluationForms: EvaluationForm[] = [];
  paginatedEvaluationForms: EvaluationForm[] = [];
  currentPage = 1;
  itemsPerPage = 5;
  itemsPerPageOptions = [5, 10, 15, 20];
  totalItems = 0;
  totalPages = 0;
  Math = Math;
  private searchTimeout: any;
  
  // Date input fields bound to <input type="date">
  startDateInput: string = '';
  endDateInput: string = '';
  
  // Form creation/editing
  showCreateForm = false;
  showEditForm = false;
  editingForm: EvaluationForm | null = null;
  // View/Responses modal states
  showViewForm = false;
  showResponses = false;
  selectedForm: EvaluationForm | null = null;
  
  // Form data
  formData: CreateEvaluationFormRequest = {
    title: '',
    description: '',
    isActive: true,
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    questions: [],
    targetEmployeeIds: []
  };
  
  // Question management
  currentQuestion: {
    questionText: string;
    questionType: QuestionType;
    isRequired: boolean;
    order: number;
    options: Array<{ optionText: string; score: number; order: number }>;
  } = {
    questionText: '',
    questionType: 'multipleChoice',
    isRequired: false,
    order: 1,
    options: [{ optionText: '', score: 0, order: 1 }]
  };
  
  // UI state to highlight and scroll to newly added question
  recentlyAddedQuestionIndex: number | null = null;
  
  // Types that require options
  private readonly optionBasedTypes: Array<QuestionType> = ['multipleChoice', 'rating', 'checkbox'];
  
  questionTypes: Array<{ value: QuestionType; label: string }> = [
    { value: 'multipleChoice', label: 'Multiple Choice' },
    { value: 'text', label: 'Text Input' },
    { value: 'rating', label: 'Rating Scale' },
    { value: 'checkbox', label: 'Checkbox' },
    { value: 'date', label: 'Date Picker' }
  ];

  constructor(
    private evaluationService: EvaluationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadEvaluationForms();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadEvaluationForms(): void {
    this.loading = true;
    this.error = '';
    
    this.evaluationService.getAllEvaluationForms()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (forms) => {
          this.evaluationForms = forms || [];
          this.filteredEvaluationForms = [...this.evaluationForms];
          this.updatePagination();
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Failed to load evaluation forms';
          this.errorMessage = 'Failed to load evaluation forms. Please try again.';
          this.loading = false;
          console.error('Error loading forms:', err);
        }
      });
  }

  openCreateForm(): void {
    this.showCreateForm = true;
    this.resetFormData();
  }

  openEditForm(form: EvaluationForm): void {
    this.editingForm = form;
    this.formData = {
      title: form.title,
      description: form.description,
      isActive: form.isActive,
      startDate: new Date(form.startDate),
      endDate: new Date(form.endDate),
      questions: form.questions || [],
      targetEmployeeIds: form.targets?.map(t => t.employeeId) || []
    };
    // Set input strings for date controls
    this.startDateInput = this.formatDateForInput(this.formData.startDate);
    this.endDateInput = this.formatDateForInput(this.formData.endDate);
    this.showEditForm = true;
  }

  closeForms(): void {
    this.showCreateForm = false;
    this.showEditForm = false;
    this.showViewForm = false;
    this.showResponses = false;
    this.editingForm = null;
    this.selectedForm = null;
    this.resetFormData();
  }

  resetFormData(): void {
    this.formData = {
      title: '',
      description: '',
      isActive: true,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      questions: [],
      targetEmployeeIds: []
    };
    // Initialize date input strings
    this.startDateInput = this.formatDateForInput(this.formData.startDate);
    this.endDateInput = this.formatDateForInput(this.formData.endDate);
    this.currentQuestion = {
      questionText: '',
      questionType: 'multipleChoice',
      isRequired: false,
      order: 1,
      options: [{ optionText: '', score: 0, order: 1 }]
    };
  }

  addQuestion(): void {
    if (!this.currentQuestion.questionText.trim()) {
      this.errorMessage = 'Question text is required';
      return;
    }

    // Prepare options if needed
    let preparedOptions = this.currentQuestion.options || [];
    if (this.optionBasedTypes.includes(this.currentQuestion.questionType)) {
      // keep only non-empty option texts
      preparedOptions = preparedOptions
        .map((opt, idx) => ({ optionText: (opt.optionText || '').trim(), score: opt.score ?? 0, order: idx + 1 }))
        .filter((opt) => opt.optionText.length > 0);

      if (preparedOptions.length === 0) {
        this.errorMessage = 'Please add at least one option for this question';
        return;
      }
    } else {
      preparedOptions = [];
    }

    const question = {
      questionText: this.currentQuestion.questionText.trim(),
      questionType: this.currentQuestion.questionType,
      isRequired: this.currentQuestion.isRequired,
      order: this.formData.questions.length + 1,
      options: preparedOptions
    };

    this.formData.questions.push(question);
    const newIndex = this.formData.questions.length - 1;
    this.recentlyAddedQuestionIndex = newIndex;
    // Smooth scroll to the newly added question
    setTimeout(() => {
      const el = document.getElementById(`question-item-${newIndex}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 0);
    // Remove highlight after a short delay
    setTimeout(() => {
      this.recentlyAddedQuestionIndex = null;
    }, 2000);
    
    // Reset current question
    this.currentQuestion = {
      questionText: '',
      questionType: 'multipleChoice',
      isRequired: false,
      order: this.formData.questions.length + 1,
      options: [{ optionText: '', score: 0, order: 1 }]
    };
    this.errorMessage = '';
  }

  removeQuestion(index: number): void {
    this.formData.questions.splice(index, 1);
    // Reorder questions
    this.formData.questions.forEach((q, i) => {
      q.order = i + 1;
    });
  }

  addOption(): void {
    this.currentQuestion.options.push({
      optionText: '',
      score: 0,
      order: this.currentQuestion.options.length + 1
    });
  }

  removeOption(index: number): void {
    this.currentQuestion.options.splice(index, 1);
    // Reorder options
    this.currentQuestion.options.forEach((opt, i) => {
      opt.order = i + 1;
    });
  }

  onQuestionTypeChange(): void {
    const type = this.currentQuestion.questionType;
    if (type === 'rating') {
      // Generate default 1-5 rating options
      this.currentQuestion.options = Array.from({ length: 5 }, (_, i) => ({
        optionText: `${i + 1}`,
        score: i + 1,
        order: i + 1
      }));
    } else if (type === 'multipleChoice' || type === 'checkbox') {
      // Ensure at least one blank option for user to fill in
      if (!this.currentQuestion.options || this.currentQuestion.options.length === 0) {
        this.currentQuestion.options = [{ optionText: '', score: 0, order: 1 }];
      }
    } else {
      // text/date types: no options
      this.currentQuestion.options = [];
    }
  }

  submitForm(): void {
    // Map date input strings back to Date objects
    if (this.startDateInput) {
      this.formData.startDate = this.parseInputDate(this.startDateInput);
    }
    if (this.endDateInput) {
      this.formData.endDate = this.parseInputDate(this.endDateInput);
    }

    if (!this.validateForm()) {
      return;
    }

    this.loading = true;
    
    if (this.showEditForm && this.editingForm) {
      this.evaluationService.updateEvaluationForm(this.editingForm.id, this.formData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loading = false;
            this.successMessage = 'Evaluation form updated successfully!';
            this.closeForms();
            this.loadEvaluationForms();
          },
          error: (err) => {
            this.loading = false;
            this.error = 'Failed to update evaluation form';
            this.errorMessage = 'Failed to update evaluation form. Please try again.';
            console.error('Error updating form:', err);
          }
        });
    } else {
      this.evaluationService.createEvaluationForm(this.formData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loading = false;
            this.successMessage = 'Evaluation form created successfully!';
            this.closeForms();
            this.loadEvaluationForms();
          },
          error: (err) => {
            this.loading = false;
            this.error = 'Failed to create evaluation form';
            this.errorMessage = 'Failed to create evaluation form. Please try again.';
            console.error('Error creating form:', err);
          }
        });
    }
  }

  validateForm(): boolean {
    if (!this.formData.title.trim()) {
      this.error = 'Form title is required';
      return false;
    }
    
    if (!this.formData.description.trim()) {
      this.error = 'Form description is required';
      return false;
    }
    
    if (this.formData.startDate >= this.formData.endDate) {
      this.error = 'End date must be after start date';
      return false;
    }
    
    if (this.formData.questions.length === 0) {
      this.error = 'At least one question is required';
      return false;
    }
    
    this.error = '';
    return true;
  }

  deleteForm(formId: string): void {
    if (confirm('Are you sure you want to delete this evaluation form? This action cannot be undone.')) {
      this.evaluationService.deleteEvaluationForm(formId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loadEvaluationForms();
          },
          error: (err) => {
            this.error = 'Failed to delete evaluation form';
            console.error('Error deleting form:', err);
          }
        });
    }
  }

  viewFormDetails(form: EvaluationForm): void {
    this.router.navigate(['/admin/evaluation', form.id]);
  }

  viewResponses(form: EvaluationForm): void {
    this.router.navigate(['/admin/evaluation', form.id, 'responses']);
  }

  getQuestionTypeLabel(type: string): string {
    return this.evaluationService.getQuestionTypeLabel(type);
  }

  getFormStatus(form: EvaluationForm): string {
    const now = new Date();
    const startDate = new Date(form.startDate);
    const endDate = new Date(form.endDate);
    
    if (!form.isActive) {
      return 'Inactive';
    }
    
    if (now < startDate) {
      return 'Pending';
    }
    
    if (now > endDate) {
      return 'Expired';
    }
    
    return 'Active';
  }

  getFormStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'Active': 'success',
      'Pending': 'warning',
      'Expired': 'danger',
      'Inactive': 'secondary'
    };
    return colors[status] || 'secondary';
  }

  getResponseCount(form: EvaluationForm): number {
    return form.responses?.length || 0;
  }

  getCompletionRate(form: EvaluationForm): number {
    if (!form.targets || form.targets.length === 0) {
      return 0;
    }
    
    const totalTargets = form.targets.length;
    const completedResponses = form.responses?.filter(r => 
      r.status === 'submitted' || r.status === 'reviewed' || r.status === 'approved' || r.status === 'rejected'
    ).length || 0;
    
    return Math.round((completedResponses / totalTargets) * 100);
  }

  // Search & pagination helpers
  onSearchInput(): void {
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.searchForms();
    }, 300);
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.searchForms();
  }

  get hasSearchResults(): boolean {
    return this.filteredEvaluationForms.length > 0;
  }

  get searchResultCount(): number {
    return this.filteredEvaluationForms.length;
  }

  private searchForms(): void {
    const term = (this.searchTerm || '').toLowerCase().trim();
    if (!term) {
      this.filteredEvaluationForms = [...this.evaluationForms];
    } else {
      this.filteredEvaluationForms = this.evaluationForms.filter(f =>
        (f.title && f.title.toLowerCase().includes(term)) ||
        (f.description && f.description.toLowerCase().includes(term))
      );
    }
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalItems = this.filteredEvaluationForms.length;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage) || 1;
    if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedEvaluationForms = this.filteredEvaluationForms.slice(startIndex, endIndex);
  }

  onItemsPerPageChange(): void {
    this.currentPage = 1;
    this.updatePagination();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  goToFirstPage(): void { this.goToPage(1); }
  goToLastPage(): void { this.goToPage(this.totalPages); }
  goToPreviousPage(): void { this.goToPage(this.currentPage - 1); }
  goToNextPage(): void { this.goToPage(this.currentPage + 1); }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    if (this.totalPages <= maxVisible) {
      for (let i = 1; i <= this.totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
      let end = Math.min(this.totalPages, start + maxVisible - 1);
      if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
      for (let i = start; i <= end; i++) pages.push(i);
    }
    return pages;
  }

  // Modal backdrop click to close
  onModalBackdropClick(event: Event) {
    if (event.target === event.currentTarget) {
      this.closeForms();
    }
  }

  // View details modal
  openViewForm(form: EvaluationForm): void {
    // if form lacks relations, fetch details
    if (!form.questions || !form.targets || !form.responses) {
      this.loading = true;
      this.evaluationService.getEvaluationFormById(form.id).pipe(takeUntil(this.destroy$)).subscribe({
        next: (full) => {
          this.selectedForm = full;
          this.showViewForm = true;
          this.loading = false;
        },
        error: () => {
          this.selectedForm = form;
          this.showViewForm = true;
          this.loading = false;
        }
      });
    } else {
      this.selectedForm = form;
      this.showViewForm = true;
    }
  }

  // Responses modal
  openResponses(form: EvaluationForm): void {
    this.loading = true;
    this.evaluationService.getEvaluationFormById(form.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (full) => {
        this.selectedForm = full;
        this.showResponses = true;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load responses', err);
        this.loading = false;
      }
    });
  }

  // Helpers for date input formatting/parsing
  private pad2(n: number): string {
    return n < 10 ? `0${n}` : `${n}`;
  }

  private formatDateForInput(date: Date): string {
    const d = new Date(date);
    const yyyy = d.getFullYear();
    const mm = this.pad2(d.getMonth() + 1);
    const dd = this.pad2(d.getDate());
    return `${yyyy}-${mm}-${dd}`;
  }

  private parseInputDate(value: string): Date {
    // value expected as YYYY-MM-DD
    const [y, m, d] = value.split('-').map((v) => Number(v));
    return new Date(y, (m || 1) - 1, d || 1);
  }
}
