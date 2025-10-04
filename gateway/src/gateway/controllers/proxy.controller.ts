import { Controller, All, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import axios, { AxiosRequestHeaders } from 'axios';
import { environment } from '../../environments';

@Controller()
export class ProxyController {
  @All('auth/*')
  async proxyAuth(@Req() req: Request, @Res() res: Response) {
    return this.forward(req, res, environment.services.authenticationBaseUrl, req.path.replace(/^\/auth/, ''));
  }

  @All('inventory/*')
  async proxyInventory(@Req() req: Request, @Res() res: Response) {
    return this.forward(req, res, environment.services.inventoryBaseUrl, req.path.replace(/^\/inventory/, ''));
  }

  @All('payment/*')
  async proxyPayment(@Req() req: Request, @Res() res: Response) {
    return this.forward(req, res, environment.services.paymentBaseUrl, req.path.replace(/^\/payment/, ''));
  }

  private async forward(req: Request, res: Response, baseUrl: string, path: string) {
    const url = `${baseUrl}${path}`;

    try {
      const headers: AxiosRequestHeaders = { ...req.headers } as AxiosRequestHeaders;
      delete headers.host;

      const response = await axios.request({
        url,
        method: req.method as any,
        headers,
        data: req.body,
        params: req.query,
        validateStatus: () => true,
      });

      res.status(response.status);
      for (const [key, value] of Object.entries(response.headers)) {
        if (key.toLowerCase() === 'transfer-encoding') continue;
        res.setHeader(key, Array.isArray(value) ? value.join(', ') : (value as string));
      }
      return res.send(response.data);
    } catch (error: any) {
      const status = error?.response?.status ?? 502;
      const data = error?.response?.data ?? { message: 'Bad Gateway' };
      return res.status(status).send(data);
    }
  }
}


