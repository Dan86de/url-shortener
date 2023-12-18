import { Injectable, NotFoundException, PipeTransform } from '@nestjs/common';
import { UrlService } from '../../url.service';

@Injectable()
export class UrlExistsPipe implements PipeTransform {
  constructor(public readonly urlService: UrlService) {}

  async transform(uid: string) {
    const redirectUrl = await this.urlService.findOne(uid);

    if (!redirectUrl) {
      throw new NotFoundException('Url not found');
    }

    return redirectUrl;
  }
}
