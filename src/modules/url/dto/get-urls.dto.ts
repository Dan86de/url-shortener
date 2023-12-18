import { IsInt, IsOptional, IsPositive, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetUrlsDto {
  @IsString()
  @IsOptional()
  filter?: string;

  @IsInt()
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsPositive()
  limit?: number;

  @IsInt()
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsPositive()
  page?: number;
}
