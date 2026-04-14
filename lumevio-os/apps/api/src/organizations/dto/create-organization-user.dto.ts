import { IsEmail, IsString, MinLength } from "class-validator";

export class CreateOrganizationUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}
