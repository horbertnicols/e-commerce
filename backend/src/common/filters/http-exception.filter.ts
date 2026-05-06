import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ResponseDto } from '../dto/response.dto';

// 业务异常类
export class BusinessException extends HttpException {
  constructor(code: number, message: string) {
    super({ code, message }, HttpStatus.OK);
  }
}

// 错误码定义
export const ErrorCode = {
  // 通用错误 1000-1999
  SYSTEM_ERROR: 1000,
  PARAM_ERROR: 1001,
  NOT_FOUND: 1002,
  FORBIDDEN: 1003,

  // 认证错误 2000-2999
  UNAUTHORIZED: 2000,
  TOKEN_EXPIRED: 2001,
  TOKEN_INVALID: 2002,
  USER_NOT_FOUND: 2003,
  PASSWORD_ERROR: 2004,
  USER_EXISTS: 2005,

  // 商品错误 3000-3999
  PRODUCT_NOT_FOUND: 3000,
  PRODUCT_OFFLINE: 3001,
  STOCK_NOT_ENOUGH: 3002,

  // 购物车错误 4000-4999
  CART_ITEM_NOT_FOUND: 4000,

  // 订单错误 5000-5999
  ORDER_NOT_FOUND: 5000,
  ORDER_STATUS_ERROR: 5001,
  ORDER_CANNOT_CANCEL: 5002,

  // 支付错误 6000-6999
  PAYMENT_FAILED: 6000,
  PAYMENT_NOT_FOUND: 6001,
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = ErrorCode.SYSTEM_ERROR;
    let message = '系统内部错误';

    if (exception instanceof BusinessException) {
      // 业务异常
      status = HttpStatus.OK;
      const exceptionResponse = exception.getResponse() as {
        code: number;
        message: string;
      };
      code = exceptionResponse.code;
      message = exceptionResponse.message;
    } else if (exception instanceof HttpException) {
      // HTTP 异常
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const res = exceptionResponse as Record<string, unknown>;
        message = (res.message as string) || exception.message;

        // class-validator 验证错误
        if (Array.isArray(res.message)) {
          message = res.message[0];
        }
      } else {
        message = exceptionResponse as string;
      }

      // 映射 HTTP 状态码到业务错误码
      switch (status) {
        case HttpStatus.UNAUTHORIZED:
          code = ErrorCode.UNAUTHORIZED;
          break;
        case HttpStatus.FORBIDDEN:
          code = ErrorCode.FORBIDDEN;
          break;
        case HttpStatus.NOT_FOUND:
          code = ErrorCode.NOT_FOUND;
          break;
        case HttpStatus.BAD_REQUEST:
          code = ErrorCode.PARAM_ERROR;
          break;
        default:
          code = ErrorCode.SYSTEM_ERROR;
      }
    } else if (exception instanceof Error) {
      // 其他错误
      message = exception.message;
      this.logger.error(
        `Unhandled error: ${exception.message}`,
        exception.stack,
      );
    }

    // 记录错误日志
    this.logger.error(
      `[${request.method}] ${request.url} - ${code}: ${message}`,
    );

    // 返回统一格式
    const errorResponse = ResponseDto.error(code, message);
    response.status(status === HttpStatus.OK ? HttpStatus.OK : status).json(errorResponse);
  }
}
