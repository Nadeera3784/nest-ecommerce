import { Controller, HttpStatus, Logger, Post, HttpCode, UseGuards, Req, Res, Body } from "@nestjs/common";
import { FastifyRequestWithIpInterface, LoginRequestDto, LoginEvent, LOGIN_EVENT } from "../interfaces";
import { FastifyResponse, RequestFingerprint } from "../../common/interfaces";
import { PasswordEncoder } from "src/user/tools";
import { RolesEnum } from "../enum";
import { Roles } from "../../user/decorators/roles.decorator";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { RequestParser, TokenService } from "../services";
import { UserDocument } from "src/user/interfaces";
import { UserService } from "src/user/services/user.service";
import { SecondFactorService } from "src/user/services/second-factor.service";
import { SuspiciousActivityService } from "src/user/services/suspicious-activity.service";
import { EventDispatcher } from "src/core/event-dispatcher";
import { EncryptionService } from "src/user/services/encryption";

@Controller('api')
export class TokensController {

  constructor(
    private readonly logger: Logger,
    private readonly eventDispatcher: EventDispatcher,
    private readonly userService: UserService,
    private readonly tokenService: TokenService,
    private readonly secondFactorService: SecondFactorService,
    private readonly suspiciousActivityService: SuspiciousActivityService,
    private readonly encryptionService: EncryptionService,
  ) { }

  @Post('/login')
  @Roles(RolesEnum.anonymous)
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  public async login(
    @Req() request: FastifyRequestWithIpInterface,
    @Res() response: FastifyResponse,
    @Body() loginDto: LoginRequestDto,
  ): Promise<void> {
    const user: UserDocument | undefined = await this.userService.findOneByEmail(loginDto.email);
    const parsedRequest: RequestFingerprint = RequestParser.parse(request);
    if (loginDto.encryptedPassword) {
      const passwordCombo: string = await this.encryptionService.decrypt(loginDto.encryptedPassword);
      const plainPassword: string = this.encryptionService.extractPassword(passwordCombo);
      loginDto.plainPassword = plainPassword;
    }

    const isValidPassword: boolean = user
      ? PasswordEncoder.isPasswordValid(loginDto.plainPassword, user.salt, user.password)
      : false;

    const loginEvent: LoginEvent =
      { user, parsedRequest, loginDto, isValidPassword, isSecurityQuestionDefined: false, user };
    await this.eventDispatcher.dispatch(
      LOGIN_EVENT,
      loginEvent,
    );

    if (user.needsApprove && !user.isApproved) {
      throw new UserNotApprovedException();
    }

    if (
      UserService.isSecondFactorAuth(user)
      || user.isAdmin()
      || !(await this.locationService.isLocationVerified(user, parsedRequest))
    ) {
      await this.secondFactorService.generate(loginEvent.user, user.language);
      loginEvent.response = await this.tokenService.issueToken(user, parsedRequest, null, TokenType.secondFactorAuth);
      loginEvent.response && delete loginEvent.response.accessToken;
      loginEvent.response.isSecurityQuestionDefined = loginEvent.isSecurityQuestionDefined;
    }

    this.tokenCookieWriter.setTokenToCookie(
      response,
      loginEvent.response,
    );

    await this.suspiciousActivityService.removeUserFromBlockList(user._id);
    await this.suspiciousActivityService.clearLoginFailures(user._id, null);

    response.status(HttpStatus.OK).send(loginEvent.response);
  }

}