import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { SupabaseSessionGuard } from '../core/common/guards/supabase-session.guard';
import { InternalApiKeyGuard } from '../core/common/guards/internal-api-key.guard';
import { OAuthConsentDto, OAuthRegisterClientDto } from './dto/oauth.dto';
import { OAuthService } from './oauth.service';

function getOAuthIssuer(): string {
  return (
    process.env.LOMI_OAUTH_ISSUER?.replace(/\/$/, '') ||
    process.env.LOMI_API_BASE_URL?.replace(/\/$/, '') ||
    'http://localhost:3000'
  );
}

function getDashboardBaseUrl(): string {
  return (
    process.env.LOMI_DASHBOARD_BASE_URL?.replace(/\/$/, '') ||
    'http://localhost:5173'
  );
}

@ApiTags('OAuth')
@Controller()
export class OAuthController {
  constructor(private readonly service: OAuthService) {}

  @Get('.well-known/oauth-authorization-server')
  @ApiOperation({
    summary: 'OAuth 2.1 authorization server metadata (RFC 8414)',
  })
  authorizationServerMetadata() {
    return this.service.getAuthorizationServerMetadata(getOAuthIssuer());
  }

  @Post('oauth/register')
  @ApiOperation({ summary: 'Dynamic client registration (RFC 7591)' })
  registerClient(@Body() body: OAuthRegisterClientDto) {
    return this.service.registerClient(body);
  }

  @Get('oauth/authorize')
  @ApiOperation({
    summary: 'Start OAuth authorization (redirects to dashboard consent)',
  })
  async authorize(
    @Query('client_id') clientId: string,
    @Query('redirect_uri') redirectUri: string,
    @Query('response_type') responseType: string,
    @Query('code_challenge') codeChallenge: string,
    @Query('code_challenge_method') codeChallengeMethod: string | undefined,
    @Query('scope') scope: string | undefined,
    @Query('state') state: string | undefined,
    @Query('resource') resource: string | undefined,
    @Res() res: Response,
  ) {
    const params = {
      clientId,
      redirectUri,
      responseType,
      codeChallenge,
      codeChallengeMethod,
      scope,
      state,
      resource,
    };
    await this.service.validateAuthorizeParams(params);
    const redirect = this.service.buildAuthorizeRedirect(
      getDashboardBaseUrl(),
      params,
    );
    return res.redirect(302, redirect);
  }

  @Post('oauth/token')
  @ApiOperation({ summary: 'OAuth token endpoint' })
  token(@Body() body: Record<string, string>) {
    return this.service.token(body);
  }

  @Post('oauth/introspect')
  @ApiOperation({ summary: 'Token introspection (RFC 7662)' })
  introspect(
    @Body()
    body: {
      token?: string;
      client_id?: string;
      client_secret?: string;
    },
  ) {
    return this.service.introspect(body);
  }

  @Post('oauth/introspect/mcp')
  @UseGuards(InternalApiKeyGuard)
  @ApiOperation({
    summary: 'MCP-internal token introspection (includes provisioning_key)',
  })
  introspectMcp(@Body() body: { token?: string }) {
    return this.service.introspectMcp(body);
  }

  @Post('oauth/revoke')
  @ApiOperation({ summary: 'Token revocation (RFC 7009)' })
  revoke(@Body() body: { token?: string }) {
    return this.service.revoke(body);
  }

  @Post('oauth/consent')
  @UseGuards(SupabaseSessionGuard)
  @ApiOperation({
    summary: 'Approve or deny OAuth consent after dashboard login',
  })
  consent(
    @Body() dto: OAuthConsentDto,
    @Req() req: Request & { merchantId: string; supabaseUserEmail?: string },
  ) {
    return this.service.handleConsent({
      clientId: dto.client_id,
      redirectUri: dto.redirect_uri,
      responseType: dto.response_type,
      codeChallenge: dto.code_challenge,
      codeChallengeMethod: dto.code_challenge_method,
      scope: dto.scope,
      state: dto.state,
      resource: dto.resource,
      userId: req.merchantId,
      email: req.supabaseUserEmail,
      approved: dto.approved,
    });
  }
}
