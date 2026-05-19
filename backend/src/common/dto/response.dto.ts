// 统一响应结构
export class ResponseDto<T = any> {
  code: number;
  message: string;
  data: T;

  constructor(code: number, message: string, data: T) {
    this.code = code;
    this.message = message;
    this.data = data;
  }

  // 成功响应
  static success<T>(data: T, message = 'success'): ResponseDto<T> {
    return new ResponseDto(0, message, data);
  }

  // 错误响应
  static error(code: number, message: string): ResponseDto<null> {
    return new ResponseDto(code, message, null);
  }
}

// 分页响应结构
export class PaginatedResponseDto<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;

  constructor(items: T[], total: number, page: number, pageSize: number) {
    this.items = items;
    this.total = total;
    this.page = page;
    this.pageSize = pageSize;
    this.totalPages = Math.ceil(total / pageSize);
  }
}

// 分页查询参数
export class PaginationDto {
  page: number = 1;
  pageSize: number = 10;

  get skip(): number {
    return (this.page - 1) * this.pageSize;
  }

  get take(): number {
    return this.pageSize;
  }
}
