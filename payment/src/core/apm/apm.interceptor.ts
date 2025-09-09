import { Injectable, CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { tap, catchError } from 'rxjs/operators';
import { ApiLogCollectingService } from './api-log-collecting.service';
import { ApmService } from './apm.service';
import { Observable } from 'rxjs';

@Injectable()
export class ApmInterceptor implements NestInterceptor {
  constructor(
    private readonly apmService: ApmService,
    private readonly apiLogCollectingService: ApiLogCollectingService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> {
    const startTime = Date.now();

    return next.handle().pipe(
      tap((data) => {
        try {
          this.apiLogCollectingService.collectLog(context, data, null, startTime);
        } catch (e) {
          // intentionally ignored
        }
      }),
      catchError((error) => {
        try {
          this.apiLogCollectingService.collectLog(context, null, error, startTime);
          this.apmService.captureError(error);
        } catch (e) {
          // intentionally ignored
        }
        throw error;
      }),
    );
  }
}
