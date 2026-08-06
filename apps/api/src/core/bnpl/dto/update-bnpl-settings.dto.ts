import { IsBoolean, IsNumber, Max, Min } from 'class-validator';

export class UpdateBnplSettingsDto {
  @IsBoolean()
  enabled!: boolean;
}

export class UpdateBnplInterestRateDto {
  @IsNumber()
  @Min(0.5)
  @Max(10)
  interestRate!: number;
}
