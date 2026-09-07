import { ApiProperty } from '@nestjs/swagger';
import { PublicUser } from '@/modules/users/dto/public-user.dto';

/** Body returned by register/login/refresh — the refresh token itself never appears here, only
 * as the httpOnly `refresh_token`/`staff_refresh_token` cookie set alongside it. */
export class AuthResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty({ type: PublicUser })
  user: PublicUser;
}
