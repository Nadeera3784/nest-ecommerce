import { Injectable, HttpException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import type { AxiosResponse } from 'axios';
import { RabbitMqConfig } from '../rabbit-mq.config';

/**
 * REST client for interacting with RabbitMQ Management HTTP API.
 * Matches the surface described in rest.client.d.ts
 */
@Injectable()
export class RestClient {
  private readonly baseUrl: string;
  private readonly auth?: { username: string; password: string };

  constructor(
    private readonly config: RabbitMqConfig,
    private readonly httpService: HttpService
  ) {
    this.baseUrl = (this.config as any).baseUrl?.replace(/\/$/, '') ?? '';
    if (!this.baseUrl) {
      throw new Error('RabbitMqConfig.baseUrl is required');
    }
    // Optional basic auth
    const { username, password } = (this.config as any) || {};
    if (username && password) {
      this.auth = { username, password };
    }
  }

  /**
   * Return routing keys (binding names) from an exchange to a queue.
   */
  async getQueueBindings(exchangeName: string, queueName: string): Promise<string[]> {
    const vhost = this.getVHostName();
    const url = `${this.baseUrl}/api/bindings/${encodeURIComponent(vhost)}/e/${encodeURIComponent(exchangeName)}/q/${encodeURIComponent(queueName)}`;

    try {
      const res: AxiosResponse<any[]> = await lastValueFrom(
        this.httpService.get<any[]>(url, { auth: this.auth })
      );
      // Each binding contains routing_key; return those
      return (res.data || []).map(b => b.routing_key).filter((x: any) => typeof x === 'string');
    } catch (err: any) {
      // Normalize error
      const status = err?.response?.status ?? 500;
      const message = err?.response?.data ?? err?.message ?? 'Failed to fetch queue bindings';
      throw new HttpException(message, status);
    }
  }

  /**
   * Remove a specific binding from exchange -> queue by its binding (routing) key.
   * RabbitMQ requires the binding's properties_key to delete, so we fetch the binding first.
   */
  async removeQueueBinding(exchangeName: string, queueName: string, bindingName: string): Promise<void> {
    const vhost = this.getVHostName();
    const listUrl = `${this.baseUrl}/api/bindings/${encodeURIComponent(vhost)}/e/${encodeURIComponent(exchangeName)}/q/${encodeURIComponent(queueName)}`;

    try {
      const res: AxiosResponse<any[]> = await lastValueFrom(
        this.httpService.get<any[]>(listUrl, { auth: this.auth })
      );
      const match = (res.data || []).find(b => b?.routing_key === bindingName);
      if (!match || !match.properties_key) {
        // If it's already gone, treat as success
        return;
      }

      const deleteUrl = `${this.baseUrl}/api/bindings/${encodeURIComponent(vhost)}/e/${encodeURIComponent(exchangeName)}/q/${encodeURIComponent(queueName)}/${encodeURIComponent(match.properties_key)}`;

      await lastValueFrom(this.httpService.delete<void>(deleteUrl, { auth: this.auth }));
    } catch (err: any) {
      const status = err?.response?.status ?? 500;
      const message = err?.response?.data ?? err?.message ?? 'Failed to remove queue binding';
      throw new HttpException(message, status);
    }
  }

  // Encode special vhost names. RabbitMQ uses '/' for default vhost, which must be URL-encoded.
  private getVHostName(): string {
    const vhost = (this.config as any).vhost ?? '/';
    return vhost;
  }
}
