import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environment/environment';

export interface EvaluationForm {
  id: string;
  title: string;
  description: string;
  isActive: boolean;
  startDate: Date;
  endDate: Date;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  questions?: EvaluationQuestion[];
  targets?: EvaluationFormTarget[];
  responses?: EvaluationResponse[];
}

export interface EvaluationQuestion {
  id: string;
  formId: string;
  questionText: string;
  questionType: 'multipleChoice' | 'text' | 'rating' | 'checkbox' | 'date';
  isRequired: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  options?: EvaluationQuestionOption[];
}

export interface EvaluationQuestionOption {
  id: string;
  questionId: string;
  optionText: string;
  score?: number;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface EvaluationFormTarget {
  id: string;
  formId: string;
  employeeId: string;
  assignedAt: Date;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    employeeNumber: string;
  };
}

export interface EvaluationResponse {
  id: string;
  formId: string;
  employeeId: string;
  status: 'draft' | 'submitted' | 'reviewed' | 'approved' | 'rejected';
  totalScore?: number;
  maxPossibleScore?: number;
  feedback?: string;
  submittedAt?: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  createdAt: Date;
  updatedAt: Date;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    employeeNumber: string;
  };
  answers?: EvaluationAnswer[];
}

export interface EvaluationAnswer {
  id: string;
  responseId: string;
  questionId: string;
  answerText?: string;
  selectedOptionId?: string;
  ratingValue?: number;
  checkboxValues?: string[];
  dateValue?: Date;
  createdAt: Date;
  updatedAt: Date;
  question?: EvaluationQuestion;
  selectedOption?: EvaluationQuestionOption;
}

export interface CreateEvaluationFormRequest {
  title: string;
  description: string;
  isActive: boolean;
  startDate: Date;
  endDate: Date;
  questions: CreateQuestionRequest[];
  targetEmployeeIds: string[];
}

export interface CreateQuestionRequest {
  questionText: string;
  questionType: 'multipleChoice' | 'text' | 'rating' | 'checkbox' | 'date';
  isRequired: boolean;
  order: number;
  options?: CreateOptionRequest[];
}

export interface CreateOptionRequest {
  optionText: string;
  score?: number;
  order: number;
}

export interface SubmitEvaluationResponseRequest {
  formId: string;
  answers: SubmitAnswerRequest[];
}

export interface SubmitAnswerRequest {
  questionId: string;
  answerText?: string;
  selectedOptionId?: string;
  ratingValue?: number;
  checkboxValues?: string[];
  dateValue?: Date;
}

export interface EvaluationAnalytics {
  totalForms: number;
  totalResponses: number;
  averageScore: number;
  completionRate: number;
  formBreakdown: {
    formId: string;
    title: string;
    responseCount: number;
    averageScore: number;
    completionRate: number;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class EvaluationService {
  private apiUrl = `${environment.apiUrl}/evaluation`;

  constructor(private http: HttpClient) {}

  // Evaluation Forms
  createEvaluationForm(request: CreateEvaluationFormRequest): Observable<EvaluationForm> {
    return this.http.post<{ message: string; data: EvaluationForm }>(`${this.apiUrl}/forms`, request)
      .pipe(map((res) => res.data));
  }

  getAllEvaluationForms(): Observable<EvaluationForm[]> {
    return this.http.get<{ data: EvaluationForm[]; pagination: any }>(`${this.apiUrl}/forms`)
      .pipe(map((res) => res.data));
  }

  getEvaluationFormById(formId: string): Observable<EvaluationForm> {
    return this.http.get<{ data: EvaluationForm }>(`${this.apiUrl}/forms/${formId}`)
      .pipe(map((res) => res.data));
  }

  updateEvaluationForm(formId: string, request: Partial<CreateEvaluationFormRequest>): Observable<EvaluationForm> {
    return this.http.put<{ message: string; data: EvaluationForm }>(`${this.apiUrl}/forms/${formId}`, request)
      .pipe(map((res) => res.data));
  }

  deleteEvaluationForm(formId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/forms/${formId}`);
  }

  // Questions (placeholders if backend supports these endpoints)
  addQuestionToForm(formId: string, question: CreateQuestionRequest): Observable<EvaluationQuestion> {
    return this.http.post<{ data: EvaluationQuestion }>(`${this.apiUrl}/forms/${formId}/questions`, question)
      .pipe(map((res) => res.data));
  }

  updateQuestion(questionId: string, question: Partial<CreateQuestionRequest>): Observable<EvaluationQuestion> {
    return this.http.put<{ data: EvaluationQuestion }>(`${this.apiUrl}/questions/${questionId}`, question)
      .pipe(map((res) => res.data));
  }

  deleteQuestion(questionId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/questions/${questionId}`);
  }

  // Form Targets (placeholders)
  assignFormToEmployees(formId: string, employeeIds: string[]): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/forms/${formId}/assign`, { employeeIds });
  }

  removeFormFromEmployee(formId: string, employeeId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/forms/${formId}/assign/${employeeId}`);
  }

  // Employee Responses
  getEmployeeEvaluationForms(employeeId: string): Observable<EvaluationForm[]> {
    return this.http.get<{ data: EvaluationForm[] }>(`${this.apiUrl}/employee/${employeeId}/forms`)
      .pipe(map((res) => res.data));
  }

  getEmployeeFormResponse(employeeId: string, formId: string): Observable<EvaluationResponse | null> {
    return this.http.get<{ data: EvaluationResponse | null }>(`${this.apiUrl}/employee/${employeeId}/forms/${formId}/response`)
      .pipe(map((res) => res.data));
  }

  submitEvaluationResponse(request: SubmitEvaluationResponseRequest): Observable<EvaluationResponse> {
    return this.http.post<{ message: string; data: EvaluationResponse }>(`${this.apiUrl}/responses`, request)
      .pipe(map((res) => res.data));
  }

  updateEvaluationResponse(responseId: string, request: Partial<SubmitEvaluationResponseRequest>): Observable<EvaluationResponse> {
    return this.http.put<{ message: string; data: EvaluationResponse }>(`${this.apiUrl}/responses/${responseId}`, request)
      .pipe(map((res) => res.data));
  }

  // Admin/HR Management (placeholder)
  getAllEvaluationResponses(params?: {
    formId?: string;
    employeeId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Observable<{ responses: EvaluationResponse[]; total: number }> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key as keyof typeof params] !== undefined) {
          httpParams = httpParams.set(key, params[key as keyof typeof params]!.toString());
        }
      });
    }
    return this.http.get<{ responses: EvaluationResponse[]; total: number }>(`${this.apiUrl}/responses`, { params: httpParams });
  }

  reviewEvaluationResponse(responseId: string, review: {
    status: 'approved' | 'rejected';
    feedback?: string;
  }): Observable<EvaluationResponse> {
    return this.http.put<{ data: EvaluationResponse }>(`${this.apiUrl}/responses/${responseId}/review`, review)
      .pipe(map((res) => res.data));
  }

  // Analytics
  getEvaluationAnalytics(params?: {
    startDate?: Date;
    endDate?: Date;
    formId?: string;
  }): Observable<EvaluationAnalytics> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key as keyof typeof params] !== undefined) {
          const value = params[key as keyof typeof params];
          if (value instanceof Date) {
            httpParams = httpParams.set(key, value.toISOString());
          } else {
            httpParams = httpParams.set(key, value!.toString());
          }
        }
      });
    }
    return this.http.get<{ data: EvaluationAnalytics }>(`${this.apiUrl}/analytics`, { params: httpParams })
      .pipe(map((res) => res.data));
  }

  // Utility Methods
  getQuestionTypeLabel(questionType: string): string {
    const labels: { [key: string]: string } = {
      multipleChoice: 'Multiple Choice',
      text: 'Text Input',
      rating: 'Rating Scale',
      checkbox: 'Checkbox',
      date: 'Date Picker'
    };
    return labels[questionType] || questionType;
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      draft: 'Draft',
      submitted: 'Submitted',
      reviewed: 'Reviewed',
      approved: 'Approved',
      rejected: 'Rejected'
    };
    return labels[status] || status;
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      draft: 'warning',
      submitted: 'info',
      reviewed: 'primary',
      approved: 'success',
      rejected: 'danger'
    };
    return colors[status] || 'secondary';
  }

  calculateFormProgress(form: EvaluationForm, employeeId: string): number {
    if (!form.responses) return 0;
    
    const employeeResponse = form.responses.find(r => r.employeeId === employeeId);
    if (!employeeResponse) return 0;
    
    if (employeeResponse.status === 'submitted' || 
        employeeResponse.status === 'reviewed' || 
        employeeResponse.status === 'approved' || 
        employeeResponse.status === 'rejected') {
      return 100;
    }
    
    if (employeeResponse.status === 'draft') {
      return 50; // Assuming draft means partially completed
    }
    
    return 0;
  }
}
