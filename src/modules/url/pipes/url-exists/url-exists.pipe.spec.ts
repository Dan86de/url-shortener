import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { UrlService } from '../../url.service';
import { UrlExistsPipe } from './url-exists.pipe';
import { Url } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';

describe('UrlExistsPipe', () => {
  let urlExistPipe: UrlExistsPipe;
  let urlService: DeepMocked<UrlService>;

  beforeEach(() => {
    urlService = createMock<UrlService>();
    urlExistPipe = new UrlExistsPipe(urlService);
    urlService.onModuleInit();
  });

  it('should be defined', () => {
    expect(urlExistPipe).toBeDefined();
  });

  it('should return the url object if its found', async () => {
    const url: Url = {
      id: 'some-uuid',
      redirect: 'https://airbnb.com',
      title: 'Airbnb',
      description: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      url: 'localhost:3000/random-uid',
    };
    urlService.findOne.mockResolvedValueOnce(url);
    const result = await urlExistPipe.transform('random-uid');
    expect(result).toEqual(url);
  });

  it('should return exception when no url is found', async () => {
    urlService.findOne.mockResolvedValueOnce(null);
    const result = () => urlExistPipe.transform('random-uid');
    expect(result).rejects.toThrow(NotFoundException);
  });
});
