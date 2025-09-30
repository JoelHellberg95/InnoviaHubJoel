import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '../core/app-config.service';

export interface OpenAICompletionRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  max_tokens?: number;
  temperature?: number;
}

export interface OpenAICompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class OpenAIService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(AppConfigService);
  // Use your backend API instead of calling OpenAI directly (avoids CORS issues)
  private readonly baseUrl = `${this.config.apiUrl}/api/openai`;

  createCompletion(request: OpenAICompletionRequest): Observable<OpenAICompletionResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
      // No need for Authorization header - backend will handle OpenAI API key
    });

    return this.http.post<OpenAICompletionResponse>(
      `${this.baseUrl}/chat/completions`,
      request,
      { headers }
    );
  }

  // Helper method for simple text completion
  simpleCompletion(prompt: string, systemMessage?: string): Observable<OpenAICompletionResponse> {
    const messages = [];
    
    if (systemMessage) {
      messages.push({ role: 'system' as const, content: systemMessage });
    }
    
    messages.push({ role: 'user' as const, content: prompt });

    const request: OpenAICompletionRequest = {
      model: 'gpt-3.5-turbo',
      messages,
      max_tokens: 150,
      temperature: 0.7
    };

    return this.createCompletion(request);
  }
}