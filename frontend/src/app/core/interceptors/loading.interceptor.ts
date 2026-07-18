import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { LoadingService } from '../services/loading.service';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(LoadingService);

  // Skip loading spinner for background/real-time calls to keep UX smooth
  const isBackgroundRequest = req.url.includes('/auth/me') || 
                              req.url.includes('/auth/captcha') || 
                              req.url.includes('/chatbot');

  if (!isBackgroundRequest) {
    loadingService.show(req.method, req.url);
  }

  return next(req).pipe(
    finalize(() => {
      if (!isBackgroundRequest) {
        loadingService.hide(req.method, req.url);
      }
    })
  );
};
