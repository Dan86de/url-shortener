import { app } from '../../../test/setup';
import { UrlService } from './url.service';
import { DatabaseService } from '../../database/database.service';
import { createManyUrls, host } from './__tests__/test-utils';

describe('UrlService Integration Tests', () => {
  let urlService: UrlService;
  let databaseService: DatabaseService;

  beforeEach(() => {
    urlService = app.get<UrlService>(UrlService);
    databaseService = app.get<DatabaseService>(DatabaseService);
  });

  describe('create', () => {
    it('should create a new url', async () => {
      const payload = {
        redirect: 'https://google.com',
        title: 'Google',
      };
      const url = await urlService.create(payload);
      const persistedUrl = await databaseService.url.findUnique({
        where: {
          url: url.url,
        },
      });

      expect(url).toEqual(persistedUrl);
    });
  });

  describe(`findAll`, () => {
    it(`should return empty array when no urls exist in database`, async () => {
      const response = await urlService.findAll({});

      expect(response.data).toEqual([]);
    });

    // TODO:fix this test
    it.skip(`should return array of persisted urls`, async () => {
      const mockedUrlsPayload = createManyUrls();
      await databaseService.url.createMany({
        data: mockedUrlsPayload,
      });
      const urls = await databaseService.url.findMany();

      const response = await urlService.findAll({});

      console.log(response.data);

      expect(response.data).toEqual(urls);
    });

    it(`should paginate results and show 1st page`, async () => {
      const mockedUrlsPayload = createManyUrls();
      await databaseService.url.createMany({
        data: mockedUrlsPayload,
      });
      const totalCount = await databaseService.url.count();
      const limit = 1;
      const page = 1;

      const response = await urlService.findAll({ page, limit });

      expect(response.meta).toEqual({
        totalCount,
        currentPage: page,
        perPage: limit,
        totalPages: 3,
        nextPage: `${host}/url?limit=1&page=2`,
        previousPage: null,
      });
    });

    it(`should paginate results and show middle page`, async () => {
      const mockedUrlsPayload = createManyUrls();
      await databaseService.url.createMany({
        data: mockedUrlsPayload,
      });
      const totalCount = await databaseService.url.count();
      const limit = 1;
      const page = 2;

      const response = await urlService.findAll({ page, limit });

      expect(response.meta).toEqual({
        totalCount,
        currentPage: page,
        perPage: limit,
        totalPages: 3,
        nextPage: `${host}/url?limit=1&page=3`,
        previousPage: `${host}/url?limit=1&page=1`,
      });
    });

    it(`should paginate results and show last page`, async () => {
      const mockedUrlsPayload = createManyUrls();
      await databaseService.url.createMany({
        data: mockedUrlsPayload,
      });
      const totalCount = await databaseService.url.count();
      const limit = 1;
      const page = 3;

      const response = await urlService.findAll({ page, limit });

      expect(response.meta).toEqual({
        totalCount,
        currentPage: page,
        perPage: limit,
        totalPages: 3,
        nextPage: null,
        previousPage: `${host}/url?limit=1&page=2`,
      });
    });
  });
});
