import { ConfigService } from '@nestjs/config';
import { AuthGuard } from './auth.guard';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';

const testApiKey = 'SECRET';

describe('AuthGuard', () => {
  let authGuard: AuthGuard;
  let configService: DeepMocked<ConfigService>;

  beforeEach(() => {
    configService = createMock<ConfigService>();
    configService.getOrThrow.mockReturnValue(testApiKey);
    authGuard = new AuthGuard(configService);
    authGuard.onModuleInit();
  });

  it('should be defined', () => {
    expect(authGuard).toBeDefined();
  });

  it('returns true when api key matches server apiKey', () => {
    const mockedExecutionContext = createMock<ExecutionContext>({
      switchToHttp: () => ({
        getRequest: () => ({ headers: { 'x-api-key': testApiKey } }),
      }),
    });
    const result = authGuard.canActivate(mockedExecutionContext);
    expect(result).toBe(true);
  });

  it.skip('returns false when api key is ommitted', () => {
    const mockedExecutionContext = createMock<ExecutionContext>({
      switchToHttp: () => ({
        getRequest: () => ({ headers: {} }),
      }),
    });
    const result = () => authGuard.canActivate(mockedExecutionContext);
    expect(result).toThrow(UnauthorizedException);
  });

  it.skip('returns false when api key is invalid', () => {
    const mockedExecutionContext = createMock<ExecutionContext>({
      switchToHttp: () => ({
        getRequest: () => ({ headers: { 'x-api-key': 'someinvalid' } }),
      }),
    });
    const result = () => authGuard.canActivate(mockedExecutionContext);
    expect(result).toThrow(UnauthorizedException);
  });
});
