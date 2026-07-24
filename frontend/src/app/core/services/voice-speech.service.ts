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
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const text = finalTranscript || interimTranscript;
        if (text) {
          this.zone.run(() => {
            this.speechResult$.next({
              transcript: text,
              isFinal: !!finalTranscript
            });
          });
        }
      };

      this.recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        this.stopListening();
      };

      this.recognition.onend = () => {
        this.zone.run(() => {
          this.isListening = false;
          this.speechState$.next(false);
        });
      };
    }
  }

  isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  }

  startListening(): void {
    if (!this.recognition) {
      this.initRecognition();
    }
    if (this.recognition && !this.isListening) {
      try {
        this.recognition.start();
        this.isListening = true;
        this.speechState$.next(true);
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
      }
    }
  }

  stopListening(): void {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (err) {
        console.error('Error stopping recognition:', err);
      }
      this.isListening = false;
      this.speechState$.next(false);
    }
  }

  toggleListening(): void {
    if (this.isListening) {
      this.stopListening();
    } else {
      this.startListening();
    }
  }

  getSpeechResult(): Observable<SpeechResult> {
    return this.speechResult$.asObservable();
  }

  getSpeechState(): Observable<boolean> {
    return this.speechState$.asObservable();
  }
}
