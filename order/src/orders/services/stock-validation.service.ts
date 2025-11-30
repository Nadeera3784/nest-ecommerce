import { Injectable, Logger } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { StockValidationResponse } from "../interfaces/stock-validation.interface";

@Injectable()
export class StockValidationService {
  private readonly logger = new Logger(StockValidationService.name);
  private readonly pendingRequests = new Map<
    string,
    {
      resolve: (value: StockValidationResponse) => void;
      reject: (reason: Error) => void;
      timeout: NodeJS.Timeout;
    }
  >();

  constructor(private readonly eventEmitter: EventEmitter2) {
    this.eventEmitter.on(
      "stock.validation.response",
      this.handleResponse.bind(this),
    );
  }

  async waitForResponse(
    requestId: string,
    timeoutMs = 30000,
  ): Promise<StockValidationResponse> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error(`Stock validation request ${requestId} timed out`));
      }, timeoutMs);

      this.pendingRequests.set(requestId, { resolve, reject, timeout });
      this.logger.debug(`Waiting for stock validation response: ${requestId}`);
    });
  }

  handleResponse(response: StockValidationResponse): void {
    const pending = this.pendingRequests.get(response.requestId);
    if (pending) {
      clearTimeout(pending.timeout);
      this.pendingRequests.delete(response.requestId);
      pending.resolve(response);
      this.logger.debug(
        `Received stock validation response: ${response.requestId}, isValid: ${response.isValid}`,
      );
    } else {
      this.logger.warn(
        `Received stock validation response for unknown request: ${response.requestId}`,
      );
    }
  }
}
