import { Injectable } from '@nestjs/common';
import { CreateUrlDto } from './dto/create-url.dto';
import { UpdateUrlDto } from './dto/update-url.dto';
import { UidService } from '../../services/uid/uid.service';
import { DatabaseService } from '../../database/database.service';
import { ConfigService } from '@nestjs/config';
import { GetUrlsDto } from './dto/get-urls.dto';

@Injectable()
export class UrlService {
  private host: string;
  constructor(
    public readonly uidService: UidService,
    public readonly dbService: DatabaseService,
    public readonly configService: ConfigService,
  ) {}
  onModuleInit() {
    this.host = this.configService.getOrThrow<string>('host');
  }
  async create(createUrlDto: CreateUrlDto) {
    const { redirect, title, description } = createUrlDto;
    const randomId = this.uidService.generate(5);
    return this.dbService.url.create({
      data: {
        url: `${this.host}/${randomId}`,
        redirect,
        title,
        description,
      },
    });
  }

  async findAll({ filter, page = 1, limit = 20 }: GetUrlsDto) {
    const whereClause = filter
      ? {
          OR: [
            {
              title: { search: filter },
            },
            { description: { search: filter } },
            { redirect: { search: filter } },
          ],
        }
      : {};
    const skip = (page - 1) * limit;
    const data = await this.dbService.url.findMany({
      where: whereClause,
      skip: skip,
      take: limit,
    });

    const totalCount = await this.dbService.url.count();

    let baseUrl = `${this.host}/url?limit=${limit}`;
    if (filter) {
      baseUrl += `&filter=${encodeURIComponent(filter)}`;
    }

    const totalPages = Math.ceil(totalCount / limit);
    const nextPage = page < totalPages ? `${baseUrl}&page=${page + 1}` : null;
    const previousPage = page > 1 ? `${baseUrl}&page=${page - 1}` : null;

    // TODO: think about total count logic
    const meta = {
      totalCount: totalCount,
      currentPage: page,
      perPage: limit,
      totalPages: totalPages,
      nextPage,
      previousPage,
    };

    return {
      data,
      meta,
    };
  }

  async findOne(uid: string) {
    return await this.dbService.url.findUnique({
      where: {
        url: `${this.host}/${uid}`,
      },
    });
  }

  async update(id: string, updateUrlDto: UpdateUrlDto) {
    return await this.dbService.url.update({
      where: {
        id,
      },
      data: updateUrlDto,
    });
  }

  async remove(id: string) {
    return await this.dbService.url.delete({
      where: {
        id,
      },
    });
  }
}
