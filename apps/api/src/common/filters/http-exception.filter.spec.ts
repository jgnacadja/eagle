import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common'
import { HttpExceptionFilter } from './http-exception.filter'

function makeHost(url: string) {
  const mockResponse = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn()
  }
  const mockRequest = { url }
  return {
    host: {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest
      })
    } as unknown as ArgumentsHost,
    mockResponse
  }
}

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter

  beforeEach(() => {
    filter = new HttpExceptionFilter()
  })

  it('sends structured error response for string exception', () => {
    const { host, mockResponse } = makeHost('/test')
    filter.catch(new HttpException('Not found', HttpStatus.NOT_FOUND), host)

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND)
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 404, message: 'Not found', path: '/test' })
    )
  })

  it('extracts message from object exception response', () => {
    const { host, mockResponse } = makeHost('/test')
    filter.catch(new HttpException({ message: 'Validation failed' }, HttpStatus.BAD_REQUEST), host)

    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 400, message: 'Validation failed' })
    )
  })
})
