import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ResponseDto } from '../dto/response.dto';

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ResponseDto<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ResponseDto<T>> {
    return next.handle().pipe(
      map((data) => {
        // 如果已经是 ResponseDto 格式，直接返回
        if (data instanceof ResponseDto) {
          return data;
        }

        // 如果返回的数据包含自定义 message
        if (data && typeof data === 'object' && 'message' in data && 'data' in data) {
          return ResponseDto.success(data.data, data.message);
        }

        // 默认包装为成功响应
        return ResponseDto.success(data);
      }),
    );
  }
}
