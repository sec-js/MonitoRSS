import { Type } from "class-transformer";
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
  ValidateIf,
  ValidateNested,
} from "class-validator";
import {
  UserFeedDateCheckOptions,
  UserFeedFormatOptions,
  UserFeedShareManageOptions,
} from "../../../common";
import { UserFeedDisabledCode } from "../types";

export class UpdateUserFeedInputDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  title?: string;

  @IsString()
  @IsNotEmpty()
  @IsUrl()
  @IsOptional()
  url?: string;

  @IsIn([UserFeedDisabledCode.Manual, null])
  @IsOptional()
  disabledCode?: UserFeedDisabledCode | null;

  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @IsOptional()
  passingComparisons?: string[];

  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @IsOptional()
  blockingComparisons?: string[];

  @IsOptional()
  @Type(() => UserFeedFormatOptions)
  @ValidateNested()
  @IsObject()
  formatOptions?: UserFeedFormatOptions;

  @IsOptional()
  @Type(() => UserFeedDateCheckOptions)
  @ValidateNested()
  @IsObject()
  dateCheckOptions?: UserFeedDateCheckOptions;

  @IsOptional()
  @IsObject()
  @Type(() => UserFeedShareManageOptions)
  @ValidateNested()
  shareManageOptions?: UserFeedShareManageOptions;

  @IsNumber()
  @IsOptional()
  @IsPositive()
  @IsInt()
  @ValidateIf(
    (o) =>
      o.userRefreshRateSeconds !== null &&
      o.userRefreshRateSeconds !== undefined
  )
  userRefreshRateSeconds?: number;
}
