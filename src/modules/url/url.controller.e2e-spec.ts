import * as request from 'supertest';
import { server, app } from '../../../test/setup';
import { createManyUrls, host } from './__tests__/test-utils';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../../database/database.service';

describe('UrlController E2E Tests', () => {
  let configService: ConfigService;
  let databaseService: DatabaseService;
  let apiKey: string;

  beforeAll(async () => {
    configService = app.get(ConfigService);
    databaseService = app.get(DatabaseService);
    apiKey = configService.getOrThrow(`apiKey`);
  });
  describe('POST /url', () => {
    it('should return 401 if no API key is not provided', async () => {
      await request(server).post('/url').expect(401);
    });
    it('should return 401 if no API key is invalid', async () => {
      await request(server).post('/url').set('x-api-key', 'SECRET').expect(401);
    });
    it('should return 400 if JSON body payload is empty', async () => {
      await request(server)
        .post('/url')
        .set('x-api-key', 'programistafrontend')
        .expect(400);
    });
    it('should return 400 if JSON body payload is invalid', async () => {
      await request(server)
        .post('/url')
        .send({
          redirect: 'invalid url',
          title: 'Test',
          description: 'Description',
        })
        .set('x-api-key', 'programistafrontend')
        .expect(400);
    });
    it('should return 201 if the api key is valid and JSON body is valid', async () => {
      await request(server)
        .post('/url')
        .send({
          redirect: 'https://airbnb.com',
          title: 'Test',
          description: 'Description',
        })
        .set('x-api-key', 'programistafrontend')
        .expect(201)
        .expect(({ body }) => {
          const { data } = body;
          expect(data.redirect).toEqual('https://airbnb.com');
          expect(data.title).toEqual('Test');
          expect(data.description).toEqual('Description');
          expect(data).toHaveProperty('id');
          expect(data).toHaveProperty('url');
          expect(data).toHaveProperty('createdAt');
          expect(data).toHaveProperty('updatedAt');
        });
    });
  });
  describe(`GET /url`, () => {
    it(`should return an empty list when no URLs exist`, async () => {
      await request(server)
        .get(`/url`)
        .set('x-api-key', apiKey)
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toEqual([]);
          expect(res.body.meta).toEqual({
            totalCount: 0,
            currentPage: 1,
            totalPages: 0,
            nextPage: null,
            perPage: 20,
            previousPage: null,
          });
        });
    });

    it(`should return a list of URLs when they exist`, async () => {
      // Pre-create URLs in the database
      const mockedUrlsPayload = createManyUrls();
      await databaseService.url.createMany({
        data: mockedUrlsPayload,
      });

      await request(server)
        .get(`/url`)
        .expect(200)
        .set('x-api-key', apiKey)
        .expect((res) => {
          expect(res.body.data).toHaveLength(3); // Assuming 3 URLs were pre-created
          res.body.data.forEach((url: any) => {
            expect(url).toHaveProperty('id');
            expect(url).toHaveProperty('title');
            expect(url).toHaveProperty('redirect');
          });
          expect(res.body.meta).toEqual({
            totalCount: 3,
            currentPage: 1,
            totalPages: 1,
            nextPage: null,
            perPage: 20,
            previousPage: null,
          });
        });
    });
    it(`should return a filtered list of URLs when they exist`, async () => {
      // Pre-create URLs in the database
      const mockedUrlsPayload = createManyUrls();
      await databaseService.url.createMany({
        data: mockedUrlsPayload,
      });

      await request(server)
        .get(`/url?filter=Google`)
        .expect(200)
        .set('x-api-key', apiKey)
        .expect((res) => {
          expect(res.body.data).toHaveLength(1); // Assuming 3 URLs were pre-created
          res.body.data.forEach((url: any) => {
            expect(url).toHaveProperty('id');
            expect(url).toHaveProperty('title');
            expect(url).toHaveProperty('redirect');
          });
          expect(res.body.meta).toEqual({
            totalCount: 3,
            currentPage: 1,
            perPage: 20,
            totalPages: 1,
            nextPage: null,
            previousPage: null,
          });
        });
    });
    it(`using limit query parameter should impact pagination`, async () => {
      // Pre-create URLs in the database
      const mockedUrlsPayload = createManyUrls();
      await databaseService.url.createMany({
        data: mockedUrlsPayload,
      });

      await request(server)
        .get(`/url?limit=2`)
        .expect(200)
        .set('x-api-key', apiKey)
        .expect((res) => {
          expect(res.body.data).toHaveLength(2);
          res.body.data.forEach((url: any) => {
            expect(url).toHaveProperty('id');
            expect(url).toHaveProperty('title');
            expect(url).toHaveProperty('redirect');
          });
          expect(res.body.meta).toEqual({
            totalCount: 3,
            currentPage: 1,
            perPage: 2,
            totalPages: 2,
            nextPage: `${host}/url?limit=2&page=2`,
            previousPage: null,
          });
        });
    });
  });
});
