import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { DatabaseService } from '../../database/database.service';
import { UidService } from '../../services/uid/uid.service';
import { UrlService } from './url.service';
import {
  generateUrlPayload,
  uid,
  host,
  generateUrlArray,
} from './__tests__/test-utils';

describe('UrlService', () => {
  let urlService: UrlService;
  let uidService: DeepMocked<UidService>;
  let configService: DeepMocked<ConfigService>;
  let databaseService: DeepMockProxy<DatabaseService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UrlService,
        {
          provide: UidService,
          useValue: createMock<UidService>(),
        },
        {
          provide: ConfigService,
          useValue: createMock<ConfigService>(),
        },
        {
          provide: DatabaseService,
          useValue: mockDeep<DatabaseService>(),
        },
      ],
    }).compile();

    const app = module.createNestApplication();

    urlService = module.get(UrlService);
    uidService = module.get(UidService);
    configService = module.get(ConfigService);
    databaseService = module.get(DatabaseService);
    configService.getOrThrow.mockReturnValue(host);
    await app.init();
  });

  it('should be defined', () => {
    expect(urlService).toBeDefined();
  });

  describe('create', () => {
    it('should create a new url', async () => {
      const payload = {
        redirect: 'https://airbnb.com',
        title: 'Airbnb',
      };

      const mockedUrl = generateUrlPayload({
        payload,
      });

      uidService.generate.mockReturnValueOnce(uid);
      databaseService.url.create.mockResolvedValueOnce(mockedUrl);
      const result = await urlService.create(payload);
      expect(result).toBe(mockedUrl);
    });

    it('should create a new url even when description is missing', async () => {
      const payload = {
        redirect: 'https://airbnb.com',
        title: 'Airbnb',
      };

      const mockedUrl = generateUrlPayload({
        payload,
        description: null,
      });

      uidService.generate.mockReturnValueOnce(uid);
      databaseService.url.create.mockResolvedValueOnce(mockedUrl);
      const result = await urlService.create(payload);
      expect(result).toBe(mockedUrl);
    });
  });

  describe(`findAll`, () => {
    it(`should return array of urls in data property`, async () => {
      const payload = {
        redirect: 'https://airbnb.com',
        title: 'Airbnb',
      };
      const response = [generateUrlPayload({ payload })];
      databaseService.url.findMany.mockResolvedValueOnce(response);
      databaseService.url.count.mockResolvedValueOnce(response.length);

      const url = await urlService.findAll({});

      expect(url.data).toEqual(response);
    });

    it(`should return empty array when no urls exist`, async () => {
      databaseService.url.findMany.mockResolvedValueOnce([]);
      databaseService.url.count.mockResolvedValueOnce(0);

      const url = await urlService.findAll({});

      expect(url.data).toEqual([]);
    });

    it(`should correctly indicate first page`, async () => {
      databaseService.url.findMany.mockResolvedValue(generateUrlArray());
      databaseService.url.count.mockResolvedValue(9);

      const getUrlsDto = {
        page: 1,
        limit: 3,
      };
      const result = await urlService.findAll(getUrlsDto);

      expect(result.meta).toEqual({
        totalCount: 9,
        currentPage: 1,
        perPage: 3,
        totalPages: 3,
        nextPage: `${host}/url?limit=3&page=2`,
        previousPage: null,
      });
    });

    it(`should correctly indicate middle page`, async () => {
      databaseService.url.findMany.mockResolvedValue(generateUrlArray());
      databaseService.url.count.mockResolvedValue(9);

      const getUrlsDto = {
        page: 2,
        limit: 3,
      };
      const result = await urlService.findAll(getUrlsDto);

      expect(result.meta).toEqual({
        totalCount: 9,
        currentPage: 2,
        perPage: 3,
        totalPages: 3,
        nextPage: `${host}/url?limit=3&page=3`,
        previousPage: `${host}/url?limit=3&page=1`,
      });
    });

    it(`should correctly indicate last page`, async () => {
      databaseService.url.findMany.mockResolvedValue(generateUrlArray());
      databaseService.url.count.mockResolvedValue(9);

      const getUrlsDto = {
        page: 3,
        limit: 3,
      };
      const result = await urlService.findAll(getUrlsDto);

      expect(result.meta).toEqual({
        totalCount: 9,
        currentPage: 3,
        perPage: 3,
        totalPages: 3,
        nextPage: null,
        previousPage: `${host}/url?limit=3&page=2`,
      });
    });
  });
  describe(`findOne`, () => {
    it(`should return respective url record`, async () => {
      // Arrange
      const uidLookup = uid;
      const payload = generateUrlPayload({
        payload: { title: 'test', redirect: 'https://google.com' },
      });
      databaseService.url.findUnique.mockResolvedValueOnce(
        payload.url === `${host}/${uidLookup}` ? payload : null,
      );

      // Act
      const url = await urlService.findOne(uidLookup);

      // Asserts
      expect(url).toEqual(payload);
    });

    it(`should return null when url record not found`, async () => {
      // Arrange
      const uidLookup = `random url`;
      const payload = generateUrlPayload({
        payload: { title: 'test', redirect: 'https://google.com' },
      });
      databaseService.url.findUnique.mockResolvedValueOnce(
        payload.url === `${host}/${uidLookup}` ? payload : null,
      );

      // Act
      const url = await urlService.findOne(uidLookup);

      // Asserts
      expect(url).toEqual(null);
    });
  });

  describe(`update`, () => {
    it(`should return respective updated url record`, async () => {
      // Arrange
      const original = generateUrlPayload({
        payload: { title: 'test', redirect: 'https://google.com' },
      });
      const updatePayload = { title: `updated title` };
      const payload = { ...original, ...updatePayload };
      const id = payload.id;
      databaseService.url.update.mockResolvedValueOnce(payload);

      // Act
      const url = await urlService.update(id, updatePayload);

      // Asserts
      expect(url).toEqual(payload);
    });
  });

  describe(`remove`, () => {
    it(`should return removed url record`, async () => {
      // Arrange
      const payload = generateUrlPayload({
        payload: { title: 'test', redirect: 'https://google.com' },
      });
      const id = payload.id;
      databaseService.url.delete.mockResolvedValueOnce(payload);

      // Act
      const url = await urlService.remove(id);

      // Asserts
      expect(url).toEqual(payload);
    });
  });
});
