import { Injectable, NgZone } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export interface SpeechResult {
  transcript: string;
  isFinal: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class VoiceSpeechService {
  private recognition: any;
  private isListening = false;
  private speechResult$ = new Subject<SpeechResult>();
  private speechState$ = new Subject<boolean>();
  private accumulatedFinalText = '';

  constructor(private zone: NgZone) {
    this.initRecognition();
  }

  private initRecognition(): void {
    if (typeof window === 'undefined') return;

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRec) {
      this.recognition = new SpeechRec();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event: any) => {
        let currentSessionText = '';
        let isFinalSegment = false;

        for (let i = 0; i < event.results.length; ++i) {
          currentSessionText += event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            isFinalSegment = true;
          }
        }

        const combinedText = (this.accumulatedFinalText ? (this.accumulatedFinalText + ' ') : '') + currentSessionText;

        this.zone.run(() => {
          this.speechResult$.next({
            transcript: combinedText.replace(/\s+/g, ' ').trim(),
            isFinal: isFinalSegment
          });
        });
      };

      this.recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'no-speech' || event.error === 'network') {
          return;
        }
        this.stopListening();
      };

      this.recognition.onend = () => {
        this.zone.run(() => {
          if (this.isListening) {
            try {
              this.recognition.start();
            } catch {
              this.isListening = false;
              this.speechState$.next(false);
            }
          } else {
            this.speechState$.next(false);
          }
        });
      };
    }
  }

  isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  }

  startListening(initialExistingText: string = ''): void {
    this.accumulatedFinalText = initialExistingText.trim();
    if (!this.recognition) {
      this.initRecognition();
    }
    if (this.recognition && !this.isListening) {
      try {
        this.isListening = true;
        this.speechState$.next(true);
        this.recognition.start();
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
      }
    }
  }

  stopListening(): void {
    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (err) {
        console.error('Error stopping recognition:', err);
      }
      this.speechState$.next(false);
    }
  }

  toggleListening(initialExistingText: string = ''): void {
    if (this.isListening) {
      this.stopListening();
    } else {
      this.startListening(initialExistingText);
    }
  }

  getSpeechResult(): Observable<SpeechResult> {
    return this.speechResult$.asObservable();
  }

  getSpeechState(): Observable<boolean> {
    return this.speechState$.asObservable();
  }
}
